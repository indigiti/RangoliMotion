/* Node-only, zero-dependency contract tests.
   Run: node tests/drawing-contract.test.js */
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const read=(p)=>fs.readFileSync(p,'utf8');
const sandbox={window:{}};
for(const path of ['drawing-contract.js','powder-trace.js','image-processor.js','drawable-designs.js','gallery-data.js']){
  vm.runInNewContext(read(path),sandbox,{filename:path});
}
const {RangoliDrawingRules:rules,RangoliImageProcessor:processor,
  RangoliDrawableDesigns:models,RangoliDesignLibraryData:gallery}=sandbox.window;
const order=['dots','outline','outline_complete','fill','final'];
assert.deepEqual(Array.from(rules.stages),order,'Mandatory stages or order modified');
const t=rules.timeline({dotMs:900,outlineMs:2450,outlineCompleteMs:350,fillMs:2400,finalMs:800});
assert.equal(rules.assertTimeline(t),true);
for(let i=0;i<5;i++){
  assert.equal(rules.stageAt(t.endpoints[i]+1,t),order[i]);
  assert.equal(rules.stageAt(t.endpoints[i+1]-.1,t),order[i]);
}
assert.equal(rules.stageAt(t.endpoints[3],t),'fill');
assert.equal(rules.stageAt(t.endpoints[2],t),'outline_complete');
assert.equal(rules.stageAt(t.totalMs,t),'final');
assert.throws(()=>rules.timeline({dotMs:0,outlineMs:500,outlineCompleteMs:300,fillMs:1000,finalMs:400}));
assert.throws(()=>rules.timeline({dotMs:500,outlineMs:500,outlineCompleteMs:0,fillMs:1000,finalMs:400}));
assert.throws(()=>rules.assertTimeline({endpoints:[0,1,2,2,4,5],totalMs:5}));

assert.equal(gallery.length,31);
assert.equal(gallery.filter(x=>x.mode==='vector_draw').length,6);
assert.equal(gallery.filter(x=>x.mode==='image_preview').length,25);
for(const item of gallery.filter(x=>x.mode==='vector_draw')){
  const model=models[item.modelId];
  assert(model,item.id+' missing vector template');
  assert.equal(rules.validateModel(model),true);
  assert(model.dots.length&&model.strokes.length&&model.fills.length);
}
const image=(width,height,draw)=>{
  const data=new Uint8ClampedArray(width*height*4);
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const rgb=draw(x,y);
    if(rgb){const at=(y*width+x)*4;data.set([...rgb,255],at);}
  }
  return {width,height,data};
};
const sample=image(180,180,(x,y)=>{
  const a=(x-70)**2+(y-90)**2<47**2;
  const b=(x-115)**2+(y-92)**2<34**2;
  const edgeA=Math.abs(Math.hypot(x-70,y-90)-46)<2.8;
  const edgeB=Math.abs(Math.hypot(x-115,y-92)-33)<2.8;
  return edgeA||edgeB?[250,243,227]:a?[234,53,110]:b?[41,155,96]:null;
});
const traced=processor.process(sample);
assert.equal(traced.mode,'image_auto_trace');
assert.equal(traced.tutorialCapable,false);
assert.equal(traced.verification,'automatic_unreviewed');
assert.equal(rules.validateModel(traced,{derived:true}),true);
assert(traced.fills.every(f=>Number.isInteger(f.outlineIndex)&&
  traced.strokes[f.outlineIndex]?.kind==='auto_trace'),
  'Every colour region must be attached to a real outline');
const missingOutline={...traced,fills:[{...traced.fills[0],outlineIndex:-1},...traced.fills.slice(1)]};
assert.throws(()=>rules.validateModel(missingOutline,{derived:true}),/contour stroke/);

assert(traced.dots.length>0&&traced.strokes.length>0&&traced.fills.length>0);
assert(traced.fills.every(f=>f.runs.length>0));
assert(traced.stats.coverage>0.75);
assert(traced.stats.powderPaths>0,'Expected visible powder-line strokes');
assert(traced.strokes.every(s=>s.points.length>1));
assert(traced.dots.some(d=>Math.hypot(d.x-traced.strokes[0].points[0][0],
                                     d.y-traced.strokes[0].points[0][1])<5));
assert.throws(()=>rules.validateModel({...traced,tutorialCapable:true},{derived:true}));
assert.throws(()=>processor.process(image(180,180,()=>null)),/visible image detail|usable regions/);
assert.throws(()=>processor.process({width:0,height:0,data:[]}),/valid pixel data/);

// Integration contract: no bitmap-wedge fallback and no missing upload routes.
const studio=read('studio.js'),markup=read('index.html'),galleryCode=read('gallery.js');
assert(!studio.includes('function wedgeImage'), 'Bitmap wedge renderer must never return');
assert(!studio.includes('function uploadedFrame'), 'Old whole-image preview renderer must not return');
assert(!studio.includes('target.drawImage(source,0,0)'), 'Processed image must not be copied onto Canvas');
assert(studio.includes('RangoliImageProcessor.process'), 'Image processor not connected');
assert(studio.includes('const model=processSourceImage()'), 'Manual uploads missing tracing');
assert(studio.includes('normalizeUpload();processSourceImage()'), 'Background-change recovery missing tracing');
assert(studio.includes('window.RangoliDrawingRules.timeline('), 'Studio does not use mandatory timeline');
assert(studio.includes('RangoliDrawingRules.stageAt('), 'Studio stage labels bypass contract');
assert(studio.includes('const f=rel(p,stops[3],stops[4])')||
       studio.includes('f=rel(p,stops[3],stops[4])'), 'Fill begins before outline complete');
assert(studio.includes('drawFlourish(target,rel(p,stops[4],stops[5]),time)'));
assert(studio.includes('window.RangoliStudioSelectVector'));
assert(galleryCode.includes("upload.dispatchEvent(new Event('change'"),
  'Gallery preview must route through the same upload tracer');
assert(galleryCode.includes("rangoli:processed"), 'Gallery must report trace result');
assert.equal((markup.match(/class="phase-item"/g)||[]).length,5,'UI must show all five stages');
const scripts=[...markup.matchAll(/<script src="([^"]+)"/g)].map(m=>m[1].split('?')[0]);
assert(scripts.indexOf('drawing-contract.js')>=0);
assert(scripts.indexOf('drawing-contract.js')<scripts.indexOf('powder-trace.js'));
assert(scripts.indexOf('powder-trace.js')<scripts.indexOf('image-processor.js'));
assert(scripts.indexOf('image-processor.js')<scripts.indexOf('studio.js'));
assert(fs.existsSync('AGENTS.md')&&fs.existsSync('docs/RANGOLI_DRAWING_RULES.md'));
console.log('PASS: 5 mandatory stages, 6 authored models, 25 preview assets, raster tracer, fail-closed rules and all input routes.');
