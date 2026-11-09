/* Browser-engine integration smoke tests without Playwright or external dependencies.
   Synthetic Canvas data tests image-upload routing through the five-stage timeline. */
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const read=p=>fs.readFileSync(p,'utf8');
const win={};for(const f of ['drawing-contract.js','powder-trace.js','image-processor.js','drawable-designs.js'])
  vm.runInNewContext(read(f),{window:win},{filename:f});
const els=new Map();function el(id){
  if(!els.has(id)){
    const obj={id,textContent:'',innerHTML:'',checked:false,hidden:false,
      value:({durationRange:'6',outlineSpeedRange:'.75',fsSpeedRange:'.75',realismRange:'1',pauseRange:'32',themeSelect:'midnight'}[id]||'0'),
      min:'0',max:'10',style:{setProperty(){}},classList:{add(){},remove(){},toggle(){}},
      listeners:{},addEventListener(type,fn){this.listeners[type]=fn},setAttribute(){},
      querySelector:q=>el(id+' '+q),querySelectorAll(){return[]},
      scrollIntoView(){},getContext:ctx,width:900,height:900};
    els.set(id,obj);
  }
  return els.get(id);
}
const gradient={addColorStop(){}};
let activePixels=makePixels(true);
function makePixels(visible){
  const n=900,data=new Uint8ClampedArray(n*n*4);
  if(visible)for(let y=240;y<660;y++)for(let x=240;x<660;x++){
    const radius=Math.hypot(x-450,y-445);
    if(radius>157)continue;
    const i=(y*n+x)*4;
    const border=Math.abs(radius-154)<3;
    data[i]=border?248:x<450?235:40;data[i+1]=border?242:x<450?55:175;data[i+2]=border?228:x<450?105:75;data[i+3]=255;
  }
  return {width:n,height:n,data};
}
function ctx(){
  const c={createLinearGradient:()=>gradient,createRadialGradient:()=>gradient,
    createImageData:(w,h)=>({width:w,height:h,data:new Uint8ClampedArray(w*h*4)}),
    getImageData:()=>activePixels};
  for(const k of ['clearRect','fillRect','strokeRect','drawImage','beginPath','closePath','arc','ellipse','moveTo',
    'lineTo','bezierCurveTo','quadraticCurveTo','fill','stroke','clip','save','restore','translate','rotate',
    'scale','fillText','strokeText','putImageData','setTransform'])c[k]=()=>{};
  return c;
}
const listeners={},events=[];
const doc={getElementById:el,createElement:()=>({width:0,height:0,getContext:ctx,
    addEventListener(){},classList:{add(){},remove(){}},style:{}}),
  querySelector:q=>el('query '+q),
  querySelectorAll:()=>Array.from({length:5},(_,i)=>el('phase '+i)),
  addEventListener(type,cb){listeners[type]=cb},
  dispatchEvent(ev){events.push(ev);listeners[ev.type]?.(ev)},
  fullscreenElement:null};
const perf={now:()=>1000};
class Path2DStub {moveTo(){}lineTo(){}closePath(){}rect(){}arc(){}}
class ImageStub {
  naturalWidth=200;naturalHeight=200;
  set src(value){this.onload?.()}
}
class EventStub {constructor(type,options){this.type=type;this.detail=options?.detail}}
const fakeURL={createObjectURL:()=> 'blob:fake',revokeObjectURL(){}};
const errors=[];
const report={error:(...v)=>errors.push(v.map(String).join(' ')),log(){}};
vm.runInNewContext(read('studio.js'),{window:win,document:doc,performance:perf,
  requestAnimationFrame(){},Path2D:Path2DStub,Image:ImageStub,CustomEvent:EventStub,
  URL:fakeURL,setTimeout:()=>1,clearTimeout(){},console:report},{filename:'studio.js'});
const diag=()=>win.RangoliPreviewDiagnostics();
assert.equal(diag().mode,'vector-sample');
assert.equal(win.RangoliStudioSelectVector('a-06'),true);
assert.equal(diag().mode,'vector_draw');
assert(diag().fillCount>0&&diag().strokeCount>0);
function upload(){
  el('fileInput').listeners.change({target:{files:[{name:'upload.webp',size:1024,type:'image/webp'}],value:'file'}});
}
upload();
assert.equal(diag().mode,'image_auto_trace','Uploads must use traced paths, not image wipes');
assert.equal(diag().verification,'automatic_unreviewed');
assert(diag().strokeCount>=3,'Expected detailed traced outlines');
assert(diag().fillCount>0&&diag().strokeCount>0);
assert.equal(events.at(-1).detail.status,'traced');
const stages=[];
for(let p=0;p<=1000;p+=10){
  el('timelineRange').listeners.input({target:{value:String(p)}});
  const stage=diag().stage;
  if(!stages.includes(stage))stages.push(stage);
}
assert.deepEqual(stages,['dots','outline','outline_complete','fill','final']);
activePixels=makePixels(false);
upload();
assert.equal(diag().mode,'vector-sample','Untraceable image must fail closed, no fake drawing');
assert.equal(events.at(-1).detail.status,'failed');
assert(errors.length>0,'Failed trace must be logged');
console.log('PASS: real engine routes vector and raster images through 5 stages; invalid images fail closed.');
