/* Exhaustive asset audit.
 * All 31 source WebPs must exist and decode. Authored Draw Mode geometry is
 * release-blocking. Non-authored image traces are diagnostic-only until
 * semantic human review; path counts alone do NOT imply accurate rangoli.
 */
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),{execFileSync}=require('node:child_process');
const ctx={window:{}};
for(const path of ['drawing-contract.js','powder-trace.js','image-processor.js',
  'drawable-designs.js','bhaubeej-model.js','gallery-data.js'])
  vm.runInNewContext(fs.readFileSync(path,'utf8'),ctx,{filename:path});
const items=ctx.window.RangoliDesignLibraryData;
const rules=ctx.window.RangoliDrawingRules,processor=ctx.window.RangoliImageProcessor;
const models=ctx.window.RangoliDrawableDesigns;
const decode=[
  'from PIL import Image',
  'import sys',
  'with Image.open(sys.argv[1]) as image:',
  '  rgba=image.convert("RGBA").resize((180,180),Image.Resampling.LANCZOS)',
  '  sys.stdout.buffer.write(rgba.tobytes())'
].join('\n');
const failures=[],diagnostics=[],escape=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function proof(model,id){
  const lines=model.strokes.map(stroke=>'<path d="'+stroke.points.map((p,i)=>(i?'L':'M')+
    Number(p[0]).toFixed(1)+','+Number(p[1]).toFixed(1)).join(' ')+
    '" fill="none" stroke="'+escape(stroke.color||'#fff5dc')+'" stroke-width="'+
    (stroke.width||2.8)+'" stroke-linecap="round" stroke-linejoin="round"/>').join('');
  const points=model.dots.map(d=>'<circle cx="'+Number(d.x).toFixed(1)+'" cy="'+Number(d.y).toFixed(1)+
    '" r="3.1" fill="#d8a86d" opacity=".65"/>').join('');
  const svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 900">'+
    '<rect width="900" height="900" fill="#142024"/>'+lines+points+'</svg>';
  fs.writeFileSync('artifacts/outline-previews/'+id+'.svg',svg);
}
function finalProof(model,id){
  const poly=pts=>'M '+pts.map(p=>Number(p[0]).toFixed(1)+','+Number(p[1]).toFixed(1)).join(' L ')+' Z';
  const paths=model.fills.map(region=>'<path d="'+poly(region.points)+
    '" fill="'+escape(region.color)+'"/>').join('');
  const strokes=model.strokes.map(line=>'<path d="'+line.points.map((p,i)=>
    (i?'L':'M')+Number(p[0]).toFixed(1)+','+Number(p[1]).toFixed(1)).join(' ')+
    '" fill="none" stroke="'+escape(line.color||'#fff3dd')+'" stroke-width="'+(line.width||3)+
    '" stroke-linecap="round" stroke-linejoin="round"/>').join('');
  const label=model.finalLabel;
  const text=label?'<text x="'+label.x+'" y="'+label.y+'" font-family="sans-serif" font-weight="700"'+
    ' font-size="'+label.size+'" text-anchor="middle" dominant-baseline="middle" fill="'+
    escape(label.color)+'">'+escape(label.text)+'</text>':'';
  const svg='<svg xmlns="http://www.w3.org/2000/svg" width="900" height="900" viewBox="0 0 900 900">'+
    '<rect width="900" height="900" fill="#142024"/>'+paths+strokes+text+'</svg>';
  fs.writeFileSync('artifacts/outline-previews/'+id+'-final.svg',svg);
}
fs.mkdirSync('artifacts/outline-previews',{recursive:true});
if(items.length!==31)failures.push('Gallery must contain exactly 31 image records');
for(const item of items){
  const result={id:item.id,title:item.title,mode:item.mode,asset:item.src,
    tutorialVerified:false,qualityClaim:'No exact image fidelity assumed'};
  try{
    if(!fs.existsSync(item.src))throw Error('Image missing: '+item.src);
    const buf=execFileSync('python3',['-c',decode,item.src],{maxBuffer:180*180*4+4096});
    if(buf.length!==180*180*4)throw Error('WebP decode size mismatch');
    result.assetDecoded=true;
    if(item.mode==='vector_draw'){
      const model=models[item.modelId||item.id];
      if(!model)throw Error('Authored model missing');
      rules.validateModel(model);
      if(model.strokes.length<8||model.fills.length<5)throw Error('Too little vector geometry');
      if(model.id==='b-06'){
        const counts=model.componentCounts||{};
        if(counts.footprints!==2||counts.toes!==10||counts.beads<70||
          counts.flowers<5||counts.leaves<8||counts.diyas!==1||model.finalLabel?.text!=='६. भाऊबीज')
          throw Error('Bhaubeej reference components missing');
        if(model.strokes.some(x=>x.kind==='auto_trace'||x.kind==='powder_line'))
          throw Error('Bhaubeej must use authored semantic paths, never raster fragments');
      }
      proof(model,item.id);
      if(item.id==='b-06')finalProof(model,item.id);
      result.status='authored_draw';result.strokes=model.strokes.length;
      result.fillRegions=model.fills.length;
      result.semanticComponents=model.componentCounts||null;
    }else{
      // Decode/trace for diagnostics only. Do not promote unreviewed assets.
      result.status='reference_only';
      try{
        const model=processor.process({width:180,height:180,data:new Uint8ClampedArray(buf)});
        result.experimentalPaths=model.strokes.length;
        result.experimentalRegionCount=model.fills.length;
        result.qualityClaim='Unreviewed auto-trace; reference-only in gallery';
        proof(model,item.id);
      }catch(e){result.traceWarning=String(e.message||e);}
    }
  }catch(e){
    result.status='error';result.error=String(e.message||e);
    failures.push(item.id+': '+result.error);
  }
  diagnostics.push(result);
  console.log(item.id,result.status,'paths',result.strokes||result.experimentalPaths||0);
}
const approved=diagnostics.filter(x=>x.status==='authored_draw').length;
const reference=diagnostics.filter(x=>x.status==='reference_only').length;
if(approved!==7||reference!==24)failures.push('Expected 7 authored Draw Mode and 24 reference-only entries');
const cards=diagnostics.map(d=>'<article><h3>'+escape(d.id+' '+d.title)+'</h3>'+
  (fs.existsSync('artifacts/outline-previews/'+d.id+'.svg')?
    '<img src="'+d.id+'.svg" alt="Geometry diagnostic">':'<p>No trace preview</p>')+
  '<p>'+escape(d.status)+' · '+(d.strokes||d.experimentalPaths||0)+' paths</p></article>');
const html='<!doctype html><html lang="en"><meta charset="utf-8">'+
  '<title>RangoliMotion geometry audit</title><style>body{font-family:system-ui;background:#111c1f;color:#f2eee6;padding:24px}'+
  'main{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:16px}'+
  'article{border:1px solid #455;padding:12px;border-radius:12px}img{width:100%;background:#142024}</style>'+
  '<h1>31-image audit — 7 semantic vectors, 24 unreviewed references</h1><p>The b-06-final.svg file is a manually reviewable complete-vector proof; no image fidelity is automatically asserted.</p><main>'+cards.join('')+'</main></html>';
fs.writeFileSync('artifacts/outline-previews/index.html',html);
fs.writeFileSync('artifacts/outline-audit.json',JSON.stringify({
  generatedBy:'tests/gallery-outline-audit.cjs',galleryCount:diagnostics.length,
  authoredCount:approved,referenceCount:reference,failures,designs:diagnostics
},null,2)+'\n');
console.log('AUDIT',diagnostics.length,'authored',approved,'reference-only',reference,'failures',failures.length);
if(failures.length){console.error(failures.join('\n'));process.exitCode=1;}
