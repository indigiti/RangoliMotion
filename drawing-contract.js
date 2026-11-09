/* RangoliMotion drawing contract v8 — invariant for all processed artwork.
   Unreviewed auto-traces are NOT tutorials. See docs/RANGOLI_DRAWING_RULES.md. */
(() => {
  'use strict';
  const stages=Object.freeze(['dots','outline','outline_complete','fill','final']);
  const positive=(x)=>Number.isFinite(x)&&x>=0;
  function timeline({dotMs,outlineMs,outlineCompleteMs,fillMs,finalMs}){
    if(![dotMs,outlineMs,outlineCompleteMs,fillMs,finalMs].every(positive)
        ||dotMs<=0||outlineMs<=0||outlineCompleteMs<=0||fillMs<=0||finalMs<=0)
      throw new Error('All five rangoli phases must have positive finite duration');
    const totalMs=dotMs+outlineMs+outlineCompleteMs+fillMs+finalMs;
    const endpoints=[0,dotMs,dotMs+outlineMs,dotMs+outlineMs+outlineCompleteMs,
      dotMs+outlineMs+outlineCompleteMs+fillMs,totalMs];
    if(endpoints.some((x,i)=>i>0&&x<=endpoints[i-1]))throw new Error('Invalid drawing order');
    const result={dotMs,outlineMs,outlineCompleteMs,fillMs,finalMs,totalMs,endpoints,
      stops:endpoints.map(x=>x/totalMs)};
    assertTimeline(result);
    return result;
  }
  function assertTimeline(t){
    if(!t||!Array.isArray(t.endpoints)||t.endpoints.length!==6
       ||t.endpoints.some((x,i)=>i>0&&x<=t.endpoints[i-1]))
      throw new Error('Drawing pipeline must be: dots → outline → outline_complete → fill → final');
    if(!Number.isFinite(t.totalMs)||t.totalMs<=0||Math.abs(t.endpoints[5]-t.totalMs)>.01)
      throw new Error('Invalid total duration');
    return true;
  }
  function stageAt(elapsed,t){
    assertTimeline(t);
    const e=Math.max(0,Math.min(t.totalMs,Number.isFinite(elapsed)?elapsed:0));
    if(e<t.endpoints[1])return stages[0];
    if(e<t.endpoints[2])return stages[1];
    if(e<t.endpoints[3])return stages[2];
    if(e<t.endpoints[4])return stages[3];
    return stages[4];
  }
  function validateModel(model,{derived=false}={}){
    if(!model||!Array.isArray(model.dots)||!Array.isArray(model.strokes)||!Array.isArray(model.fills)
       ||!model.dots.length||!model.strokes.length||!model.fills.length)
      throw new Error('Drawing requires dots, outline strokes and fill regions');
    for(const d of model.dots)
      if(!Number.isFinite(d.x)||!Number.isFinite(d.y))
        throw new Error('Invalid dot geometry');
    for(const s of model.strokes){
      const points=s.points;
      if(!Array.isArray(points)||points.length<2||
          points.some(p=>!Array.isArray(p)||p.length!==2||p.some(v=>!Number.isFinite(v))))
        throw new Error('Invalid outline geometry');
    }
    for(const f of model.fills)
      if(!Array.isArray(f.points)||f.points.length<3||
          f.points.some(p=>!Array.isArray(p)||p.length!==2||p.some(v=>!Number.isFinite(v))))
        throw new Error('Invalid fill region geometry');
    // Enforce design-grounded dots: decorative arbitrary grids are not allowed.
    // Freehand designs may use anchor dots rather than a traditional pulli grid.
    const sampled=[];
    for(const line of model.strokes){
      const step=Math.max(1,Math.floor(line.points.length/70));
      for(let i=0;i<line.points.length;i+=step)sampled.push(line.points[i]);
      sampled.push(line.points[line.points.length-1]);
    }
    const attached=model.dots.filter(d=>sampled.some(p=>
      Math.abs(d.x-p[0])<=28&&Math.abs(d.y-p[1])<=28&&Math.hypot(d.x-p[0],d.y-p[1])<=28));
    if(attached.length<Math.ceil(model.dots.length*.8))
      throw new Error('Guide dots must correspond to the actual stroke geometry');
    if(derived && (model.tutorialCapable===true || model.verification==='verified'))
      throw new Error('Unreviewed image processing must never claim tutorial verification');
    return true;
  }
  window.RangoliDrawingRules=Object.freeze({stages,timeline,assertTimeline,stageAt,validateModel});
})();
