/* Audit all 31 gallery assets. Python Pillow decodes WebP only in CI.
   The deployed browser app does not depend on Python. */
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),
  {execFileSync}=require('node:child_process');
const ctx={window:{}};
for(const name of ['drawing-contract.js','powder-trace.js','image-processor.js','gallery-data.js'])
  vm.runInNewContext(fs.readFileSync(name,'utf8'),ctx,{filename:name});
const items=ctx.window.RangoliDesignLibraryData, rules=ctx.window.RangoliDrawingRules,
  processor=ctx.window.RangoliImageProcessor;
const decoder=[
  'import sys',
  'from PIL import Image',
  'with Image.open(sys.argv[1]) as img:',
  '    frame=img.convert("RGBA").resize((180,180),Image.Resampling.LANCZOS)',
  '    sys.stdout.buffer.write(frame.tobytes())'
].join('\n');
const audit=[],faults=[];
for(const item of items){
  const entry={id:item.id,title:item.title,mode:item.mode,asset:item.src};
  try{
    if(!fs.existsSync(item.src))throw Error('Asset missing');
    const bytes=execFileSync('python3',['-c',decoder,item.src],{maxBuffer:250000});
    if(bytes.length!==180*180*4)throw Error('Invalid WebP decoding length: '+bytes.length);
    const model=processor.process({width:180,height:180,data:new Uint8ClampedArray(bytes)});
    rules.validateModel(model,{derived:true});
    Object.assign(entry,{
      status:'traced',dots:model.dots.length,strokes:model.strokes.length,
      powderPaths:model.stats.powderPaths,contourPaths:model.stats.contourPaths,
      fillRegions:model.fills.length,coverage:Math.round(model.stats.coverage*1000)/1000,
      sourcePixelsCopied:false,verifiedTutorial:false,
      readyForDrawPreview:model.strokes.length>=3&&model.fills.length>=2
    });
    if(!entry.readyForDrawPreview)faults.push(item.id+': insufficient outline or fill detail');
  }catch(error){
    entry.status='preview_only';entry.error=String(error.message||error);
    faults.push(item.id+': '+entry.error);
  }
  audit.push(entry);
  console.log(item.id.padEnd(5),entry.status.padEnd(12),
    ('paths '+String(entry.strokes??0).padStart(3)).padEnd(10),
    ('powder '+String(entry.powderPaths??0).padStart(3)).padEnd(11),
    ('fills '+String(entry.fillRegions??0).padStart(3)).padEnd(10),
    'coverage',entry.coverage??'-');
}
if(audit.length!==31)faults.push('Not all 31 designs were audited');
fs.mkdirSync('artifacts',{recursive:true});
fs.writeFileSync('artifacts/outline-audit.json',JSON.stringify({
  generatedBy:'tests/gallery-outline-audit.cjs',galleryCount:audit.length,
  status:faults.length?'needs_review':'pass',failures:faults,designs:audit
},null,2)+'\n');
console.log('\nTOTAL',audit.length,'TRACED',audit.filter(x=>x.status==='traced').length,
  'PREVIEW-ONLY',audit.filter(x=>x.status!=='traced').length);
if(faults.length){console.error('\nOUTLINE AUDIT FAILED:\n'+faults.join('\n'));process.exitCode=1;}
else console.log('PASS: 31/31 images have isolated outline paths and fill regions.');
