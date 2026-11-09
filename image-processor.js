/* RangoliMotion v8 — browser-only assisted tracing for uploaded and gallery images.
   Produces vector contours, geometry-derived guide anchors and individual colour masks.
   Not a reconstruction of the human artist's order or an approved tutorial.
   No external API, network requests, machine learning model or database. */
(() => {
  'use strict';
  const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
  const dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
  const coord=(x,y,scale)=>[Math.round(x*scale*100)/100,Math.round(y*scale*100)/100];
  // Perceptual grouping, not a claim to segment semantic petals or symbols.
  function colourClass(r,g,b){
    const mx=Math.max(r,g,b),mn=Math.min(r,g,b),d=mx-mn;
    if(mx<35)return 15;
    if(d<32)return mx>181?13:14;
    let hue=0;
    if(mx===r)hue=((g-b)/d+6)%6;
    else if(mx===g)hue=(b-r)/d+2;
    else hue=(r-g)/d+4;
    if(d/mx<.2)return mx>170?13:14;
    return Math.min(11,Math.floor(hue/6*12));
  }
  // Remove near-collinear high-frequency pixel stair steps, preserving each contour's route.
  function simplify(points,tolerance){
    if(points.length<6)return points.slice();
    const sq=tolerance*tolerance,keep=new Uint8Array(points.length);
    keep[0]=1;keep[points.length-1]=1;
    const stack=[[0,points.length-1]];
    while(stack.length){
      const [a,b]=stack.pop();
      const p=points[a],q=points[b],dx=q[0]-p[0],dy=q[1]-p[1],den=dx*dx+dy*dy;
      let best=-1,max=0;
      for(let i=a+1;i<b;i++){
        const v=points[i],t=den?clamp(((v[0]-p[0])*dx+(v[1]-p[1])*dy)/den,0,1):0;
        const ex=v[0]-p[0]-t*dx,ey=v[1]-p[1]-t*dy,dd=ex*ex+ey*ey;
        if(dd>max){max=dd;best=i;}
      }
      if(best>0&&max>sq){keep[best]=1;stack.push([a,best],[best,b]);}
    }
    const out=points.filter((_,i)=>keep[i]);
    if(out.length>240)return out.filter((_,i)=>i%Math.ceil(out.length/240)===0||i===out.length-1);
    return out;
  }
  function buildLoops(cells,n,scale){
    const own=new Uint8Array(n*n);
    for(const v of cells)own[v]=1;
    const edges=[],outgoing=new Map(),K=(x,y)=>y*(n+1)+x;
    function add(x1,y1,x2,y2){
      const from=K(x1,y1),to=K(x2,y2),idx=edges.length;
      edges.push({from,to,p:coord(x1,y1,scale)});
      if(!outgoing.has(from))outgoing.set(from,[]);
      outgoing.get(from).push(idx);
    }
    for(const cell of cells){
      const x=cell%n,y=(cell/n)|0;
      if(y===0||!own[cell-n])add(x,y,x+1,y);
      if(x===n-1||!own[cell+1])add(x+1,y,x+1,y+1);
      if(y===n-1||!own[cell+n])add(x+1,y+1,x,y+1);
      if(x===0||!own[cell-1])add(x,y+1,x,y);
    }
    const seen=new Uint8Array(edges.length),loops=[];
    for(let i=0;i<edges.length;i++){
      if(seen[i])continue;
      let k=i,count=0,path=[];
      while(k!=null&&!seen[k]&&count++<=edges.length){
        const e=edges[k];seen[k]=1;path.push(e.p);
        const next=outgoing.get(e.to)||[];
        k=next.find(v=>!seen[v]);
      }
      if(path.length<5)continue;
      path.push(path[0]);
      path=simplify(path,scale*1.35);
      if(path.length>3&&dist(path[0],path[path.length-1])>.01)path.push(path[0]);
      if(path.length>=4)loops.push(path);
    }
    loops.sort((a,b)=>b.length-a.length);
    return loops.slice(0,5);
  }
  function process(imageData,{resolution=180,maxRegions=180,maxStrokes=320}={}){
    if(!imageData?.data||!Number.isInteger(imageData.width)||!Number.isInteger(imageData.height)
       ||imageData.width<30||imageData.height<30)throw new Error('Image must contain valid pixel data');
    const width=imageData.width,height=imageData.height,n=clamp(Math.floor(resolution),96,240)|0,scale=900/n;
    const src=imageData.data,classMap=new Int16Array(n*n),colors=new Uint8Array(n*n*3);
    classMap.fill(-1);
    let active=0;
    for(let y=0;y<n;y++)for(let x=0;x<n;x++){
      const xx=Math.min(width-1,Math.floor((x+.5)*width/n)),yy=Math.min(height-1,Math.floor((y+.5)*height/n));
      const p=(yy*width+xx)*4,at=y*n+x,r=src[p],g=src[p+1],b=src[p+2];
      if(src[p+3]<70)continue;
      classMap[at]=colourClass(r,g,b);active++;
      colors[at*3]=r;colors[at*3+1]=g;colors[at*3+2]=b;
    }
    if(active<35)throw new Error('Not enough visible image detail to trace safely');
    const visited=new Uint8Array(n*n),groups=[],directions=[-n,1,n,-1];
    for(let root=0;root<n*n;root++){
      if(visited[root]||classMap[root]<0)continue;
      const category=classMap[root],queue=[root],cells=[],hist=[0,0,0];
      visited[root]=1;
      let sumX=0,sumY=0,minX=n,minY=n,maxX=0,maxY=0;
      for(let at=0;at<queue.length;at++){
        const v=queue[at],x=v%n,y=(v/n)|0;
        cells.push(v);sumX+=x;sumY+=y;minX=Math.min(minX,x);minY=Math.min(minY,y);
        maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);
        const col=v*3;hist[0]+=colors[col];hist[1]+=colors[col+1];hist[2]+=colors[col+2];
        for(let d=0;d<4;d++){
          if(d===1&&x===n-1||d===3&&x===0||d===0&&y===0||d===2&&y===n-1)continue;
          const j=v+directions[d];
          if(!visited[j]&&classMap[j]===category){visited[j]=1;queue.push(j);}
        }
      }
      if(cells.length>=6)groups.push({cells,area:cells.length,category,
        cx:sumX/cells.length,cy:sumY/cells.length,minX,minY,maxX,maxY,
        color:hist.map(v=>Math.round(v/cells.length))});
    }
    if(!groups.length)throw new Error('No usable regions detected');
    groups.sort((a,b)=>b.area-a.area);
    const selected=groups.slice(0,clamp(maxRegions,15,240));
    const regions=[],strokes=[],dots=[],spatial=[];
    // Mandatory separate line extraction: this catches interior light powder
    // outlines which are NOT preserved by tracing only colour-region borders.
    const powder=window.RangoliPowderTrace?.trace(imageData,{resolution:n,maxPaths:Math.floor(maxStrokes*.58)})
      || {strokes:[],dots:[],whitePixels:0};
    strokes.push(...powder.strokes);
    for(const d of powder.dots){if(dots.length<160){dots.push(d);spatial.push(d);}}

    const dot=(x,y)=>{
      if(dots.length>=160||spatial.some(p=>Math.hypot(p.x-x,p.y-y)<34))return;
      spatial.push({x,y});dots.push({x,y,size:3.8});
    };
    for(const region of selected){
      const loops=buildLoops(region.cells,n,scale);
      if(!loops.length)continue;
      const main=loops[0];
      const runs=[];
      // Run-length rectangles are a mask for exactly one estimated colour region,
      // not a sector / clockwise wipe or complete-image reveal.
      const rowMap=new Map();
      for(const v of region.cells){
        const y=(v/n)|0;
        if(!rowMap.has(y))rowMap.set(y,[]);
        rowMap.get(y).push(v%n);
      }
      for(const [y,xs] of rowMap){
        xs.sort((a,b)=>a-b);
        let start=xs[0],prev=start;
        for(let i=1;i<=xs.length;i++){
          if(i===xs.length||xs[i]>prev+1){
            runs.push([start*scale,y*scale,(prev-start+1)*scale,scale]);
            start=xs[i];
          }
          prev=xs[i];
        }
      }
      regions.push({points:main,runs,
        color:'rgb('+region.color.join(',')+')',
        powderFill:true,
        anchor:[(region.cx+.5)*scale,(region.cy+.5)*scale],
        radius:Math.hypot(region.maxX-region.minX+2,region.maxY-region.minY+2)*scale,
        area:region.area});
      for(const loop of loops){
        if(strokes.length>=maxStrokes)break;
        strokes.push({points:loop,width:Math.max(2.5,scale*.60),color:'#f0ead8',kind:'auto_trace'});
        dot(loop[0][0],loop[0][1]);
        const count=Math.min(7,Math.max(1,Math.floor(loop.length/22)));
        for(let j=1;j<=count;j++){
          const p=loop[Math.min(loop.length-1,Math.floor(j*loop.length/(count+1)))];
          dot(p[0],p[1]);
        }
      }
    }
    if(!strokes.length||!regions.length||!dots.length)
      throw new Error('Image contours cannot support the drawing sequence');
    // Drawing order: region contours first (largest to smallest), one stroke after another.
    // A human artist may use a different order; never label this a verified lesson.
    const powderCount=powder.strokes.length;
    const contourCount=strokes.length-powderCount;
    const visibleCoverage=selected.reduce((sum,g)=>sum+g.area,0)/active;
    // A few giant blobs with no recoverable interior outlines are NOT
    // acceptable as "a design being drawn". Reject rather than fake a reveal.
    if(strokes.length<2 || (!powderCount && contourCount<3) || visibleCoverage<.45)
      throw new Error('Too few drawable outlines or colour regions recovered');
    const result={
      id:'processed-image',mode:'image_auto_trace',verification:'automatic_unreviewed',
      tutorialCapable:false,dotType:'estimated_geometry_anchors',strokes,dots,fills:regions,
      stats:{resolution:n,visiblePixels:active,regionCount:regions.length,
        tracedPaths:strokes.length,powderPaths:powderCount,contourPaths:contourCount,coverage:visibleCoverage,whitePixels:powder.whitePixels}
    };
    window.RangoliDrawingRules?.validateModel(result,{derived:true});
    return result;
  }
  window.RangoliImageProcessor=Object.freeze({process});
})();
