import { useState } from 'react';
import { Crosshair, Check, X, ArrowRight, ArrowLeft, ArrowCounterClockwise } from '@phosphor-icons/react';

export default function AlignmentGuide({alignment,error,onBack,onNext,onRestart,onCancel,onApply,onOpacity}) {
  const [showReference,setShowReference]=useState(false);
  const {phase,sourcePoints,targetPoints,originalPlan,result,previewOpacity}=alignment;
  const count=phase==='source'?sourcePoints.length:targetPoints.length;
  const step=phase==='source'?0:phase==='target'?1:2;
  return <div className="alignment-guide">
    <div className="alignment-guide-header"><span className="eyebrow">TWO-POINT ALIGNMENT</span><button aria-label="Cancel two-point alignment" onClick={onCancel}><X size={18}/></button></div>
    <ol className="alignment-steps" aria-label="Alignment progress">{['Plan','Building','Preview'].map((label,index)=><li key={label} className={step===index?'current':step>index?'done':''} aria-current={step===index?'step':undefined}><span>{step>index?<Check size={12}/>:index+1}</span>{label}</li>)}</ol>
    <div className="alignment-guide-body">
      <h2>{phase==='source'?'Mark two plan corners':phase==='target'?'Match the building corners':'Review the alignment'}</h2>
      <p className="alignment-instruction">{phase==='source'?'Click two distinct corners on your drawing. Choose points far apart for a more reliable match.':phase==='target'?'The plan is hidden. Click the same corners on the aerial image, in the same order.':'Check that the remaining walls line up before applying. The drawing keeps its proportions.'}</p>
      {phase!=='preview'?<div className="alignment-points" aria-live="polite">{[0,1].map(index=><div key={index} className={(index<count?'picked ':index===count?'next ':'')+(phase==='target'?'target':'')}><span className="point-number">{index+1}</span><span>{index<count?'Point '+(index+1)+' selected':index===count?'Click '+(phase==='source'?'plan':'building')+' point '+(index+1):'Then select point '+(index+1)}</span>{index<count&&<Check size={16}/>}</div>)}</div>:<><dl className="alignment-summary"><div><dt>Rotation</dt><dd>{result.rotation.toFixed(1)}°</dd></div><div><dt>Plan width</dt><dd>{result.width.toFixed(1)} m</dd></div><div><dt>Scale change</dt><dd>{(result.width/originalPlan.width).toFixed(3)}×</dd></div></dl><label className="alignment-opacity">Preview opacity <strong>{Math.round(previewOpacity*100)}%</strong><input aria-label="Alignment preview opacity" type="range" min="0" max="100" value={Math.round(previewOpacity*100)} onChange={e=>onOpacity(Number(e.target.value)/100)}/></label></>}
      {phase==='target'&&<><button className="alignment-reference-toggle" aria-expanded={showReference} onClick={()=>setShowReference(show=>!show)}>{showReference?'Hide plan points':'View plan points'}</button><div className={'alignment-reference'+(showReference?' reference-open':'')}><div style={{aspectRatio:originalPlan.width+'/'+originalPlan.height}}><img src={originalPlan.url} alt="Plan reference points"/>{sourcePoints.map((point,index)=><span key={index} style={{left:point.u*100+'%',top:point.v*100+'%'}}>{index+1}</span>)}</div><small>Your two points on the drawing</small></div></>}
      {error&&<div className="alignment-error" role="alert">{error}</div>}
      <p className="alignment-footnote">{phase==='preview'?'Only the plan moves. Device locations stay unchanged.':'Pan and zoom the map to place each point accurately.'}</p>
    </div>
    <div className="alignment-guide-footer">
      <div className="alignment-guide-actions"><button className="button secondary" onClick={onBack} disabled={phase==='source'&&count===0}><ArrowLeft size={15}/>Back</button>{phase==='source'?<button className="button primary" disabled={sourcePoints.length!==2} onClick={onNext}>Match building<ArrowRight size={15}/></button>:phase==='preview'?<button className="button primary" onClick={onApply}><Check size={16}/>Apply alignment</button>:<span className="alignment-pick-hint"><Crosshair size={16}/>Pick point {count+1} on map</span>}</div>
      <div className="alignment-secondary-actions"><button onClick={onRestart}><ArrowCounterClockwise size={14}/>Start over</button><button onClick={onCancel}>Cancel</button></div>
    </div>
  </div>;
}
