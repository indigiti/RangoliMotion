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
const svgEsc=value=>String(value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const svgPath=pts=>pts.map((p,i)=>(i?'L':'M')+p[0].toFixed(1)+','+p[1].toFixed(1)).join(' ');
function writeOutlineSvg(entry,model){
  const strokes=model.strokes.map(s=>'<path d="'+svgPath(s.points)+'" fill="none" stroke="'+svgEsc(s.color||'#fff6e8')+
    '" stroke-width="'+Math.max(1,s.width||2.6).toFixed(1)+'" stroke-linecap="round" stroke-linejoin="round"/>').join('');
  const dots=model.dots.map(d=>'<circle cx="'+d.x.toFixed(1)+'" cy="'+d.y.toFixed(1)+
    '" r="3.5" fill="#ffc477" opacity=".85"/>').join('');
  const markup='<svg xmlns="http://www.w3.org/2000/svg" width="450" height="450" viewBox="0 0 900 900">'+
    '<rect width="900" height="900" fill="#142024"/><g>'+strokes+'</g><g>'+dots+'</g>'+
    '<text x="24" y="865" font-size="25" fill="#f8d5aa">'+svgEsc(entry.id+' · contour audit')+'</text></svg>';
  fs.mkdirSync('artifacts/outline-previews',{recursive:true});
  fs.writeFileSync('artifacts/outline-previews/'+entry.id+'.svg',markup);
}

for(const item of items){
  const entry={id:item.id,title:item.title,mode:item.mode,asset:item.src};
  try{
    if(!fs.existsSync(item.src))throw Error('Asset missing');
    const bytes=execFileSync('python3',['-c',decoder,item.src],{maxBuffer:250000});
    if(bytes.length!==180*180*4)throw Error('Invalid WebP decoding length: '+bytes.length);
    const model=processor.process({width:180,height:180,data:new Uint8ClampedArray(bytes)});
    rules.validateModel(model,{derived:true});
    writeOutlineSvg(entry,model);
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
fs.mkdirSync('artifacts/outline-previews',{recursive:true});
const galleryHtml=['<!doctype html><html lang="en"><meta charset="utf-8">'+
  '<title>RangoliMotion 31-design outline QA</title><style>body{font-family:system-ui;background:#101719;color:#eee;padding:28px}'+
  '.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:18px}'+
  'article{background:#1d2828;padding:12px;border-radius:14px}img{width:100%;aspect-ratio:1;object-fit:contain}small{color:#e8ba83}</style>'+
  '<h1>31 rangoli — outline-only audit</h1><p>Orange dots are estimated guide anchors; white paths are traced contours. These are unreviewed.</p><div class="grid">'];
for(const item of audit)galleryHtml.push('<article><h3>'+svgEsc(item.id+' '+item.title)+
  '</h3>'+(item.status==='traced'?'<img src="'+item.id+'.svg" alt="Outline preview">':
  '<p>Needs attention: '+svgEsc(item.error||'Insufficient geometry')+'</p>')+
  '<small>Paths: '+(item.strokes??0)+' · powder: '+(item.powderPaths??0)+' · fills: '+(item.fillRegions??0)+'</small></article>');
galleryHtml.push('</div></html>');
fs.writeFileSync('artifacts/outline-previews/index.html',galleryHtml.join('
'));
fs.mkdirSync('artifacts',{recursive:true});
fs.writeFileSync('artifacts/outline-audit.json',JSON.stringify({
  generatedBy:'tests/gallery-outline-audit.cjs',galleryCount:audit.length,
  status:faults.length?'needs_review':'pass',failures:faults,designs:audit
},null,2)+'\n');
console.log('\nTOTAL',audit.length,'TRACED',audit.filter(x=>x.status==='traced').length,
  'PREVIEW-ONLY',audit.filter(x=>x.status!=='traced').length);
if(faults.length){console.error('\nOUTLINE AUDIT FAILED:\n'+faults.join('\n'));process.exitCode=1;}
else console.log('PASS: 31/31 images have isolated outline paths and fill regions.');
