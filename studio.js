
/* Rangoli Motion Studio 4.0 · Fullscreen & Organic Path Timing
   Self-contained, no external libraries or network access.
   Built-in artwork: authentic authored vector paths, animated dot -> stroke -> paint.
   Raster uploads: synthetic dots, image-derived edge contours, sequential sector fills.
   Uploaded image animation is decorative, NOT a reconstruction of the artist's strokes.
*/
(() => {
  'use strict';
  const SIZE = 900, C = SIZE / 2, TAU = Math.PI * 2;
  const $ = (id) => document.getElementById(id);
  const canvas = $('previewCanvas'), ctx = canvas.getContext('2d', { alpha: false });
  const thumbCanvas = $('artworkThumb'), thumbCtx = thumbCanvas.getContext('2d');
  const source = document.createElement('canvas'), raw = document.createElement('canvas');
  const outline = document.createElement('canvas');
  const backdropCache = document.createElement('canvas'), vectorOutlineCache = document.createElement('canvas');
  for (const cv of [source, raw, outline, backdropCache, vectorOutlineCache]) cv.width = cv.height = SIZE;
  const srcCtx = source.getContext('2d', { willReadFrequently: true });
  const rawCtx = raw.getContext('2d', { willReadFrequently: true });
  const edgeCtx = outline.getContext('2d');
  const backdropCtx = backdropCache.getContext('2d'), vectorOutlineCtx=vectorOutlineCache.getContext('2d');
  const state = {
    duration: 6, baseDuration: 6, outlineSpeed: .75, realism: 1, pauseMs: 32, loop: true, theme: 'midnight', sparkle: true, removeBackground: true,
    playing: true, elapsed: 0, startedAt: performance.now(), sample: true, designId: 'lotus', geometricColors: false,
    name: 'Lotus mandala', detail: 'Sample artwork · Vector drawn', rect: {x:75,y:75,w:750,h:750},
    image: null, recording: false, recorder: null, recordStream: null, recordParts: [], recordStopping: false,
    seeking: false
  };
  let stops = [0, .15, .53, .88, 1];
  let timings = {dotMs: 900, outlineMs: 2280, fillMs: 2100, holdMs: 720, totalMs: 6000};
  let naturalSchedule = [];
  let fullscreenFallback = false;
  const palettes = {
    midnight: {a:'#101a1e',b:'#182729',floor:'#0c1518',grid:'#a1a99c',dot:'#f3d6aa',line:'#f1d8b3'},
    berry: {a:'#731831',b:'#751b38',floor:'#541021',grid:'#fbe7de',dot:'#fff5ec',line:'#fffaf2'},
    clay: {a:'#3d2b29',b:'#704640',floor:'#382927',grid:'#e4b99b',dot:'#ffdfad',line:'#f5d6b4'},
    sand: {a:'#e8d9bd',b:'#f6e7d0',floor:'#decbad',grid:'#785f48',dot:'#97633e',line:'#875a3d'}
  };
  const strokes = [], petals = [], dots = [], importedDots = [], geometricFills = [];
  let toastTimer = null, lastStage = '';
  const clamp = (n, a=0, b=1) => Math.max(a, Math.min(b, n));
  const ease = (n) => (n = clamp(n), n*n*(3-2*n));
  const lerp = (a,b,t) => a+(b-a)*t;
  const rel = (p,a,b) => clamp((p-a)/(b-a));
  const rad = (r,a) => ({x:C+r*Math.cos(a), y:C+r*Math.sin(a)});
  const rotated = (x,y,a) => ({x:C+x*Math.cos(a)-y*Math.sin(a), y:C+x*Math.sin(a)+y*Math.cos(a)});

  function notify(message) {
    $('toast').textContent = message;
    $('toast').classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(()=>$('toast').classList.remove('show'),3300);
  }
  function bezier(a,b,c,d,t) {
    const q=1-t;
    return q*q*q*a + 3*q*q*t*b + 3*q*t*t*c + t*t*t*d;
  }
  function pathLength(pts) {
    let len=0;
    for(let i=1;i<pts.length;i++) len+=Math.hypot(pts[i].x-pts[i-1].x,pts[i].y-pts[i-1].y);
    return len;
  }
  function stroke(points,color='rgba(255,232,196,.90)',weight=2.2,glow=false,kind='detail') {
    strokes.push({points,color,weight,len:pathLength(points),glow,kind});
  }
  function ring(r,color,weight=2.2) {
    const points=[]; const count=Math.max(110,Math.ceil(r*1.7));
    for(let i=0;i<=count;i++) points.push(rad(r,i/count*TAU-Math.PI/2));
    stroke(points,color,weight,false,'ring');
  }
  function petal(inner,outer,width,a,fill,highlight,group) {
    const L=outer-inner,pts=[];
    for(let i=0;i<=22;i++) {
      const t=i/22;
      pts.push(rotated(bezier(inner,inner+.28*L,outer-.18*L,outer,t),
        bezier(0,-width*1.25,-width*.83,0,t),a));
    }
    for(let i=1;i<=22;i++) {
      const t=i/22;
      pts.push(rotated(bezier(outer,outer-.18*L,inner+.28*L,inner,t),
        bezier(0,width*.83,width*1.25,0,t),a));
    }
    const centerPoint=rad((inner+outer)*.5,a);
    const shape={inner,outer,width,a,fill,highlight,group,points:pts,center:centerPoint};
    petals.push(shape);
    stroke([...pts,pts[0]],'rgba(255,237,210,.94)',2.35,false,group<=2?'petal':'detail');
    // Fine hand-drawn vein from base to near tip.
    const vein=[];
    for(let j=0;j<=16;j++) vein.push(rad(lerp(inner+14,outer-16,j/16),a));
    stroke(vein,'rgba(255,223,181,.42)',1.05);
  }
  function buildSample() {
    dots.length=0;strokes.length=0;petals.length=0;
    // Dot anchors are deliberately aligned with actual vector geometry.
    dots.push({x:C,y:C,size:5});
    for(const [count,r,size,offset] of [[10,108,4.1,0],[14,207,4.8,Math.PI/14],[20,310,5.2,0],[36,356,4.6,0],[48,383,2.8,0]]) {
      for(let i=0;i<count;i++) dots.push({...rad(r,i*TAU/count+offset),size});
    }
    // Outline stroke sequence begins near the centre and expands outward.
    ring(27,'rgba(255,229,190,.95)',3.1);
    for(let i=0;i<10;i++)petal(27,108,27,i*TAU/10+(Math.PI/10),i%2?'#e8a774':'#64bda9','#ffe0ab',0);
    ring(116,'rgba(255,222,165,.9)',3.6);
    ring(125,'rgba(255,228,181,.65)',1.6);
    for(let i=0;i<14;i++)petal(126,208,32,i*TAU/14+(Math.PI/14),i%3===0?'#76c8b3':i%2?'#da8193':'#ecb677','#ffe8b1',1);
    ring(220,'rgba(255,223,168,.95)',3.4);
    ring(231,'rgba(255,225,178,.53)',1.7);
    for(let i=0;i<20;i++)petal(231,313,30,i*TAU/20,i%4===0?'#74bfb6':i%2?'#d97f91':'#eda069','#ffe0ac',2);
    ring(327,'rgba(255,230,180,.94)',3.9);
    ring(339,'rgba(255,219,172,.55)',1.5);
    for(let i=0;i<36;i++)petal(337,356,13,i*TAU/36+(Math.PI/36),i%2?'#efbd74':'#73baaa','#ffe0b1',3);
    ring(371,'rgba(255,220,165,.92)',2.8);
    ring(376,'rgba(235,172,133,.6)',1.4);
    // A central medallion & small powder flecks.
    ring(14,'rgba(255,233,184,.96)',2.3);
    dots.sort((a,b)=> Math.hypot(a.x-C,a.y-C)-Math.hypot(b.x-C,b.y-C) || Math.atan2(a.y-C,a.x-C)-Math.atan2(b.y-C,b.x-C));
  }
  buildSample();
  function buildGeometric() {
    const data=window.RangoliGeometricDesign;
    if(!data || !data.paths || !data.paths.length)throw new Error('Geometric design data missing.');
    strokes.length=0;petals.length=0;dots.length=0;geometricFills.length=0;
    // Coordinates are traced from the supplied 350 × 350 image, excluding its text labels.
    const conv=(v)=>({x:C+(v[0]-175)*2.17,y:C+(v[1]-175)*2.17});
    for(const d of data.dots)dots.push({...conv(d),size:4});
    for(const line of data.paths){
      const points=line.p.map(conv);
      if(points.length>1)stroke(points,'rgba(255,249,244,.96)',4.8,false,'geometric');
    }
    for(const region of data.fills){
      const verts=region.p.map(conv),path=new Path2D();
      path.moveTo(verts[0].x,verts[0].y);
      for(let i=1;i<verts.length;i++)path.lineTo(verts[i].x,verts[i].y);
      path.closePath();
      geometricFills.push({path,center:conv(region.c),area:region.area});
    }
    // Dots in source are guides; timed strokes are image-derived and only illustrative.
  }
  let totalStrokes=strokes.reduce((s,v)=>s+v.len,0);

  /* Actual outline time is independent of the base stage duration. Each path
     is sampled by geometric distance, curvature adds time near turns, and
     authored outline strokes receive a real stationary dwell at their ends. */
  function rebuildNaturalTiming() {
    const prev = timings;
    const baseMs = state.baseDuration * 1000;
    const dotMs = baseMs * .15;
    const outlineTravelMs = baseMs * .38 / state.outlineSpeed;
    const fillMs = baseMs * .35;
    const holdMs = baseMs * .12;

    const measures = strokes.map(s => {
      const prefix=[0];
      let weighted=0;
      for(let i=1;i<s.points.length;i++){
        const a=s.points[i-1],b=s.points[i];
        const distance=Math.hypot(b.x-a.x,b.y-a.y);
        let curvature=0;
        if(i<s.points.length-1){
          const d=s.points[i+1], v1x=b.x-a.x,v1y=b.y-a.y,v2x=d.x-b.x,v2y=d.y-b.y;
          const denom=Math.hypot(v1x,v1y)*Math.hypot(v2x,v2y);
          if(denom>1e-6)curvature=Math.acos(clamp((v1x*v2x+v1y*v2y)/denom,-1,1));
        }
        const corner=clamp(curvature / .32);
        const breathing=1 + state.realism*.10*Math.sin(i*.15+s.points.length*.45);
        weighted+=distance*(1+state.realism*2.6*corner*corner)*breathing;
        prefix.push(weighted);
      }
      return {s,prefix,weighted};
    });
    const totalWeight=measures.reduce((sum,m)=>sum+m.weighted,0) || 1;
    naturalSchedule=[];
    let clock=0;
    for(const m of measures){
      const travel=outlineTravelMs * m.weighted / totalWeight;
      const dwell = m.s.kind==='petal' ? state.pauseMs : m.s.kind==='ring' ? state.pauseMs*.65 : m.s.kind==='geometric' && m.s.len>35 ? state.pauseMs*.52 : 0;
      const start=clock, drawEnd=start+travel, pauseEnd=drawEnd+dwell;
      naturalSchedule.push({...m,start,drawEnd,pauseEnd,travel,dwell});
      clock=pauseEnd;
    }
    timings={dotMs,outlineMs:clock,fillMs,holdMs,totalMs:dotMs+clock+fillMs+holdMs};
    state.duration=timings.totalMs / 1000;
    stops=[0,dotMs/timings.totalMs,(dotMs+clock)/timings.totalMs,(dotMs+clock+fillMs)/timings.totalMs,1];
    return prev;
  }

  function naturalOutlines(target,elapsedMs){
    if(elapsedMs<=0)return null;
    let tip=null;
    for(const row of naturalSchedule){
      if(elapsedMs<=row.start)break;
      if(elapsedMs>=row.drawEnd){
        tip=drawPartialStroke(target,row.s,1) || tip;
        if(elapsedMs<row.pauseEnd)return {point:tip,paused:true};
        continue;
      }
      const weightTarget=row.weighted*clamp((elapsedMs-row.start)/Math.max(1,row.travel));
      let low=1,high=row.prefix.length-1;
      while(low<high){const mid=(low+high)>>1;if(row.prefix[mid]<weightTarget)low=mid+1;else high=mid;}
      const i=low,prior=row.prefix[i-1],span=row.prefix[i]-prior;
      // Convert weighted sample index back to the real path length expected by drawPartialStroke.
      let walked=0;
      for(let k=1;k<i;k++)walked+=Math.hypot(row.s.points[k].x-row.s.points[k-1].x,row.s.points[k].y-row.s.points[k-1].y);
      walked+=Math.hypot(row.s.points[i].x-row.s.points[i-1].x,row.s.points[i].y-row.s.points[i-1].y)*(span>1e-6?(weightTarget-prior)/span:0);
      tip=drawPartialStroke(target,row.s,walked/Math.max(.01,row.s.len));
      return {point:tip,paused:false};
    }
    return tip ? {point:tip,paused:false}:null;
  }

  function drawPowderHead(target,cursor,time){
    if(!cursor || !cursor.point)return;
    const point=cursor.point;
    target.save();
    const g=target.createRadialGradient(point.x,point.y,0,point.x,point.y,cursor.paused?16:29);
    g.addColorStop(0,'rgba(255,244,212,.9)');g.addColorStop(.22,'rgba(255,206,153,.45)');g.addColorStop(1,'rgba(255,196,118,0)');
    target.fillStyle=g;target.beginPath();target.arc(point.x,point.y,cursor.paused?16:29,0,TAU);target.fill();
    if(!cursor.paused){
      const bucket=Math.floor(time/60);
      for(let i=0;i<17;i++){
        const a=((i*2.399963+bucket*.65)%(TAU));
        const radius=(4+((i*17+bucket*9)%21));
        const x=point.x+Math.cos(a)*radius,y=point.y+Math.sin(a)*radius;
        target.globalAlpha=.11+(i%5)*.06;
        target.fillStyle=i%3?'#f6d4a3':'#fff6cf';
        target.beginPath();target.arc(x,y,.65+(i%4)*.35,0,TAU);target.fill();
      }
    }
    target.globalAlpha=1;target.fillStyle='#fff0d2';target.beginPath();target.arc(point.x,point.y,cursor.paused?3.2:4.1,0,TAU);target.fill();
    target.restore();
  }

  function preserveStageAndRebuild(){
    const elapsed=state.elapsed,old=timings;
    let segment,frac;
    if(elapsed<old.dotMs){segment='dots';frac=elapsed/old.dotMs;}
    else if(elapsed<old.dotMs+old.outlineMs){segment='lines';frac=(elapsed-old.dotMs)/old.outlineMs;}
    else if(elapsed<old.dotMs+old.outlineMs+old.fillMs){segment='fill';frac=(elapsed-old.dotMs-old.outlineMs)/old.fillMs;}
    else {segment='finish';frac=(elapsed-old.dotMs-old.outlineMs-old.fillMs)/old.holdMs;}
    const wasPlaying=state.playing;
    rebuildNaturalTiming();
    const mapped=segment==='dots'?frac*timings.dotMs
      :segment==='lines'?timings.dotMs+frac*timings.outlineMs
      :segment==='fill'?timings.dotMs+timings.outlineMs+frac*timings.fillMs
      :timings.dotMs+timings.outlineMs+timings.fillMs+frac*timings.holdMs;
    setElapsed(mapped,wasPlaying);
    updateTimingLabels();
  }

  function updateTimingLabels(){
    $('durationLabel').textContent=state.baseDuration.toFixed(1)+' sec';
    $('outlineSpeedValue').textContent=state.outlineSpeed.toFixed(2)+'×';
    $('realismValue').textContent=Math.round(state.realism*100)+'%';
    $('pauseValue').textContent=Math.round(state.pauseMs)+' ms';
    $('actualDuration').textContent=state.duration.toFixed(1)+'s total';
    $('outlineDuration').textContent=(timings.outlineMs/1000).toFixed(1)+'s outline';
    $('timeTotal').textContent=formatTime(state.duration);
    for(const id of ['durationRange','outlineSpeedRange','realismRange','pauseRange']){
      const input=$(id);input.style.setProperty('--range',((Number(input.value)-Number(input.min))/(Number(input.max)-Number(input.min))*100)+'%');
    }
  }


  function background(target) {
    const p=palettes[state.theme];
    const g=target.createRadialGradient(C,400,45,C,C,690);
    g.addColorStop(0,p.b);g.addColorStop(1,p.floor);
    target.fillStyle=g;target.fillRect(0,0,SIZE,SIZE);
    target.save();target.translate(C,C);
    for(let r=116;r<450;r+=116){target.beginPath();target.arc(0,0,r,0,TAU);target.lineWidth=1;target.strokeStyle=state.theme==='sand'?'#816f5b17':'#e4d5b717';target.stroke();}
    for(let i=0;i<12;i++){const a=i*TAU/12;target.beginPath();target.moveTo(Math.cos(a)*414,Math.sin(a)*414);target.lineTo(Math.cos(a)*424,Math.sin(a)*424);target.strokeStyle=state.theme==='sand'?'#75583e31':'#fff2cf35';target.lineWidth=1.2;target.stroke();}
    target.restore();
    // Deterministic fine-grain finish; deliberately not random per frame.
    for(let i=0;i<570;i++){
      const x=(i*287.39+63.8)%SIZE,y=(i*193.67+51.2)%SIZE;
      target.fillStyle=state.theme==='sand'?'#5d4c3510':'#fff3db12';
      target.fillRect(x,y,(i%4===0?1.6:.8),(i%4===0?1.6:.8));
    }
    const vignette=target.createRadialGradient(C,C,230,C,C,690);
    vignette.addColorStop(0,'#00000000');vignette.addColorStop(1,state.theme==='sand'?'#6952362a':'#0000006b');
    target.fillStyle=vignette;target.fillRect(0,0,SIZE,SIZE);
  }
  function drawDots(target,list,visible) {
    visible=clamp(visible);
    const limit=Math.min(list.length,Math.ceil(list.length*visible));
    for(let i=0;i<limit;i++){
      const d=list[i],amount=clamp(list.length*visible-i);
      const size=d.size * (.55+.45*ease(amount));
      target.beginPath();target.arc(d.x,d.y,size,0,TAU);
      target.fillStyle=palettes[state.theme].dot;
      target.globalAlpha=.25+.75*amount;
      target.fill();
      if(state.sparkle && amount>.7 && i%5===0) {
        target.beginPath();target.arc(d.x,d.y,size*2.3,0,TAU);
        target.fillStyle='#e4ac7545';target.fill();
      }
    }
    target.globalAlpha=1;
  }
  function drawPartialStroke(target,s,t) {
    if(t<=0)return null;
    const limit=s.len*clamp(t);
    const pts=s.points;
    target.save();target.strokeStyle=state.theme==='sand'?'#815b42':s.color;
    target.lineWidth=s.weight;target.lineJoin='round';target.lineCap='round';
    target.beginPath();target.moveTo(pts[0].x,pts[0].y);
    let walked=0,last=pts[0];
    for(let i=1;i<pts.length;i++){
      const a=pts[i-1],b=pts[i],dist=Math.hypot(b.x-a.x,b.y-a.y);
      if(walked+dist>=limit){const q=dist?(limit-walked)/dist:0;last={x:lerp(a.x,b.x,q),y:lerp(a.y,b.y,q)};target.lineTo(last.x,last.y);break;}
      target.lineTo(b.x,b.y);last=b;walked+=dist;
    }
    target.stroke();target.restore();
    return last;
  }
  function vectorOutlines(target,progress) {
    const total=totalStrokes*clamp(progress);
    let distance=0,tip=null;
    for(const s of strokes){
      if(distance>=total)break;
      const local=clamp((total-distance)/s.len);
      tip=drawPartialStroke(target,s,local)||tip;
      distance+=s.len;
    }
    return tip;
  }
  function traceShape(target,pts) {
    target.beginPath();target.moveTo(pts[0].x,pts[0].y);
    for(let i=1;i<pts.length;i++)target.lineTo(pts[i].x,pts[i].y);
    target.closePath();
  }
  function fillPetal(target,item,progress) {
    if(progress<=0)return;
    const p=ease(progress);
    target.save();traceShape(target,item.points);target.clip();
    target.translate(C,C);target.rotate(item.a);
    const grad=target.createLinearGradient(item.inner,-item.width,item.outer,item.width);
    grad.addColorStop(0,item.fill);grad.addColorStop(.64,item.fill);grad.addColorStop(1,item.highlight);
    target.fillStyle=grad;target.globalAlpha=.98;
    target.fillRect(item.inner-3,-item.width*2.2,(item.outer-item.inner+10)*p,item.width*4.4);
    if(state.sparkle){
      target.globalAlpha=.2*p;target.fillStyle='#fff4d6';
      for(let i=0;i<12;i++){
        const x=item.inner+11+(i*23.81)%(item.outer-item.inner-18);
        const y=(((i*17.3)%77)/77-.5)*item.width*1.5;
        target.fillRect(x,y,i%3===0?2.3:1.3,i%3===0?2.3:1.3);
      }
    }
    target.restore();
  }
  function vectorFills(target,progress) {
    // Inner rings bloom first; overlapping fades create a flowing cascade.
    const n=petals.length,offset=1.6;
    for(let i=0;i<n;i++){
      const p=clamp((progress*(n+offset)-(i-.2))/2);
      if(p>0)fillPetal(target,petals[i],p);
    }
    if(progress>.92){
      const opacity=ease(rel(progress,.92,1));
      target.save();target.globalAlpha=opacity;
      target.beginPath();target.arc(C,C,14,0,TAU);target.fillStyle='#fee6a9';target.fill();
      target.beginPath();target.arc(C,C,7,0,TAU);target.fillStyle='#e79c82';target.fill();
      target.restore();
    }
  }
  function drawFlourish(target,progress,time) {
    if(!state.sparkle)return;
    target.save();target.globalCompositeOperation=state.theme==='sand'?'source-over':'screen';
    const n=19;
    for(let i=0;i<n;i++){
      const a=i*2.4+Math.sin(time*.0004+i)*.09,r=70+(i*59)%315;
      const x=C+Math.cos(a)*r,y=C+Math.sin(a)*r;
      const twinkle=(Math.sin(time*.006+i*1.6)+1)/2;
      const alpha=(.1+.28*twinkle)*progress;
      target.globalAlpha=alpha;target.fillStyle=state.theme==='sand'?'#986e48':'#ffe6ab';
      target.beginPath();target.arc(x,y,i%4===0?2:1.3,0,TAU);target.fill();
    }
    target.restore();
  }
  function brushGlow(target,point,opacity=1) {
    if(!point||!state.sparkle)return;
    target.save();target.globalCompositeOperation=state.theme==='sand'?'source-over':'screen';
    const g=target.createRadialGradient(point.x,point.y,2,point.x,point.y,34);
    g.addColorStop(0,`rgba(255,239,183,${.8*opacity})`);
    g.addColorStop(.25,`rgba(255,193,124,${.25*opacity})`);
    g.addColorStop(1,'rgba(255,183,100,0)');
    target.fillStyle=g;target.beginPath();target.arc(point.x,point.y,34,0,TAU);target.fill();
    target.restore();
  }
  function buildVisualCaches() {
    background(backdropCtx);
    vectorOutlineCtx.clearRect(0,0,SIZE,SIZE);
    vectorOutlines(vectorOutlineCtx,1);
  }
  function vectorFrame(target,p,time) {
    const d=ease(rel(p,stops[0],stops[1]));
    const o=ease(rel(p,stops[1],stops[2]));
    const f=rel(p,stops[2],stops[3]);
    // Initial fine guide points persist, but fade once the design is coloured.
    const dotsOpacity=p<stops[2]?1:lerp(1,.2,rel(p,stops[2],stops[3]));
    target.save();target.globalAlpha=dotsOpacity;
    drawDots(target,dots,d);
    target.restore();
    if(p>=stops[2])vectorFills(target,f);
    const cursor=p>=stops[1] && p<stops[2]?naturalOutlines(target,time-timings.dotMs):null;
    if(p>=stops[2]){
      // Crisp contours remain visible over powder fills.
      target.drawImage(vectorOutlineCache,0,0);
      // Embellished ring dots on top of finished petals.
      target.save();target.globalAlpha=.8*f;
      for(let i=0;i<48;i++){
        const v=rad(384,i*TAU/48);
        target.beginPath();target.arc(v.x,v.y,i%2?2.2:3.1,0,TAU);
        target.fillStyle=i%2?'#e9ac85':'#fae6bc';target.fill();
      }
      target.restore();
    }
    if(p>=stops[1]&&p<stops[2])drawPowderHead(target,cursor,time);
    if(p>=stops[2]&&p<stops[3]){
      const idx=Math.min(petals.length-1,Math.floor(f*petals.length));
      brushGlow(target,petals[idx].center,.85);
    }
    drawFlourish(target,rel(p,stops[2],stops[3]),time);
  }

  function geometricFillsFrame(target,progress){
    if(!state.geometricColors || progress<=0)return;
    const hues=['#ce8d92','#e9ba80','#72c5ac','#9a9bd5','#e7b2c7','#e9cf87','#85b8c5','#cda9dd'];
    const count=geometricFills.length;
    for(let i=0;i<count;i++){
      const region=geometricFills[i],t=clamp(progress*count-i);
      if(!t)continue;
      target.save();target.clip(region.path);
      target.globalAlpha=.53*ease(t);
      const x=region.center.x,y=region.center.y;
      const r=Math.sqrt(region.area)*2.17*1.9;
      const g=target.createRadialGradient(x,y,0,x,y,r);
      const color=hues[i%hues.length];
      g.addColorStop(0,color);g.addColorStop(.8,color);g.addColorStop(1,'rgba(255,255,255,0)');
      target.fillStyle=g;target.fillRect(0,0,SIZE,SIZE);
      target.restore();
    }
  }
  function geometricFrame(target,p,time){
    const d=ease(rel(p,stops[0],stops[1]));
    const f=rel(p,stops[2],stops[3]);
    target.save();target.globalAlpha=p<stops[2]?1:lerp(1,.12,f);
    drawDots(target,dots,d);target.restore();
    if(p>=stops[2]){
      geometricFillsFrame(target,f);
      target.drawImage(vectorOutlineCache,0,0);
    }else if(p>=stops[1]){
      const cursor=naturalOutlines(target,time-timings.dotMs);
      drawPowderHead(target,cursor,time);
    }
    if(p>=stops[2]&&p<stops[3]){
      const a=.14+.22*Math.sin(f*TAU*2);
      target.save();target.globalAlpha=Math.max(0,a);
      target.globalCompositeOperation='screen';
      target.drawImage(vectorOutlineCache,0,0);
      target.restore();
    }
    drawFlourish(target,rel(p,stops[2],stops[3]),time);
  }

  function normalizeUpload() {
    srcCtx.clearRect(0,0,SIZE,SIZE);srcCtx.drawImage(raw,0,0);
    if(state.sample || !state.removeBackground)return;
    const info=state.rect;
    const img=srcCtx.getImageData(0,0,SIZE,SIZE),pixels=img.data;
    const pix=(x,y)=>{const i=(Math.round(y)*SIZE+Math.round(x))*4;return [pixels[i],pixels[i+1],pixels[i+2],pixels[i+3]];};
    const inset=Math.max(3,Math.min(info.w,info.h)*.013);
    const samples=[[info.x+inset,info.y+inset],[info.x+info.w-inset,info.y+inset],[info.x+inset,info.y+info.h-inset],[info.x+info.w-inset,info.y+info.h-inset]].map(([x,y])=>pix(x,y));
    if(samples.some(p=>p[3]<220))return; // Already transparent at corners.
    const avg=[0,1,2].map(i=>samples.reduce((s,v)=>s+v[i],0)/samples.length);
    const dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);
    if(samples.some(v=>dist(v,avg)>30))return; // Busy / multicolour corners: don't guess.
    for(let i=0;i<pixels.length;i+=4){
      const distance=Math.hypot(pixels[i]-avg[0],pixels[i+1]-avg[1],pixels[i+2]-avg[2]);
      const keep=clamp((distance-18)/53);
      pixels[i+3]=Math.round(pixels[i+3]*keep);
    }
    srcCtx.putImageData(img,0,0);
  }
  function createImageEdges() {
    edgeCtx.clearRect(0,0,SIZE,SIZE);
    const data=srcCtx.getImageData(0,0,SIZE,SIZE).data;
    const out=edgeCtx.createImageData(SIZE,SIZE),pix=out.data;
    const lum=(pos)=>.2126*data[pos]+.7152*data[pos+1]+.0722*data[pos+2];
    const dark=state.theme==='sand';
    for(let y=2;y<SIZE-2;y++)for(let x=2;x<SIZE-2;x++){
      const k=(y*SIZE+x)*4;
      const gx=Math.abs(lum(k+4)-lum(k-4));
      const gy=Math.abs(lum(k+SIZE*4)-lum(k-SIZE*4));
      const a=data[k+3], adx=Math.abs(a-data[k+4+3]),ady=Math.abs(a-data[k+SIZE*4+3]);
      const threshold=(gx+gy)*.92+Math.max(adx,ady)*.7;
      const intensity=clamp((threshold-22)/91);
      if(intensity<.12)continue;
      pix[k]=dark?113:245;pix[k+1]=dark?74:219;pix[k+2]=dark?43:181;pix[k+3]=Math.min(218,Math.round(intensity*215));
    }
    edgeCtx.putImageData(out,0,0);
  }
  function generateImportedDots() {
    importedDots.length=0;
    const r=Math.min(state.rect.w,state.rect.h)*.45;
    for(const [count,scale] of [[8,.24],[12,.49],[20,.76],[28,1]]) {
      for(let i=0;i<count;i++)importedDots.push({...rad(r*scale,i*TAU/count-Math.PI/2),size:3.8});
    }
  }
  function wedgeImage(target,img,progress) {
    const count=20;
    for(let i=0;i<count;i++){
      const part=clamp(progress*count-i);
      if(part<=0)break;
      const from=-Math.PI/2+i*TAU/count-.003;
      const to=from+part*TAU/count+.005;
      target.save();target.beginPath();target.moveTo(C,C);target.arc(C,C,650,from,to);target.closePath();target.clip();target.drawImage(img,0,0);target.restore();
    }
  }
  function uploadedFrame(target,p,time) {
    const d=ease(rel(p,stops[0],stops[1]));
    const o=ease(rel(p,stops[1],stops[2]));
    const f=ease(rel(p,stops[2],stops[3]));
    target.save();target.globalAlpha=p<stops[2]?1:lerp(1,.14,f);
    drawDots(target,importedDots,d);target.restore();
    if(p>=stops[1])wedgeImage(target,outline,o);
    if(p>=stops[2])wedgeImage(target,source,f);
    if(p>=stops[3])target.drawImage(source,0,0);
    const show=rel(p,stops[2],stops[3]);
    drawFlourish(target,show,time);
    if(state.sparkle && p>stops[1] && p<stops[3]){
      const speed=p<stops[2]?o:f;
      const point=rad(200,-Math.PI/2+speed*TAU);
      brushGlow(target,point,.65);
    }
  }
  function stageFor(p) {
    if(p<stops[1])return {id:'dots',label:'Placing dots',badge:'01 / PLACING DOTS',number:0};
    if(p<stops[2])return {id:'lines',label:'Drawing the outline',badge:'02 / DRAWING OUTLINES',number:1};
    if(p<stops[3]){const plain=state.sample&&state.designId==='geometric'&&!state.geometricColors;return plain?{id:'color',label:'Polishing white linework',badge:'03 / LINEWORK POLISH',number:2}:{id:'color',label:'Colouring the petals',badge:'03 / COLOUR BLOOM',number:2};}
    return {id:'final',label:'Final rangoli',badge:'04 / FINAL FLOURISH',number:3};
  }
  function renderAt(elapsedMs,updateUI=true) {
    const p=clamp(elapsedMs/timings.totalMs);
    ctx.drawImage(backdropCache,0,0);
    if(state.sample && state.designId==='geometric')geometricFrame(ctx,p,elapsedMs);
    else if(state.sample)vectorFrame(ctx,p,elapsedMs);else uploadedFrame(ctx,p,elapsedMs);
    if(updateUI){
      const stage=stageFor(p);
      $('timelineRange').value=Math.round(p*1000);
      $('timelineRange').style.setProperty('--range',`${p*100}%`);
      $('timeNow').textContent=formatTime(elapsedMs/1000);
      $('activeStageText').textContent=stage.label;
      $('stagePill').textContent=stage.badge;
      if(stage.id!==lastStage){
        document.querySelectorAll('.phase-item').forEach((el,i)=>{
          el.classList.toggle('active',i===stage.number);
          el.classList.toggle('complete',i<stage.number);
        });
        lastStage=stage.id;
      }
    }
  }
  function formatTime(t){return `${Math.floor(t/60)}:${String(Math.floor(t%60)).padStart(2,'0')}`;}
  function updateUIPlayback(){
    $('playPause').textContent=state.playing?'Ⅱ':'▶';
    $('playPause').setAttribute('aria-label',state.playing?'Pause animation':'Play animation');
    $('playbackState').textContent=state.recording?'RECORDING':state.playing?'PLAYING':'PAUSED';
  }
  function setElapsed(ms,autoplay=false) {
    state.elapsed=clamp(ms,0,state.duration*1000);
    state.startedAt=performance.now()-state.elapsed;
    state.playing=autoplay;
    updateUIPlayback();renderAt(state.elapsed);
  }
  function tick(now){
    if(state.playing && !state.seeking){
      let elapsed=Math.max(0,now-state.startedAt),total=state.duration*1000;
      if(elapsed>=total){
        if(state.recording){
          elapsed=total;state.playing=false;
          if(!state.recordStopping){
            state.recordStopping=true;
            setTimeout(()=>{if(state.recorder&&state.recorder.state==='recording')state.recorder.stop();},170);
          }
        }else if(state.loop){elapsed%=total;state.startedAt=now-elapsed;}
        else{elapsed=total;state.playing=false;}
        updateUIPlayback();
      }
      state.elapsed=elapsed;renderAt(elapsed);
    }
    requestAnimationFrame(tick);
  }
  function thumb(){
    // Source preview as actual finished artwork.
    const t=thumbCanvas;
    thumbCtx.fillStyle='#243337';thumbCtx.fillRect(0,0,t.width,t.height);
    if(state.sample){
      const small=document.createElement('canvas');small.width=small.height=SIZE;
      const temp=small.getContext('2d');
      temp.fillStyle='#192529';temp.fillRect(0,0,SIZE,SIZE);
      if(state.designId==='geometric'){geometricFillsFrame(temp,1);vectorOutlines(temp,1);}
      else {vectorFills(temp,1);vectorOutlines(temp,1);}
      thumbCtx.drawImage(small,0,0,108,108);
    }else thumbCtx.drawImage(source,0,0,108,108);
    $('artworkName').textContent=state.name;
    $('artworkName').title=state.name;
    $('artworkInfo').textContent=state.detail;
  }
  function updateDesignPicker(){
    for(const id of ['lotus','geometric']){
      const b=$(id==='lotus'?'selectLotus':'selectGeometric');
      const active=state.sample && state.designId===id;
      b.classList.toggle('selected',active);
      b.setAttribute('aria-pressed',String(active));
    }
    $('geometricColorSetting').hidden=!(state.sample&&state.designId==='geometric');
    $('geometricColorToggle').checked=state.geometricColors;
    const plain=state.sample&&state.designId==='geometric'&&!state.geometricColors;
    const third=document.querySelector('.phase-item[data-stage="color"]');
    third.querySelector('strong').textContent=plain?'Linework polish':'Colour bloom';
    third.querySelector('small').textContent=plain?'The original white motif is refined':'Petals fill one after another';
  }
  function selectDesign(id){
    if(state.recording)return;
    state.sample=true;state.image=null;state.designId=id;
    state.theme=id==='geometric'?'berry':'midnight';
    $('themeSelect').value=state.theme;
    state.rect={x:75,y:75,w:750,h:750};
    srcCtx.clearRect(0,0,SIZE,SIZE);
    if(id==='geometric'){
      buildGeometric();
      state.name='Geometric lotus';state.detail='Your image · Traced vector outlines';
      $('stageDisclaimer').textContent='Geometric lotus: the white lines were traced from your image, excluding its labels and watermark. The animation stroke order is inferred, not an exact real-world drawing tutorial. Colour accents are optional.';
    }else{
      buildSample();
      state.name='Lotus mandala';state.detail='Sample artwork · Vector drawn';
      $('stageDisclaimer').textContent='Lotus mandala uses designed vector paths. Uploaded images use an artistic approximation, not reconstructed drawing instructions.';
    }
    totalStrokes=strokes.reduce((s,v)=>s+v.len,0);
    rebuildNaturalTiming();updateTimingLabels();
    buildVisualCaches();updateDesignPicker();thumb();setElapsed(0,true);
  }
  function sample(){selectDesign('lotus');}
  function loadFile(file){
    if(!file || state.recording)return;
    if(!/^(image\/png|image\/jpeg|image\/webp|image\/svg\+xml|image\/avif)$/.test(file.type)){
      notify('Please upload PNG, JPG, WebP, SVG or AVIF.');return;
    }
    if(file.size>15*1024*1024){notify('Choose an image smaller than 15 MB.');return;}
    const url=URL.createObjectURL(file),image=new Image();
    image.onload=()=>{
      URL.revokeObjectURL(url);
      try{
        rawCtx.clearRect(0,0,SIZE,SIZE);
        const scale=Math.min(770/image.naturalWidth,770/image.naturalHeight);
        const w=image.naturalWidth*scale,h=image.naturalHeight*scale,x=(SIZE-w)/2,y=(SIZE-h)/2;
        rawCtx.drawImage(image,x,y,w,h);
        state.rect={x,y,w,h};state.sample=false;state.designId='upload';state.image=image;state.name=file.name;
        state.detail=`${image.naturalWidth} × ${image.naturalHeight} · ${(file.size/1048576).toFixed(2)} MB`;
        normalizeUpload();createImageEdges();generateImportedDots();updateDesignPicker();thumb();setElapsed(0,true);
        $('stageDisclaimer').textContent='Upload preview: dots are decorative, contours are pixel-derived, and colour sections are revealed clockwise. This is not an exact how-to guide.';
        notify('Artwork loaded — dots, contours and colour animation are ready.');
      }catch(err){console.error(err);notify('Unable to render this image. Try a smaller PNG or JPG.');}
    };
    image.onerror=()=>{URL.revokeObjectURL(url);notify('This image could not be opened. Try PNG or JPG.');};
    image.src=url;
  }
  function download(blob,name){
    const a=document.createElement('a'),url=URL.createObjectURL(blob);
    a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),30000);
  }
  function exportPng(){
    canvas.toBlob(blob=>{
      if(!blob){notify('PNG export failed.');return;}
      download(blob,'rangoli-preview-frame.png');notify('Current animation frame saved as PNG.');
    },'image/png');
  }
  function exportVideo(){
    if(state.recording)return;
    if(!canvas.captureStream||!window.MediaRecorder){notify('WebM video export needs Chrome, Edge or Firefox.');return;}
    const mime=['video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'].find(t=>MediaRecorder.isTypeSupported(t));
    if(!mime){notify('This browser does not support WebM video recording.');return;}
    try{
      const stream=canvas.captureStream(30);
      const recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:4500000});
      state.recording=true;state.recordStopping=false;state.recorder=recorder;state.recordStream=stream;state.recordParts=[];
      recorder.ondataavailable=(e)=>{if(e.data&&e.data.size)state.recordParts.push(e.data);};
      recorder.onerror=()=>notify('Recording error. Try Chrome or use PNG export.');
      recorder.onstop=()=>{
        state.recordStream.getTracks().forEach(t=>t.stop());
        const data=new Blob(state.recordParts,{type:recorder.mimeType||'video/webm'});
        state.recording=false;state.recorder=null;state.recordStream=null;
        $('videoExport').disabled=false;$('videoText').textContent='Export video';$('videoIcon').textContent='◉';
        updateUIPlayback();
        if(data.size){download(data,`rangoli-preview-${state.duration}s.webm`);notify('Full animation exported as WebM video.');}
        else notify('No video frames were captured.');
      };
      setElapsed(0,true);
      recorder.start(200);
      $('videoExport').disabled=true;$('videoText').textContent='Recording…';$('videoIcon').textContent='●';
      updateUIPlayback();notify('Recording the complete animation sequence…');
    }catch(err){
      console.error(err);state.recording=false;
      if(state.recordStream)state.recordStream.getTracks().forEach(t=>t.stop());
      state.recordStream=null;notify('Recording unavailable in this browser.');
    }
  }
  function controls(){
    $('fileInput').addEventListener('change',e=>{loadFile(e.target.files[0]);e.target.value='';});
    $('uploadArea').addEventListener('keydown',e=>{
      if(e.key==='Enter'||e.key===' '){e.preventDefault();$('fileInput').click();}
    });
    for(const el of [$('uploadArea'),$('canvasDropArea')]){
      el.addEventListener('dragover',e=>{e.preventDefault();el.classList.add('dragging');});
      el.addEventListener('dragleave',e=>{e.preventDefault();el.classList.remove('dragging');});
      el.addEventListener('drop',e=>{e.preventDefault();el.classList.remove('dragging');loadFile(e.dataTransfer.files[0]);});
    }
    $('restoreSample').addEventListener('click',sample);
    $('selectLotus').addEventListener('click',()=>selectDesign('lotus'));
    $('selectGeometric').addEventListener('click',()=>selectDesign('geometric'));
    $('geometricColorToggle').addEventListener('change',e=>{state.geometricColors=e.target.checked;updateDesignPicker();thumb();renderAt(state.elapsed);});
    $('durationRange').addEventListener('input',e=>{if(state.recording)return;state.baseDuration=Number(e.target.value);preserveStageAndRebuild();});
    $('outlineSpeedRange').addEventListener('input',e=>{if(state.recording)return;state.outlineSpeed=Number(e.target.value);$('fsSpeedRange').value=e.target.value;preserveStageAndRebuild();});
    $('fsSpeedRange').addEventListener('input',e=>{if(state.recording)return;state.outlineSpeed=Number(e.target.value);$('outlineSpeedRange').value=e.target.value;preserveStageAndRebuild();});
    $('realismRange').addEventListener('input',e=>{if(state.recording)return;state.realism=Number(e.target.value);preserveStageAndRebuild();});
    $('pauseRange').addEventListener('input',e=>{if(state.recording)return;state.pauseMs=Number(e.target.value);preserveStageAndRebuild();});
    $('themeSelect').addEventListener('change',e=>{
      state.theme=e.target.value;buildVisualCaches();
      if(!state.sample)createImageEdges();
      renderAt(state.elapsed);
    });
    $('loopToggle').addEventListener('change',e=>state.loop=e.target.checked);
    $('sparkleToggle').addEventListener('change',e=>{state.sparkle=e.target.checked;renderAt(state.elapsed);});
    $('removeBackgroundToggle').addEventListener('change',e=>{
      if(state.sample)return;
      state.removeBackground=e.target.checked;
      normalizeUpload();createImageEdges();thumb();renderAt(state.elapsed);
    });
    $('playPause').addEventListener('click',()=>{
      if(state.recording)return;
      if(state.playing){state.elapsed=clamp(performance.now()-state.startedAt,0,state.duration*1000);state.playing=false;renderAt(state.elapsed);}
      else{if(state.elapsed>=state.duration*1000)state.elapsed=0;state.startedAt=performance.now()-state.elapsed;state.playing=true;}
      updateUIPlayback();
    });
    $('replay').addEventListener('click',()=>{if(!state.recording)setElapsed(0,true);});
    $('timelineRange').addEventListener('input',e=>{
      if(state.recording)return;
      setElapsed(Number(e.target.value)/1000*state.duration*1000,false);
    });
    $('pngExport').addEventListener('click',exportPng);
    $('videoExport').addEventListener('click',exportVideo);
    document.addEventListener('keydown',e=>{
      if(e.code==='Space' && !['INPUT','SELECT','BUTTON','TEXTAREA'].includes(document.activeElement?.tagName)){
        e.preventDefault();$('playPause').click();
      }
    });
    const preview=$('previewColumn');
    const isFullscreen=()=>document.fullscreenElement===preview || fullscreenFallback;
    function updateFullscreenUI(){
      const on=isFullscreen();
      $('fullscreenBtn').textContent=on?'⤢ Exit full screen':'⛶ Full screen';
      $('fullscreenBtn').setAttribute('aria-pressed',String(on));
      $('fullscreenExit').hidden=!on;
      preview.classList.toggle('fullscreen-fallback',fullscreenFallback);
      preview.classList.toggle('immersive',on);
      $('fullscreenHelp').hidden=!on;
    }
    async function enterFullscreen(){
      if(isFullscreen())return;
      try {
        if(!preview.requestFullscreen)throw new Error('Fullscreen API unavailable');
        await preview.requestFullscreen();
      }catch(error){
        // Browsers that disallow the API (for example an embedded preview) use a CSS viewport overlay.
        fullscreenFallback=true;document.body.classList.add('fallback-active');
      }
      updateFullscreenUI();
    }
    async function exitFullscreen(){
      if(fullscreenFallback){fullscreenFallback=false;document.body.classList.remove('fallback-active');}
      if(document.fullscreenElement===preview && document.exitFullscreen)await document.exitFullscreen();
      updateFullscreenUI();
    }
    $('fullscreenBtn').addEventListener('click',()=>isFullscreen()?exitFullscreen():enterFullscreen());
    $('fullscreenExit').addEventListener('click',exitFullscreen);
    $('fullscreenHelp').addEventListener('click',()=>preview.classList.toggle('hide-controls'));
    document.addEventListener('fullscreenchange',updateFullscreenUI);
    document.addEventListener('keydown',e=>{
      if(e.key==='Escape' && fullscreenFallback){exitFullscreen();}
      if(e.key==='f' && !e.repeat && !['INPUT','SELECT','TEXTAREA'].includes(document.activeElement?.tagName)){
        e.preventDefault();isFullscreen()?exitFullscreen():enterFullscreen();
      }
    });
    updateFullscreenUI();
    updateTimingLabels();
  }
  rebuildNaturalTiming();controls();buildVisualCaches();sample();requestAnimationFrame(tick);
  // Expose read-only test diagnostics, not app controls.
  window.RangoliPreviewDiagnostics=()=>({design:state.designId,geometricColors:state.geometricColors,mode:state.sample?'vector-sample':'uploaded-image',stage:stageFor(state.elapsed/(state.duration*1000)).id,duration:state.duration,baseDuration:state.baseDuration,outlineSpeed:state.outlineSpeed,realism:state.realism,pauseMs:state.pauseMs,outlineTimeMs:timings.outlineMs,strokeCount:strokes.length,fullScreen:document.fullscreenElement?.id==='previewColumn'||fullscreenFallback,playing:state.playing,loop:state.loop,recording:state.recording});
})();
