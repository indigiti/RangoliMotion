/* RangoliMotion b-06 benchmark: authored semantic paths from supplied Bhaubeej reference.
   No photo masks, no raster edge tracing, and no claim of human-verified tutorial order. */
(() => {
 'use strict';
 const tau=Math.PI*2,P=(x,y)=>({x,y});
 function cubic(a,b,c,d,n=26){const out=[];for(let i=0;i<=n;i++){const t=i/n,u=1-t;out.push(P(u*u*u*a.x+3*u*u*t*b.x+3*u*t*t*c.x+t*t*t*d.x,u*u*u*a.y+3*u*u*t*b.y+3*u*t*t*c.y+t*t*t*d.y));}return out;}
 const round=x=>Math.round(x*100)/100, coords=ps=>ps.map(p=>[round(p.x),round(p.y)]);
 const loop=(cx,cy,rx,ry,n=40)=>Array.from({length:n},(_,i)=>P(cx+rx*Math.cos(tau*i/n),cy+ry*Math.sin(tau*i/n)));
 const model={id:'b-06',title:'Bhaubeej Footprints',category:'symbols',mode:'vector_draw',theme:'midnight',authorship:'semantic hand-reconstruction',verification:'reference_reconstruction_unreviewed',tutorialCapable:false,dots:[],strokes:[],fills:[],componentCounts:{footprints:0,toes:0,beads:0,flowers:0,leaves:0,diyas:0}};
 function line(ps,kind='decor',width=3,color='#fff4dc'){if(ps.length<2)return;model.strokes.push({points:coords(ps),width,color,kind});}
 function shape(ps,color,kind='detail',width=3,edge='#fff3da',anchor=null){
  if(ps.length<3)return;
  model.fills.push({points:coords(ps),color,kind,anchor:anchor?[round(anchor.x),round(anchor.y)]:undefined});
  line([...ps,ps[0]],kind,width,edge);
 }
 function circle(x,y,r,color,kind='bead',edge='#fff5e7'){shape(loop(x,y,r,r,18),color,kind,1.1,edge,P(x,y));}
 function petal(x,y,tipX,tipY,w,color,kind='leaf'){
  const a=P(x,y),b=P(tipX,tipY),dx=b.x-a.x,dy=b.y-a.y,L=Math.hypot(dx,dy)||1,nx=-dy/L,ny=dx/L;
  const q=P((a.x+b.x)/2,(a.y+b.y)/2);
  const first=cubic(a,P(q.x+nx*w,q.y+ny*w),P(b.x+nx*w*.46,b.y+ny*w*.46),b,19);
  const second=cubic(b,P(b.x-nx*w*.46,b.y-ny*w*.46),P(q.x-nx*w,q.y-ny*w),a,19);
  shape([...first,...second],color,kind,3.6,'#fff7e5',q);
  line([a,q,b],kind==='leaf'?'leaf-vein':'petal-vein',1.25,'#c6d5a3');
  if(kind==='leaf')model.componentCounts.leaves++;
 }
 function flower(x,y,r=23,count=7){
  for(let i=0;i<count;i++){const a=-Math.PI/2+i*tau/count;petal(x,y,x+r*Math.cos(a),y+r*Math.sin(a),r*.56,i%3===0?'#f9eddd':'#ffffff','flower-petal');}
  circle(x,y,r*.20,'#eeb333','flower-center','#fff7da');model.componentCounts.flowers++;
 }
 function footprint(side){
  const mirror=x=>450+side*(450-x),to=x=>P(mirror(x.x),x.y);
  const nodes=[P(345,218),P(300,244),P(294,332),P(310,409),P(336,487),P(373,519),P(399,497),P(413,457),P(405,383),P(388,292),P(365,225)];
  const segments=[];
  function c(i,b,c,j){const p=cubic(nodes[i],b,c,nodes[j],24);if(segments.length)p.shift();segments.push(...p);}
  c(0,P(317,218),P(302,222),1);c(1,P(287,269),P(285,310),2);
  c(2,P(285,360),P(294,389),3);c(3,P(319,437),P(319,472),4);
  c(4,P(349,514),P(359,519),5);c(5,P(388,516),P(398,507),6);
  c(6,P(414,482),P(417,470),7);c(7,P(413,429),P(409,407),8);
  c(8,P(400,351),P(402,318),9);c(9,P(383,267),P(377,238),10);
  c(10,P(361,216),P(351,213),0);
  shape(segments.map(to),'#da1f29','footprint',7.5,'#fff7e7',P(mirror(350),365));
  line(cubic(P(mirror(330),340),P(mirror(324),383),P(mirror(329),440),P(mirror(356),466),22),'footprint-detail',2.5,'#f9a359');
  for(let i=0;i<5;i++){
   const x=274+i*24,y=[217,191,175,169,182][i],rx=[13,16,18,18,16][i],ry=[16,17,20,20,17][i];
   shape(loop(mirror(x),y,rx,ry,28),'#dc262a','toe',4.7,'#fff7e9',P(mirror(x),y));model.componentCounts.toes++;
  }
  circle(mirror(362),452,7,'#f6db79','footprint-highlight','#ffefce');
  model.componentCounts.footprints++;
 }
 // Human-structured sequence: feet + toes, flowers/foliage, lamp, bead border, nameplate.
 for(const side of [1,-1])footprint(side);
 flower(451,390,35,8);
 line(cubic(P(451,330),P(460,352),P(448,385),P(451,435),28),'middle-decor',2.3,'#ffe1aa');
 for(const side of [-1,1]){
  const x=450+side*222;
  flower(x,348,25,7);flower(x+side*21,430,21,6);flower(x-side*5,550,23,7);
  circle(x,312,11,'#df3684','accent-bead');circle(x+side*21,382,7,'#f9c353','accent-bead');
  for(let j=0;j<4;j++){
   const start=P(450+side*(95+j*26),604+j*10),end=P(450+side*(190+j*20),626-j*33);
   petal(start.x,start.y,end.x,end.y,26-j*.7,j%2?'#145d42':'#26845d','leaf');
  }
  for(let j=0;j<2;j++){
   const start=P(450+side*(133+j*12),574-j*10),end=P(450+side*(229+j*30),535-j*39);
   petal(start.x,start.y,end.x,end.y,22,'#27643d','leaf');
  }
 }
 for(let i=0;i<5;i++){const a=Math.PI*.1+i*Math.PI*.2;petal(450,649,450+Math.cos(a)*140,632-Math.sin(a)*55,52,i%2?'#d33382':'#e94b95','lotus-petal');}
 const left=P(323,574),right=P(577,574);
 const upper=cubic(left,P(359,552),P(541,552),right,32);
 const bottom=cubic(right,P(557,673),P(342,673),left,36);
 shape([...upper,...bottom],'#421459','diya-bowl',6.5,'#fff5dd',P(450,620));
 line(cubic(left,P(385,588),P(515,588),right,32),'diya-lip',5.2,'#fff3df');
 for(let i=0;i<18;i++){const x=348+i*12,y=606+6*Math.sin(i/17*Math.PI);circle(x,y,2.5,'#fcefb6','diya-dot');}
 const base=P(450,574),peak=P(450,462);
 shape([...cubic(base,P(407,537),P(440,493),peak,26),...cubic(peak,P(486,497),P(494,540),base,26)],'#fd6e26','diya-flame',5.2,'#fff7d6',P(450,525));
 shape([...cubic(P(450,568),P(435,532),P(443,512),P(452,505),16),...cubic(P(452,505),P(463,525),P(464,548),P(450,568),16)],'#fff4ae','diya-flame-inner',2.2,'#ffe7b1',P(451,538));
 line(cubic(P(450,638),P(451,656),P(449,674),P(450,685),24),'diya-accent',2.6,'#ffc66c');
 circle(450,669,7,'#f3b437','diya-gem');model.componentCounts.diyas++;
 // Each border bead is an independent round region (no saw-tooth circle).
 const n=78;
 for(let i=0;i<n;i++){
  const a=-Math.PI/2+i*tau/n,x=450+320*Math.cos(a),y=400+320*Math.sin(a);
  circle(x,y,7.5,'#f5f1e7','border-bead','#fff9e7');model.componentCounts.beads++;
 }
 const plate=[...cubic(P(250,780),P(291,752),P(605,752),P(650,780),24),
  ...cubic(P(650,780),P(668,815),P(655,847),P(616,853),16),
  ...cubic(P(616,853),P(480,869),P(332,860),P(285,854),18),
  ...cubic(P(285,854),P(246,849),P(232,816),P(250,780),17)];
 shape(plate,'#811b25','name-plaque',6.8,'#f6cd80',P(450,815));
 line(cubic(P(272,783),P(360,766),P(554,766),P(628,783),28),'name-plaque-highlight',2.2,'#fff0d4');
 model.finalLabel={text:'६. भाऊबीज',x:450,y:814,size:44,color:'#fff3e6',maxWidth:335};
 model.semanticRegions={footprints:2,toes:10,diya:1,outerBeads:n,label:1};
 // Dot locations are sampled from actual stroke coordinates.
 const cells=new Set();
 for(const stroke of model.strokes){
  const ps=stroke.points;
  for(const k of [0,Math.floor(ps.length*.48)]){
   const [x,y]=ps[k],key=Math.round(x/26)+':'+Math.round(y/26);
   if(cells.has(key)||model.dots.length>=160)continue;
   cells.add(key);model.dots.push({x,y,size:3.4});
  }
 }
 if(model.componentCounts.footprints!==2||model.componentCounts.toes!==10||model.componentCounts.beads<70)
  throw new Error('Bhaubeej semantic geometry incomplete');
 window.RangoliDrawableDesigns=Object.freeze({...window.RangoliDrawableDesigns,[model.id]:model});
})();
