/* RangoliMotion v9 — trace bright powder linework into actual ordered paths.
   White-line centerline extraction: threshold -> morphological thinning -> graph walk.
   Deterministic, browser-only and never equivalent to artist-approved teaching. */
(() => {
  'use strict';
  const neighbors=[[-1,-1],[0,-1],[1,-1],[1,0],[1,1],[0,1],[-1,1],[-1,0]];
  const key=(a,b)=>a<b?a+':'+b:b+':'+a;
  function trace(imageData,{resolution=180,maxPaths=190}={}){
    const n=Number.isFinite(resolution)?Math.min(240,Math.max(96,Math.floor(resolution))):180;
    const scale=900/n,rgba=imageData.data,w=imageData.width,h=imageData.height;
    if(!rgba||w<30||h<30)throw new Error('Invalid image pixels for line tracing');
    const mask=new Uint8Array(n*n),edge=new Uint8Array(n*n);
    let original=0;
    for(let y=1;y<n-1;y++)for(let x=1;x<n-1;x++){
      const xx=Math.min(w-1,Math.floor((x+.5)*w/n)),yy=Math.min(h-1,Math.floor((y+.5)*h/n)),i=(yy*w+xx)*4;
      const r=rgba[i],g=rgba[i+1],b=rgba[i+2],alpha=rgba[i+3];
      const bright=Math.min(r,g,b)>=145 && Math.max(r,g,b)-Math.min(r,g,b)<=90 &&
        (.2126*r+.7152*g+.0722*b)>=173;
      if(alpha>=125&&bright){mask[y*n+x]=1;original++;}
    }
    if(original<14)return {strokes:[],dots:[],whitePixels:original};
    const p=(x,y)=>y*n+x;
    // Zhang-Suen topology-preserving thinning, capped for browser responsiveness.
    for(let pass=0;pass<24;pass++){
      let removed=0;
      for(let step=0;step<2;step++){
        const drop=[];
        for(let y=1;y<n-1;y++)for(let x=1;x<n-1;x++){
          const at=p(x,y);
          if(!mask[at])continue;
          const v=neighbors.map(([dx,dy])=>mask[p(x+dx,y+dy)]);
          const count=v.reduce((a,b)=>a+b,0);
          if(count<2||count>6)continue;
          const transitions=v.reduce((sum,value,i)=>sum+(!value&&v[(i+1)%8]?1:0),0);
          if(transitions!==1)continue;
          // Mask indexes: NW,N,NE,E,SE,S,SW,W.
          const n1=v[1],e1=v[3],s1=v[5],w1=v[7];
          if(step===0 && (n1*e1*s1!==0 || e1*s1*w1!==0))continue;
          if(step===1 && (n1*e1*w1!==0 || n1*s1*w1!==0))continue;
          drop.push(at);
        }
        removed+=drop.length;
        for(const id of drop)mask[id]=0;
      }
      if(!removed)break;
    }
    function adjacent(at){
      const x=at%n,y=Math.floor(at/n),arr=[];
      for(const [dx,dy] of neighbors){
        const xx=x+dx,yy=y+dy;
        if(xx>=0&&xx<n&&yy>=0&&yy<n&&mask[p(xx,yy)])arr.push(p(xx,yy));
      }
      return arr;
    }
    const degree=new Uint8Array(n*n);
    const nodes=[];
    for(let at=0;at<n*n;at++)if(mask[at]){degree[at]=adjacent(at).length;nodes.push(at);}
    const edgesSeen=new Set(),paths=[];
    function walk(start,next){
      let prev=start,cur=next;
      const pixels=[start,next];edgesSeen.add(key(start,next));
      for(let steps=0;steps<Math.min(n*n,1200);steps++){
        if(degree[cur]!==2)break;
        const options=adjacent(cur).filter(id=>id!==prev&&!edgesSeen.has(key(cur,id)));
        if(!options.length)break;
        const choice=options[0];
        edgesSeen.add(key(cur,choice));
        pixels.push(choice);prev=cur;cur=choice;
        if(cur===start)break;
      }
      if(pixels.length<6)return;
      const smooth=[];
      for(let i=0;i<pixels.length;i+=2){
        const at=pixels[i],xx=at%n,yy=(at/n)|0;
        smooth.push([Math.round((xx+.5)*scale*10)/10,Math.round((yy+.5)*scale*10)/10]);
      }
      const tail=pixels[pixels.length-1],point=[((tail%n)+.5)*scale,(((tail/n)|0)+.5)*scale];
      if(smooth.length && Math.hypot(smooth[smooth.length-1][0]-point[0],smooth[smooth.length-1][1]-point[1])>1)
        smooth.push(point);
      if(smooth.length>2)paths.push({points:smooth,kind:'powder_line',color:'#fff7e8',
        width:Math.max(2.8,scale*.76),length:pixels.length});
    }
    // First traverse endpoint and junction paths; then closed cycles.
    for(const at of nodes)if(degree[at]!==2)
      for(const next of adjacent(at))if(!edgesSeen.has(key(at,next)))walk(at,next);
    for(const at of nodes)
      for(const next of adjacent(at))if(!edgesSeen.has(key(at,next)))walk(at,next);
    const ranked=paths.sort((a,b)=>b.length-a.length).slice(0,maxPaths);
    const order=ranked.sort((a,b)=>{
      const c1=a.points[0],c2=b.points[0],r1=Math.hypot(c1[0]-450,c1[1]-450),r2=Math.hypot(c2[0]-450,c2[1]-450);
      return r1-r2||b.length-a.length;
    });
    const guideDots=[],spatial=[];
    for(const stroke of order){
      if(guideDots.length>=160)break;
      for(const point of [stroke.points[0],stroke.points[Math.floor(stroke.points.length/2)]]){
        if(spatial.some(p=>Math.hypot(p.x-point[0],p.y-point[1])<26))continue;
        const d={x:point[0],y:point[1],size:3.3};
        spatial.push(d);guideDots.push(d);
      }
    }
    return {strokes:order,dots:guideDots,whitePixels:original,
      skeletonPixels:nodes.length};
  }
  window.RangoliPowderTrace=Object.freeze({trace});
})();
