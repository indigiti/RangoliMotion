/* RangoliMotion v7 — authored vector drawing models.
   These are hand-built geometric interpretations of six reference motifs,
   not exact tracings, and not validated real-world drawing instructions. */
(() => {
  'use strict';
  const TAU = Math.PI * 2;
  const P = (x,y) => ({x,y});
  const polar=(cx,cy,r,a)=>P(cx+Math.cos(a)*r,cy+Math.sin(a)*r);
  const bez=(a,b,c,d,steps=24)=>Array.from({length:steps+1},(_,i)=>{
    const t=i/steps,q=1-t;
    return P(q*q*q*a.x+3*q*q*t*b.x+3*q*t*t*c.x+t*t*t*d.x,
             q*q*q*a.y+3*q*q*t*b.y+3*q*t*t*c.y+t*t*t*d.y);
  });
  const ring=(x,y,r,n=72)=>Array.from({length:n+1},(_,i)=>polar(x,y,r,i*TAU/n));
  const ellipse=(x,y,rx,ry,n=64)=>Array.from({length:n+1},(_,i)=>{
    const a=i*TAU/n;return P(x+rx*Math.cos(a),y+ry*Math.sin(a));
  });
  const polygon=(coords)=>coords.map(p=>Array.isArray(p)?P(p[0],p[1]):p);
  function begin(id,title,category,theme){
    const result={id,title,category,theme,dots:[],strokes:[],fills:[],mode:'vector_draw',authorship:'artistically reconstructed'};
    const dot=(x,y,size=4)=>result.dots.push(P(x,y));
    const stroke=(points,width=3,color='#fff0d2',kind='detail')=>result.strokes.push({points:points.map(p=>[Math.round(p.x*100)/100,Math.round(p.y*100)/100]),width,color,kind});
    const fill=(points,color,anchor=null)=>result.fills.push({points:points.map(p=>[Math.round(p.x*100)/100,Math.round(p.y*100)/100]),color,anchor:anchor?[anchor.x,anchor.y]:null});
    const shape=(points,color,width=3,edge='#fff0d2',kind='shape',anchor=null)=>{
      const poly=points.map(p=>p);fill(poly,color,anchor);stroke([...poly,poly[0]],width,edge,kind);
    };
    const curve=(points,width=3,color='#fff0d2')=>stroke(points,width,color,'detail');
    const bead=(x,y,r=5,color='#fff3dc')=>{shape(ring(x,y,r,16),color,1.2,color,'bead',P(x,y));dot(x,y,r)};
    const arc=(x,y,rx,ry,start,end,steps=32)=>Array.from({length:steps+1},(_,i)=>{
      const a=start+(end-start)*i/steps;return P(x+rx*Math.cos(a),y+ry*Math.sin(a));
    });
    const leaf=(a,b,width,color,edge='#fcebd4')=>{
      const mx=(a.x+b.x)/2,my=(a.y+b.y)/2;
      const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1,nx=-dy/len,ny=dx/len;
      const c1=P(mx+nx*width,my+ny*width),c2=P(mx-nx*width,my-ny*width);
      const one=bez(a,P((a.x+c1.x)/2,(a.y+c1.y)/2),P((b.x+c1.x)/2,(b.y+c1.y)/2),b,16);
      const two=bez(b,P((b.x+c2.x)/2,(b.y+c2.y)/2),P((a.x+c2.x)/2,(a.y+c2.y)/2),a,16);
      shape([...one,...two],color,3,edge,'petal',P(mx,my));
      curve([a,P(mx,my),b],1.1,'#fff7d0aa');
    };
    const lotus=(x,y,r=110,count=7,colors=['#e94f93','#f0a445','#df4288'])=>{
      for(let i=0;i<count;i++){const a=Math.PI+(i/(count-1))*Math.PI;
        leaf(P(x,y+18),polar(x,y,r,a),r*.36,colors[i%colors.length]);}
    };
    const flower=(x,y,r=36,count=9,colors=['#eb467b','#ffc86b'])=>{
      for(let i=0;i<count;i++){const a=-Math.PI/2+i*TAU/count;
        leaf(P(x,y),polar(x,y,r,a),r*.35,colors[i%colors.length]);}
      shape(ring(x,y,r*.25,32),'#f8d66b',2,'#fff0c7','ring',P(x,y));
    };
    const flame=(x,y,h=100)=>{
      const a=P(x,y),b=P(x,y-h),p1=bez(a,P(x-h*.46,y-h*.27),P(x-h*.27,y-h*.62),b,25),
        p2=bez(b,P(x+h*.44,y-h*.52),P(x+h*.39,y-h*.21),a,25);
      shape([...p1,...p2],'#fb7c22',3,'#fff4ca','flame',P(x,y-h*.43));
      const aa=P(x,y-10),bb=P(x,y-h*.72),l=bez(aa,P(x-h*.12,y-h*.25),P(x-h*.11,y-h*.5),bb,14),
        r=bez(bb,P(x+h*.20,y-h*.40),P(x+h*.15,y-h*.2),aa,14);
      shape([...l,...r],'#fff3b4',1.8,'#ffedac','flame',P(x,y-h*.4));
    };
    const diya=(x,y,w=160,s=1)=>{
      const h=w*.4,top=arc(x,y,w*.5,w*.15,Math.PI,0,48);
      const low=bez(P(x+w*.5,y),P(x+w*.48,y+h*.82),P(x-w*.48,y+h*.82),P(x-w*.5,y),40);
      shape([...top,...low],'#b52c69',4,'#fff0d1','bowl',P(x,y+h*.15));
      curve(arc(x,y,w*.49,w*.15,Math.PI,TAU,44),3,'#f9cfb6');
      shape(ellipse(x,y+h*.08,w*.25,h*.14,40),'#ef7d44',2,'#fff3d6','bowl',P(x,y+h*.08));
      flame(x,y-2,w*.62);
      for(let i=0;i<11;i++){const a=Math.PI+i*Math.PI/10;
        const pt=polar(x,y,w*.5,a);if(i%2===0)bead(pt.x,pt.y,2.8);}
    };
    return {result,dot,stroke,fill,shape,curve,bead,leaf,lotus,flower,flame,diya,ring,ellipse,arc,polygon};
  }
  function finish(o){
    const d=o.result;
    // Add guide points only at authored geometry anchors, not invented raster-image circles.
    const seen=new Set();
    for(const s of d.strokes){
      for(const [x,y] of [s.points[0],s.points[Math.floor(s.points.length/2)]]){
        const k=Math.round(x/12)+':'+Math.round(y/12);
        if(!seen.has(k)&&d.dots.length<115){seen.add(k);d.dots.push({x,y,size:3.8});}
      }
    }
    d.strokes=d.strokes.filter(s=>s.points.length>1);
    d.fills=d.fills.filter(f=>f.points.length>2);
    return d;
  }
  function designDiya(){
    const o=begin('a-01','Diya & Lotus','diya','midnight');
    const {leaf,flower,diya,bead,curve,shape,ellipse}=o;
    for(let i=0;i<7;i++){const a=Math.PI+i*Math.PI/6;
      leaf(P(450,588),polar(450,588,206,a),91,i%2?'#168b65':'#cf357b');}
    for(let i=0;i<11;i++){let x=250+i*40;flower(x,678+Math.abs(5-i)*5,25,7,i%2?['#ffa72b','#ffc43f']:['#fbce47','#e47f21']);}
    diya(450,453,325);
    curve(bez(P(260,480),P(365,540),P(535,540),P(640,480),45),5,'#ffe8c1');
    for(let i=0;i<12;i++){const a=Math.PI*.08+i*Math.PI*.84/11;let q=polar(450,468,185,a);bead(q.x,q.y,3.2);}
    return finish(o);
  }
  function designFloral(){
    const o=begin('a-06','Floral Mandala','floral','midnight');
    const {leaf,shape,ring,bead}=o;let x=450,y=450;
    for(let i=0;i<12;i++){const a=-Math.PI/2+i*TAU/12;
      leaf(P(x+Math.cos(a)*140,y+Math.sin(a)*140),polar(x,y,305,a),74,i%2?'#137c68':'#2b9e75');
    }
    for(let i=0;i<12;i++){const a=-Math.PI/2+i*TAU/12+TAU/24;
      leaf(P(x+Math.cos(a)*48,y+Math.sin(a)*48),polar(x,y,194,a),64,i%2?'#e94575':'#c72f5d');
    }
    shape(ring(x,y,55),'#ffbf54',3,'#fff2d2','ring',P(x,y));
    shape(ring(x,y,28),'#ad2257',2,'#fff2d2','ring',P(x,y));
    for(let i=0;i<12;i++){const a=i*TAU/12;const p=polar(x,y,324,a);bead(p.x,p.y,5);}
    return finish(o);
  }
  function designFootprints(){
    const o=begin('a-07','Footprints & Lotus','symbols','clay');
    const {leaf,shape,ellipse,bead,curve}=o;
    for(const side of [-1,1]){
      const x=450+side*112;
      const sole=bez(P(x,554),P(x+side*104,495),P(x+side*80,335),P(x+side*18,260),30)
        .concat(bez(P(x+side*18,260),P(x-side*68,236),P(x-side*74,405),P(x,554),30));
      shape(sole,'#cc263f',4,'#ffeccc','footprint',P(x,380));
      for(let k=0;k<5;k++){let xx=x+(k-2)*24+side*18, yy=220+Math.abs(k-2)*13;
        shape(ellipse(xx,yy,14-(k%3),19-(k%2),30),'#cc263f',3,'#fce9d6','toe',P(xx,yy));}
      bead(x,460,9,'#fce19e');
      curve(ellipse(x,465,26,20,40),2,'#fff1d7');
    }
    for(let i=0;i<7;i++){const a=Math.PI+i*Math.PI/6;
      leaf(P(450,675),polar(450,675,195,a),70,i%2?'#cf3983':'#ec69a2');}
    for(let i=0;i<5;i++){const a=Math.PI+i*Math.PI/4;
      leaf(P(450,735),polar(450,735,185,a),43,'#278c63');}
    return finish(o);
  }
  function designDiamond(){
    const o=begin('a-09','Diamond Lotus','floral','clay');
    const {shape,polygon,lotus,leaf,bead,stroke,curve}=o;
    shape(polygon([[450,95],[786,450],[450,805],[114,450]]),'#248357',7,'#ffe8c7','frame',P(450,450));
    shape(polygon([[450,144],[735,450],[450,756],[165,450]]),'#d6a32e',5,'#fff7e0','frame',P(450,450));
    shape(polygon([[450,186],[693,450],[450,714],[207,450]]),'#176944',5,'#fff5da','frame',P(450,450));
    lotus(450,555,240,9,['#d8377a','#ef73ab','#c52b66']);
    for(let i=0;i<4;i++){const a=i*Math.PI/2;
      const p=polar(450,450,337,a);bead(p.x,p.y,8,'#fff5df');}
    for(let a of [Math.PI*.15,Math.PI*.85]){
      leaf(P(450,595),polar(450,595,235,a),46,'#2c8f5c');}
    curve([P(330,574),P(450,585),P(565,574)],3,'#f9e0ba');
    return finish(o);
  }
  function designBorder(){
    const o=begin('a-14','Diya Garland','diya','midnight');
    const {flower,diya,leaf,curve,bead}=o;
    curve(bez(P(75,310),P(260,320),P(610,300),P(835,310),44),7,'#2a996c');
    for(let i=0;i<13;i++){
      const x=90+i*60;flower(x,260+(i%2)*12,28,7,i%2?['#f0b430','#df7d20']:['#bc224f','#f45069']);
      leaf(P(x,308),P(x-18,339),18,'#268864');
    }
    curve(bez(P(70,558),P(290,636),P(610,625),P(830,552),64),5,'#f6e4bd');
    for(let i=0;i<4;i++){
      const x=150+i*190;diya(x,500,130);
      leaf(P(x-20,580),P(x-75,623),29,'#2f986a');
      leaf(P(x+20,581),P(x+75,622),27,'#23895a');
      bead(x,610,4);
    }
    return finish(o);
  }
  function designSwirl(){
    const o=begin('a-16','Diya Floral Swirl','diya','midnight');
    const {diya,flower,leaf,curve,bead}=o;
    for(let i=0;i<7;i++){let a=Math.PI*.82+i*Math.PI*.17;
      leaf(P(425,582),polar(420,580,208,a),62,i%2?'#197d59':'#c12f76');}
    diya(382,468,320);
    curve(bez(P(210,612),P(90,733),P(296,824),P(375,713),48),5,'#fff2cf');
    curve(bez(P(565,583),P(740,480),P(812,701),P(660,756),46),5,'#fff2cf');
    curve(bez(P(262,700),P(306,749),P(374,683),P(332,661),27),4,'#fff2cf');
    for(let i=0;i<5;i++){
      const x=570+(i%2)*63,y=390+i*83;
      flower(x,y,35+(i%2)*8,8,['#ebae32','#ed4b77']);
      leaf(P(x-8,y+25),P(x-70,y+40),32,'#277f54');
    }
    for(let i=0;i<18;i++){const a=Math.PI*.2+i*Math.PI*1.1/17;const p=polar(388,500,204,a);bead(p.x,p.y,3.2);}
    return finish(o);
  }
  const list=[designDiya(),designFloral(),designFootprints(),designDiamond(),designBorder(),designSwirl()];
  for(const design of list){
    if(!design.dots.length||!design.strokes.length||!design.fills.length)
      throw new Error('Incomplete drawable model: '+design.id);
    if(design.strokes.some(s=>s.points.some(p=>!p.every(Number.isFinite))))
      throw new Error('Invalid vector path: '+design.id);
  }
  window.RangoliDrawableDesigns=Object.freeze(Object.fromEntries(list.map(d=>[d.id,d])));
})();
