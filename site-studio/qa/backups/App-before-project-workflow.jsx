import React, { useState, useRef, useEffect, lazy, Suspense } from 'react';
import { Cube, CaretDown, CaretRight, Buildings, TreeStructure, Stack, Eye, EyeSlash, LockKey, LockKeyOpen, FileImage, UploadSimple, DownloadSimple, VideoCamera, CreditCard, Lightbulb, Cursor, Ruler, MagnifyingGlass, Crosshair, Plus, Minus, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, X, Check, CheckCircle, WarningCircle, Trash, MapTrifold, MapPin, ArrowSquareOut, ShieldCheck, ArrowsOut, NavigationArrow, DotsThree, Info, GearSix } from '@phosphor-icons/react';
import MapCanvas from './MapCanvas.jsx';
import AddressSearch from './AddressSearch.jsx';
import AlignmentGuide from './AlignmentGuide.jsx';
import { computeTwoPointAlignment } from './alignment.js';
const PdfPagePicker=lazy(()=>import('./PdfPagePicker.jsx'));

const INITIAL_PLAN = {url:'/assets/ground-floor.png',name:'Ground floor',filename:'Ground floor.png',lat:41.8898,lng:-87.6366,width:140,height:105,rotation:0,opacity:0.94,visible:true,locked:false};
const offset=(east,north)=>({lat:INITIAL_PLAN.lat+north/111320,lng:INITIAL_PLAN.lng+east/(111320*Math.cos(INITIAL_PLAN.lat*Math.PI/180))});
const makeDevice=(id,type,name,east,north,bearing=0)=>({id,type,name,...offset(east,north),bearing,fov:72,range:28,height:3.2,lens:4,requirement:'Monitor the entrance approach'});
const INITIAL_DEVICES = [
  makeDevice('C-01','camera','Northwest parking',-51,34,90),
  makeDevice('C-02','camera','North approach',38,34,270),
  makeDevice('C-03','camera','West entrance',-52,-8,180),
  makeDevice('C-04','camera','Main entrance',0,-30,180),
  makeDevice('C-05','camera','Loading dock',48,-1,80),
  makeDevice('C-06','camera','South parking',49,-38,270),
  makeDevice('R-01','reader','Lobby reader',-6,-23),
  makeDevice('R-02','reader','Staff entrance',-35,8),
  makeDevice('R-03','reader','Dock reader',36,8),
  makeDevice('L-01','light','Entry lighting',-20,-39),
  makeDevice('L-02','light','Dock lighting',56,20)
];
const TYPE_META={camera:{label:'Cameras',singular:'Camera',Icon:VideoCamera,color:'#007f74',prefix:'C'},reader:{label:'Access control',singular:'Reader',Icon:CreditCard,color:'#8b5fc4',prefix:'R'},light:{label:'Lighting',singular:'Light',Icon:Lightbulb,color:'#b38321',prefix:'L'}};
function IconButton({label,children,...props}) {return <button className="icon-button" title={label} aria-label={label} {...props}>{children}</button>}
function NumberField({label,value,onChange,min,max,step=1,unit,digits}) {
  const [draft,setDraft]=useState(String(value));
  useEffect(()=>setDraft(digits!==undefined?Number(value).toFixed(digits):String(value)),[value,digits]);
  function commit(){const n=Number(draft);if(draft.trim()===''||!Number.isFinite(n)){setDraft(String(value));return;}const bounded=Math.min(max??Infinity,Math.max(min??-Infinity,n));if(bounded!==Number(digits!==undefined?Number(value).toFixed(digits):value))onChange(bounded);setDraft(String(bounded));}
  return <label className="number-label"><span>{label}</span><span className="number-wrap"><input type="number" aria-label={label} value={draft} step={step} min={min} max={max} onChange={e=>setDraft(e.target.value)} onBlur={commit} onKeyDown={e=>{if(e.key==='Enter')e.currentTarget.blur();}}/>{unit&&<span className="unit">{unit}</span>}</span></label>
}
function Modal({title,description,children,onClose,wide=false,className=''}) {
  const dialog=useRef(null);
  useEffect(()=>{const previous=document.activeElement;dialog.current?.showModal();return()=>previous?.focus?.()},[]);
  return <dialog ref={dialog} className={'modal '+(wide?'wide':'')+' '+className} onCancel={e=>{e.preventDefault();onClose()}} onClick={e=>{if(e.target===e.currentTarget)onClose()}}><div className="modal-heading"><div><h2>{title}</h2>{description&&<p>{description}</p>}</div><IconButton label="Close dialog" onClick={onClose}><X size={20}/></IconButton></div>{children}</dialog>
}
export function App(){
  const [plan,setPlan]=useState(INITIAL_PLAN);
  const [alignment,setAlignment]=useState(null);
  const [alignmentError,setAlignmentError]=useState('');
  const [alignmentUndo,setAlignmentUndo]=useState(null);
  const [compactPanel,setCompactPanel]=useState(null);
  const [devices,setDevices]=useState(INITIAL_DEVICES);
  const [selected,setSelected]=useState({kind:'plan'});
  const [tool,setTool]=useState('select');
  const [visibleTypes,setVisibleTypes]=useState({camera:true,reader:true,light:true});
  const [provider,setProvider]=useState('osm');
  const [googleKey,setGoogleKey]=useState('');
  const [mapStyle,setMapStyle]=useState('street');
  const [keyDraft,setKeyDraft]=useState('');
  const [sourceMenu,setSourceMenu]=useState(false);
  const [activeTab,setActiveTab]=useState('Design');
  const [inspectorTab,setInspectorTab]=useState('Alignment');
  const [modal,setModal]=useState(null);
  const [notice,setNotice]=useState('');
  const [mapError,setMapError]=useState('');
  const [measurement,setMeasurement]=useState(null);
  const [changed,setChanged]=useState(false);
  const [importBusy,setImportBusy]=useState(false);
  const [pdfFile,setPdfFile]=useState(null);
  const samplePdfRequest=useRef({controller:null,token:0});
  const mapApi=useRef(null), fileInput=useRef(null), projectInput=useRef(null), toastTimer=useRef(null);
  const currentDevice=selected.kind==='device'?devices.find(d=>d.id===selected.id):null;
  const counts=Object.fromEntries(Object.keys(TYPE_META).map(t=>[t,devices.filter(d=>d.type===t).length]));
  const toast=message=>{setNotice(message);clearTimeout(toastTimer.current);toastTimer.current=setTimeout(()=>setNotice(''),4500)};
  const changePlan=partial=>{if(alignment)return;if(['lat','lng','width','height','rotation','url'].some(key=>key in partial))setAlignmentUndo(null);setPlan(p=>({...p,...partial}));setChanged(true)};
  const changeDevice=(id,partial)=>{setDevices(ds=>ds.map(d=>d.id===id?{...d,...partial}:d));setChanged(true)};
  const choose=selection=>{setCompactPanel('inspector');setSelected(selection);setTool('select');setInspectorTab('Alignment')};
  const place=(type,pos)=>{
    const meta=TYPE_META[type];if(!meta)return;
    const maxId=devices.filter(d=>d.type===type).reduce((m,d)=>Math.max(m,Number(d.id.split('-')[1])||0),0);
    const id=meta.prefix+'-'+String(maxId+1).padStart(2,'0');
    setDevices(ds=>[...ds,{id,type,name:'New '+meta.singular.toLowerCase(),lat:pos.lat,lng:pos.lng,bearing:180,fov:72,range:28,height:3.2,lens:4,requirement:''}]);
    setSelected({kind:'device',id});setCompactPanel('inspector');setTool('select');setChanged(true);setVisibleTypes(v=>({...v,[type]:true}));toast(id+' placed. Drag the device to reposition it.');
  };
  useEffect(()=>{const escape=e=>{if(e.key==='Escape'){cancelSamplePdf();setTool('select');setSourceMenu(false);setModal(null);setPdfFile(null);setAlignment(null);setAlignmentError('')}};window.addEventListener('keydown',escape);return()=>{window.removeEventListener('keydown',escape);clearTimeout(toastTimer.current);samplePdfRequest.current.token+=1;samplePdfRequest.current.controller?.abort()}},[]);
  function setWidth(value){changePlan({width:value,height:plan.height*value/plan.width})}
  function nudge(east,north){changePlan({lat:plan.lat+north/111320,lng:plan.lng+east/(111320*Math.cos(plan.lat*Math.PI/180))})}
  function toggleLock(){changePlan({locked:!plan.locked});toast(plan.locked?'Alignment unlocked. Move the plan or adjust its corners.':'Alignment locked. Choose a device tool to place it on the map.')}
  async function importImage(file){
    if(alignment){toast('Finish or cancel alignment before importing a plan.');return;}
    if(!file)return;
    cancelSamplePdf();
    if(file.type==='application/pdf'||/\.pdf$/i.test(file.name)){if(file.size>50*1024*1024){toast('Choose a PDF smaller than 50 MB.');return;}setPdfFile(file);setModal('pdf');if(fileInput.current)fileInput.current.value='';return;}
    if(!/^image\/(png|jpeg|webp)$/.test(file.type)){toast('Choose a PDF, PNG, JPG, or WebP drawing.');return;}
    if(file.size>12*1024*1024){toast('Choose an image smaller than 12 MB.');return}
    setImportBusy(true);
    try {
      const url=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(file)});
      const dimensions=await new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve({width:im.naturalWidth,height:im.naturalHeight});im.onerror=reject;im.src=url});
      const center=mapApi.current?.getCenter()||plan;
      setAlignmentUndo(null);
      setPlan({...INITIAL_PLAN,url,filename:file.name,name:file.name.replace(/\.[^.]+$/,''),lat:center.lat,lng:center.lng,width:140,height:140*dimensions.height/dimensions.width,opacity:0.75,locked:false});
      setSelected({kind:'plan'});setCompactPanel('inspector');setTool('select');setChanged(true);setModal(null);toast('Plan imported. Align it with the map, then lock its position.');
    } catch {toast('That image could not be opened. Try a PNG or JPG.')}
    finally {setImportBusy(false);if(fileInput.current)fileInput.current.value=''}
  }
  function importPdfPage(image){
    cancelSamplePdf();
    const center=mapApi.current?.getCenter()||plan;
    const width=Math.min(140,2000*image.width/image.height),height=width*image.height/image.width;
    if(width<5||height<1){toast('This sheet is too narrow for a site plan. Crop it to the drawing area and try again.');return;}
    const label=image.pageLabel&&image.pageLabel!==String(image.pageNumber)?image.pageLabel:'Page '+image.pageNumber;
    const sourcePdf={filename:image.filename,pageNumber:image.pageNumber,pageCount:image.pageCount,pageLabel:image.pageLabel||String(image.pageNumber),widthPoints:image.widthPoints,heightPoints:image.heightPoints,rasterWidth:image.width,rasterHeight:image.height};
    setAlignmentUndo(null);
    setPlan({...INITIAL_PLAN,url:image.url,name:image.filename.replace(/\.pdf$/i,'')+' · '+label,filename:image.filename+' · Page '+image.pageNumber,lat:center.lat,lng:center.lng,width,height,opacity:0.65,visible:true,locked:false,sourcePdf});
    setSelected({kind:'plan'});setCompactPanel('inspector');setInspectorTab('Alignment');setTool('select');setMapStyle('satellite');setChanged(true);setModal(null);setPdfFile(null);
    toast('PDF page '+image.pageNumber+' imported. Use two-point alignment to match it to the building.');
  }
  function cancelSamplePdf(){
    const request=samplePdfRequest.current;
    request.token+=1;
    if(request.controller){request.controller.abort();request.controller=null;setImportBusy(false);}
  }
  async function openSamplePdf(){
    if(importBusy)return;
    const abort=new AbortController();
    const token=++samplePdfRequest.current.token;
    samplePdfRequest.current.controller=abort;
    setImportBusy(true);
    try {
      const response=await fetch('/assets/demo-campus-plans.pdf',{signal:abort.signal});
      if(!response.ok)throw new Error();
      const blob=await response.blob();
      if(abort.signal.aborted||token!==samplePdfRequest.current.token)return;
      const file=new File([blob],'Demo campus plans.pdf',{type:'application/pdf'});
      setPdfFile(file);setModal('pdf');
    } catch {
      if(!abort.signal.aborted&&token===samplePdfRequest.current.token)toast('The sample PDF could not be opened. Choose a PDF from your computer.');
    } finally {
      if(token===samplePdfRequest.current.token){samplePdfRequest.current.controller=null;setImportBusy(false);}
    }
  }
  async function exportProject(){
    let portable=plan.url;
    if(portable.startsWith('/')){const blob=await(await fetch(portable)).blob();portable=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(blob)})}
    const content=JSON.stringify({format:'physec-studio',version:1,name:'Westbrook Campus',plan:{...plan,url:portable},devices,visibleTypes},null,2);
    const url=URL.createObjectURL(new Blob([content],{type:'application/json'}));
    const a=document.createElement('a');a.href=url;a.download='westbrook-campus.physec.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);setChanged(false);toast('Project exported with the plan image and device locations.');
  }
  async function importProject(file){
    if(!file)return;
    cancelSamplePdf();
    try {
      if(file.size>20*1024*1024)throw new Error();
      const data=JSON.parse(await file.text());
      const p=data.plan;
      const finite=(n,min,max)=>typeof n==='number'&&Number.isFinite(n)&&n>=min&&n<=max;
      if(data.format!=='physec-studio'||data.version!==1||!p||!/^data:image\/(png|jpeg|webp);base64,/.test(p.url)||!finite(p.lat,-85,85)||!finite(p.lng,-180,180)||!finite(p.width,1,2000)||!finite(p.height,1,2000)||!finite(p.rotation,-360,360)||!finite(p.opacity,0,1)||!Array.isArray(data.devices)||data.devices.length>500)throw new Error();
      const ids=new Set();
      if(data.devices.some(d=>!TYPE_META[d.type]||typeof d.id!=='string'||!/^[CRL]-\d+$/.test(d.id)||ids.has(d.id)||!(ids.add(d.id))||!finite(d.lat,-85,85)||!finite(d.lng,-180,180)||!finite(d.bearing,0,360)||!finite(d.fov,10,160)||!finite(d.range,1,150)))throw new Error();
      const pdf=p.sourcePdf;
      const sourcePdf=pdf&&Number.isInteger(pdf.pageNumber)&&Number.isInteger(pdf.pageCount)&&pdf.pageNumber>=1&&pdf.pageNumber<=pdf.pageCount&&pdf.pageCount<=10000?{
        filename:String(pdf.filename||'Imported PDF').slice(0,240),
        pageNumber:pdf.pageNumber,pageCount:pdf.pageCount,pageLabel:String(pdf.pageLabel||pdf.pageNumber).slice(0,100),
        ...(finite(pdf.widthPoints,Number.MIN_VALUE,Number.MAX_VALUE)?{widthPoints:pdf.widthPoints}:{}),
        ...(finite(pdf.heightPoints,Number.MIN_VALUE,Number.MAX_VALUE)?{heightPoints:pdf.heightPoints}:{}),
        ...(Number.isInteger(pdf.rasterWidth)&&finite(pdf.rasterWidth,1,3200)?{rasterWidth:pdf.rasterWidth}:{}),
        ...(Number.isInteger(pdf.rasterHeight)&&finite(pdf.rasterHeight,1,3200)?{rasterHeight:pdf.rasterHeight}:{}),
      }:undefined;
      setAlignmentUndo(null);setPlan({...p,name:String(p.name||'Imported plan'),filename:String(p.filename||'Imported image'),sourcePdf});setDevices(data.devices);setVisibleTypes({camera:true,reader:true,light:true});setSelected({kind:'plan'});setChanged(false);setModal(null);toast('Project restored. Use Fit plan to center the map.');
    }catch {toast('This is not a supported PhySec project file. Export a project from this prototype first.')}
    if(projectInput.current)projectInput.current.value='';
  }
  function selectProvider(next){
    setSourceMenu(false);setMapError('');
    if(next==='osm'||next==='usgs'){setProvider('osm');setMapStyle(next==='usgs'?'satellite':'street');return;}
    if(googleKey){setProvider('google')}else setModal('google');
  }
  function locateProperty(place){mapApi.current?.goTo(place.lat,place.lng,19);setCompactPanel(null);setTool('select');}
  function bringPlanTo(place){
    if(plan.locked){toast('Unlock alignment before moving your plan.');return;}
    changePlan({lat:place.lat,lng:place.lng,visible:true,opacity:0.5});
    choose({kind:'plan'});
    toast('Plan moved here at 50% opacity. Rotate and resize it to match the building. Devices keep their coordinates.');
  }
  const basemapLabel=provider==='google'?'Google Maps':mapStyle==='satellite'?'USGS Imagery':'OpenStreetMap';
  const openNav=tab=>{setActiveTab(tab);if(tab!=='Design')setModal(tab.toLowerCase())};
  const closeModal=()=>{cancelSamplePdf();setModal(null);setPdfFile(null);setActiveTab('Design')};
  const exportAction=()=>exportProject().catch(()=>toast('Export failed. Please try again.'));
  function cancelAlignment(){setAlignment(null);setAlignmentError('');setTool('select');}
  function startAlignment(){
    if(plan.locked){toast('Unlock alignment before matching points.');return;}
    setAlignment({phase:'source',originalPlan:{...plan},sourcePoints:[],targetPoints:[],result:null,previewOpacity:0.5});
    setAlignmentError('');setCompactPanel(null);setSelected({kind:'plan'});setTool('select');setMeasurement(null);setMapStyle('satellite');setSourceMenu(false);
    mapApi.current?.fitPlanForAlignment?.();
  }
  function pickAlignmentPoint(point){
    if(!alignment||alignment.phase==='preview')return;
    if(alignment.phase==='source'){
      if(alignment.sourcePoints.length===2)return;
      if(alignment.sourcePoints.length===1){
        const a=alignment.sourcePoints[0],p=alignment.originalPlan;
        if(Math.hypot((point.u-a.u)*p.width,(point.v-a.v)*p.height)<Math.hypot(p.width,p.height)*0.01){setAlignmentError('Choose a second point farther away from the first.');return;}
      }
      setAlignment({...alignment,sourcePoints:[...alignment.sourcePoints,point]});setAlignmentError('');return;
    }
    const targetPoints=[...alignment.targetPoints,point];
    if(targetPoints.length===1){setAlignment({...alignment,targetPoints});setAlignmentError('');return;}
    try {const result=computeTwoPointAlignment(alignment.originalPlan,alignment.sourcePoints,targetPoints);setAlignment({...alignment,targetPoints,result,phase:'preview'});setAlignmentError('');}
    catch(error){setAlignmentError(error.message);}
  }
  function backAlignment(){
    if(!alignment)return;setAlignmentError('');
    if(alignment.phase==='preview'){setAlignment({...alignment,phase:'target',targetPoints:alignment.targetPoints.slice(0,1),result:null});return;}
    if(alignment.phase==='target'){setAlignment(alignment.targetPoints.length?{...alignment,targetPoints:alignment.targetPoints.slice(0,-1)}:{...alignment,phase:'source'});return;}
    setAlignment({...alignment,sourcePoints:alignment.sourcePoints.slice(0,-1)});
  }
  function restartAlignment(){if(!alignment)return;setAlignment({...alignment,phase:'source',sourcePoints:[],targetPoints:[],result:null});setAlignmentError('');mapApi.current?.fitPlanForAlignment?.();}
  function applyAlignment(){
    if(!alignment?.result)return;
    const before=alignment.originalPlan;
    setAlignmentUndo({lat:before.lat,lng:before.lng,width:before.width,height:before.height,rotation:before.rotation,opacity:before.opacity,visible:before.visible});
    setPlan(p=>({...p,...alignment.result,visible:true,opacity:alignment.previewOpacity}));
    setChanged(true);cancelAlignment();setCompactPanel('inspector');setInspectorTab('Alignment');
    toast('Two-point alignment applied. Check the remaining edges, then lock alignment.');
  }
  function undoAlignment(){if(!alignmentUndo||plan.locked)return;setPlan(p=>({...p,...alignmentUndo}));setAlignmentUndo(null);setChanged(true);toast('Previous plan alignment restored.');}
  const displayPlan=!alignment?plan:alignment.phase==='source'?{...alignment.originalPlan,visible:true,opacity:1,locked:true}:alignment.phase==='target'?{...alignment.originalPlan,visible:false,locked:true}:{...alignment.originalPlan,...alignment.result,visible:true,opacity:alignment.previewOpacity,locked:true};
  const toolText=tool==='select'?(selected.kind==='plan'&&!plan.locked&&plan.visible?'Align plan · drag the center or resize with the corners':null):tool==='ruler'?'Measure · click two points on the map':('Place '+TYPE_META[tool].singular.toLowerCase()+' · click a location on the map');
  return <div className={'app'+(alignment?' alignment-active':'')}>
    <header className="app-header" inert={alignment?true:undefined}>
      <a href="#" className="brand" onClick={e=>{e.preventDefault();mapApi.current?.fitPlan();choose({kind:'plan'})}}><Cube weight="duotone" size={30}/><span>PhySec</span></a>
      <span className="studio-label">Site Studio</span>
      <div className="breadcrumb"><span>Projects</span><span className="slash">/</span><strong>Westbrook Campus</strong><CaretDown size={13}/></div>
      <span className="stage-badge">Concept design</span>
      <span className="draft-status"><span className={'status-dot '+(changed?'changed':'')}/>{changed?'Draft changes':'Session draft'}</span>
      <button className="button secondary export-button" onClick={exportAction}><DownloadSimple size={18}/>Export</button>
      <button className="button primary" onClick={()=>{setModal('review');setActiveTab('Review')}}>Review design<ArrowSquareOut size={16}/></button>
    </header>
    <nav inert={alignment?true:undefined} className="workflow-nav" aria-label="Project workflow">{['Overview','Design','Equipment','Review'].map(tab=><button key={tab} className={activeTab===tab?'active':''} onClick={()=>openNav(tab)}>{tab}</button>)}<div className="nav-caption"><span className="small-dot"/>Planning workspace</div></nav>
    <div inert={alignment?true:undefined} className="compact-panels" aria-label="Workspace panels"><button aria-pressed={compactPanel==='project'} onClick={()=>setCompactPanel(p=>p==='project'?null:'project')}><Stack size={16}/>Project & layers</button><button aria-pressed={compactPanel==='inspector'} onClick={()=>setCompactPanel(p=>p==='inspector'?null:'inspector')}><GearSix size={16}/>Properties</button><button onClick={()=>setModal('import')}><UploadSimple size={16}/>Import plan</button></div>
    <main className={'workspace'+(alignment?' aligning':'')} data-panel={compactPanel||'map'}>
      <aside className="sidebar" inert={alignment?true:undefined}>
        <div className="sidebar-main">
          <div className="section-heading"><h2>Project</h2><IconButton label="Project details" onClick={()=>setModal('overview')}><DotsThree size={20}/></IconButton></div>
          <button className="tree-root" onClick={()=>{mapApi.current?.fitPlan();choose({kind:'plan'})}}><CaretDown size={13}/><Buildings size={18}/><strong>Westbrook Campus</strong></button>
          <button className="tree-row" onClick={()=>{changePlan({visible:false});mapApi.current?.fitPlan();toast('Campus exterior · plan overlay hidden')}}><TreeStructure size={17}/><span>Campus exterior</span></button>
          <button className={'tree-row '+(plan.visible?'selected':'')} onClick={()=>{changePlan({visible:true});choose({kind:'plan'});mapApi.current?.fitPlan()}}><Buildings size={18}/><span>Building A / Ground floor</span></button>
          <div className="side-divider"/>
          <div className="section-heading"><h2>Site plans</h2><span className="count">1</span></div>
          <div className={'plan-row '+(selected.kind==='plan'?'selected':'')}>
            <button className="plan-select" onClick={()=>choose({kind:'plan'})}><img src={plan.url} alt="Ground floor plan thumbnail"/><span><strong>{plan.filename}</strong><small>{plan.sourcePdf?'PDF · Page '+plan.sourcePdf.pageNumber+' of '+plan.sourcePdf.pageCount:'Building A · Plan overlay'}</small></span></button>
            <div className="plan-meta"><span className="plan-opacity">{Math.round(plan.opacity*100)}% opacity</span><IconButton label={plan.visible?'Hide site plan':'Show site plan'} aria-pressed={plan.visible} onClick={()=>changePlan({visible:!plan.visible})}>{plan.visible?<Eye size={18}/>:<EyeSlash size={18}/>}</IconButton><IconButton label={plan.locked?'Unlock plan':'Lock plan'} onClick={toggleLock}>{plan.locked?<LockKey size={17}/>:<LockKeyOpen size={17}/>}</IconButton></div>
          </div>
          <div className="side-divider"/>
          <div className="section-heading"><h2>Security layers</h2><span className="count">{devices.length}</span></div>
          {Object.entries(TYPE_META).map(([type,meta])=><div className="layer-row" key={type}><IconButton label={(visibleTypes[type]?'Hide ':'Show ')+meta.label.toLowerCase()} onClick={()=>setVisibleTypes(v=>({...v,[type]:!v[type]}))} aria-pressed={visibleTypes[type]}>{visibleTypes[type]?<Eye size={18}/>:<EyeSlash size={18}/>}</IconButton><meta.Icon size={19}/><span>{meta.label}</span><span className="layer-count">{counts[type]}</span></div>)}
          <button className="text-button all-devices" onClick={()=>setModal('equipment')}>View equipment list<CaretRight size={14}/></button>
        </div>
        <div className="sidebar-bottom"><button className="button secondary import-button" onClick={()=>setModal('import')}><UploadSimple size={19}/>Import site plan</button><div className="workspace-label"><Buildings size={17}/><div>Demo workspace<small>Fictional plan · real map tiles</small></div><IconButton label="Open saved project" onClick={()=>projectInput.current?.click()}><UploadSimple size={16}/></IconButton></div></div>
      </aside>
      <section className="map-viewport" aria-label="Interactive site design map" onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();importImage(e.dataTransfer.files[0])}}>
        <MapCanvas plan={displayPlan} alignment={alignment} onAlignmentPick={pickAlignmentPoint} onAlignmentError={setAlignmentError} onAlignmentCancel={cancelAlignment} devices={devices} visibleTypes={visibleTypes} selected={selected} tool={tool} provider={provider} googleKey={googleKey} mapStyle={mapStyle} googleType={mapStyle==='satellite'?'satellite':'roadmap'} onSelect={choose} onPlanChange={changePlan} onDeviceChange={changeDevice} onPlace={place} onMeasure={setMeasurement} onMapReady={api=>mapApi.current=api} onError={message=>setMapError(message)}/>
        <div className="map-topbar">
          <AddressSearch onLocation={locateProperty} onPlacePlan={bringPlanTo} onImportPlan={()=>setModal('import')} planLocked={plan.locked||Boolean(alignment)} disablePlanActions={Boolean(alignment)}/>
          <div className="source-wrap"><button className={'map-source '+(sourceMenu?'open':'')} onClick={()=>setSourceMenu(s=>!s)} aria-expanded={sourceMenu} aria-label="Choose map provider"><Stack size={19}/><span>{basemapLabel}</span><CaretDown size={14}/></button>{sourceMenu&&<div className="source-menu"><span className="eyebrow">BASEMAP</span><button onClick={()=>selectProvider('osm')}><MapTrifold size={21}/><span><strong>OpenStreetMap</strong><small>Street map · no key needed</small></span>{provider==='osm'&&mapStyle==='street'&&<Check size={18}/>}</button><button onClick={()=>selectProvider('usgs')}><Buildings size={21}/><span><strong>USGS Imagery</strong><small>Satellite / aerial · U.S. coverage</small></span>{provider==='osm'&&mapStyle==='satellite'&&<Check size={18}/>}</button><button onClick={()=>selectProvider('google')}><MapPin size={21}/><span><strong>Google Maps</strong><small>{googleKey?'Satellite & street':'Connect your Maps API key'}</small></span>{provider==='google'&&<Check size={18}/>}</button></div>}
            <div className="basemap-style" role="group" aria-label="Map view"><button aria-pressed={mapStyle==='street'} onClick={()=>{setMapStyle('street');setMapError('')}}>Street</button><button aria-pressed={mapStyle==='satellite'} onClick={()=>{setMapStyle('satellite');setMapError('')}}>Satellite</button></div>
          </div>
        </div>
        <div className="north"><NavigationArrow size={22} weight="fill"/><span>N</span></div>
        {!alignment&&toolText&&<div className="map-hint"><Crosshair size={16}/><span>{toolText}</span></div>}
        {mapError&&<div className="map-error"><WarningCircle size={18}/><span>{mapError}</span>{(provider==='google'||mapStyle==='satellite')&&<button onClick={()=>selectProvider('osm')}>Use street map</button>}<IconButton label="Dismiss map message" onClick={()=>setMapError('')}><X size={16}/></IconButton></div>}
        {measurement!==null&&<div className="measurement"><Ruler size={18}/><strong>{measurement.toFixed(1)} m</strong><span>measured distance</span><IconButton label="Clear measurement" onClick={()=>{setMeasurement(null);setTool('select')}}><X size={15}/></IconButton></div>}
        <div className="map-bottom"><div className="canvas-note"><span className="small-dot"/>Illustrative coverage{provider==='osm'&&mapStyle==='satellite'&&<span className="imagery-source-note">USGS aerial · U.S. coverage · dates & detail vary</span>}</div><div className="tool-dock" role="toolbar" aria-label="Map drawing tools">{[{type:'select',label:'Select',Icon:Cursor},{type:'camera',label:'Camera',Icon:VideoCamera},{type:'reader',label:'Reader',Icon:CreditCard},{type:'light',label:'Light',Icon:Lightbulb},{type:'ruler',label:'Measure',Icon:Ruler}].map(({type,label,Icon})=><button key={type} aria-label={label+' tool'} className={tool===type?'active':''} onClick={()=>{setTool(type);if(type==='ruler')setMeasurement(null)}} aria-pressed={tool===type}><Icon size={22} weight={tool===type?'fill':'regular'}/><span>{label}</span></button>)}</div><div className="map-controls"><IconButton label="Fit plan" onClick={()=>mapApi.current?.fitPlan()}><ArrowsOut size={19}/></IconButton><div className="zoom-group"><IconButton label="Zoom in" onClick={()=>mapApi.current?.zoomIn()}><Plus size={19}/></IconButton><IconButton label="Zoom out" onClick={()=>mapApi.current?.zoomOut()}><Minus size={19}/></IconButton></div></div></div>
      </section>
      <aside className={'inspector'+(alignment?' alignment-inspector':'')}>
        {alignment?<AlignmentGuide alignment={alignment} error={alignmentError} onBack={backAlignment} onNext={()=>{setAlignment(a=>({...a,phase:'target',targetPoints:[]}));setAlignmentError('')}} onRestart={restartAlignment} onCancel={cancelAlignment} onApply={applyAlignment} onOpacity={value=>setAlignment(a=>({...a,previewOpacity:value}))}/>:currentDevice?<><div className="inspector-header"><span className="eyebrow">{TYPE_META[currentDevice.type].singular.toUpperCase()} PROPERTIES</span><div className="title-row"><h1>{currentDevice.id}</h1><span className="proposed-badge">Proposed</span></div><p>{currentDevice.name}</p></div><div className="inspector-body">
          <div className="device-heading" style={{color:TYPE_META[currentDevice.type].color}}>{React.createElement(TYPE_META[currentDevice.type].Icon,{size:36,weight:'duotone'})}<div><strong>{currentDevice.type==='camera'?'4 MP varifocal dome':currentDevice.type==='reader'?'Access control reader':'Exterior light'}</strong><small>Generic design object</small></div></div>
          <label className="text-field"><span>Device name</span><input value={currentDevice.name} onChange={e=>changeDevice(currentDevice.id,{name:e.target.value})}/></label>
          {currentDevice.type==='camera'&&<><NumberField label="Mounting height" value={currentDevice.height} min={0.5} max={30} step={0.1} unit="m" onChange={v=>changeDevice(currentDevice.id,{height:v})}/><NumberField label="Horizontal FOV" value={currentDevice.fov} min={10} max={160} unit="°" onChange={v=>changeDevice(currentDevice.id,{fov:v})}/><NumberField label="Range" value={currentDevice.range} min={1} max={150} unit="m" onChange={v=>changeDevice(currentDevice.id,{range:v})}/><div className="slider-field"><label htmlFor="bearing">Aim / bearing<strong>{Math.round(currentDevice.bearing)}°</strong></label><input id="bearing" type="range" min="0" max="360" value={currentDevice.bearing} onChange={e=>changeDevice(currentDevice.id,{bearing:Number(e.target.value)})}/><div className="range-labels"><span>North · 0°</span><span>360°</span></div></div></>}
          <div className="side-divider"/><h3>Design intent</h3><label className="text-field"><span className="sr-only">Design intent</span><textarea rows="3" placeholder="What should this device protect?" value={currentDevice.requirement} onChange={e=>changeDevice(currentDevice.id,{requirement:e.target.value})}/></label>
          <div className="note amber"><WarningCircle size={19}/><span>Coverage is conceptual. Verify scale, obstructions and lighting on site.</span></div>
          <button className="button danger" onClick={()=>{setDevices(ds=>ds.filter(d=>d.id!==currentDevice.id));choose({kind:'plan'});setChanged(true);toast('Device removed from this draft.')}}><Trash size={17}/>Remove device</button>
        </div></>:<><div className="inspector-header"><span className="eyebrow">PLAN OVERLAY</span><div className="title-row"><h1>{plan.name}</h1><IconButton label="Plan details" onClick={()=>setInspectorTab('Details')}><DotsThree size={21}/></IconButton></div><p>{plan.filename}</p><div className="segmented" role="tablist" aria-label="Plan inspector">{['Alignment','Details'].map(t=><button role="tab" aria-selected={inspectorTab===t} className={inspectorTab===t?'active':''} key={t} onClick={()=>setInspectorTab(t)}>{t}</button>)}</div></div>
          <div className="inspector-body">
            {inspectorTab==='Alignment'?<>
              <button className="button secondary full-width two-point-trigger" disabled={plan.locked} onClick={startAlignment}><Crosshair size={18}/>Two-point alignment</button><p className="two-point-help">Match two plan corners to the building.</p>
              {alignmentUndo&&<button className="text-button undo-alignment" disabled={plan.locked} onClick={undoAlignment}>Undo last alignment</button>}
              <div className="slider-field"><label htmlFor="opacity">Opacity<strong>{Math.round(plan.opacity*100)}%</strong></label><input id="opacity" type="range" min="0" max="100" value={Math.round(plan.opacity*100)} onChange={e=>changePlan({opacity:Number(e.target.value)/100})}/><div className="range-labels"><span>Map</span><span>Plan</span></div></div>
              <div className="alignment-quick-actions"><button onClick={()=>changePlan({opacity:0.5,visible:true})}>50% overlay</button><button onClick={()=>changePlan({visible:!plan.visible})}>{plan.visible?<EyeSlash size={14}/>:<Eye size={14}/>} {plan.visible?'Hide plan':'Show plan'}</button></div>
              <button className="button secondary full-width align-here" disabled={plan.locked} onClick={()=>{const center=mapApi.current?.getCenter();if(center)bringPlanTo(center)}}><Crosshair size={16}/>Bring plan to map center</button>
              <fieldset className="alignment-fields" disabled={plan.locked}><NumberField label="Rotation" value={plan.rotation} min={-180} max={180} unit="°" onChange={v=>changePlan({rotation:v})}/><NumberField label="Width" value={Number(plan.width.toFixed(1))} min={5} max={1000} step={1} unit="m" onChange={setWidth}/><p className="field-hint">Height scales proportionally.</p><div className="position-title">Position</div><div className="coordinate-fields"><NumberField label="Latitude" value={plan.lat} min={-85} max={85} step={0.00001} digits={5} onChange={v=>changePlan({lat:v})}/><NumberField label="Longitude" value={plan.lng} min={-180} max={180} step={0.00001} digits={5} onChange={v=>changePlan({lng:v})}/></div><div className="nudge-buttons"><IconButton label="Nudge plan north 1 metre" onClick={()=>nudge(0,1)}><ArrowUp size={18}/></IconButton><IconButton label="Nudge plan south 1 metre" onClick={()=>nudge(0,-1)}><ArrowDown size={18}/></IconButton><IconButton label="Nudge plan west 1 metre" onClick={()=>nudge(-1,0)}><ArrowLeft size={18}/></IconButton><IconButton label="Nudge plan east 1 metre" onClick={()=>nudge(1,0)}><ArrowRight size={18}/></IconButton></div></fieldset>
              <div className="side-divider"/><p className="alignment-help">{plan.locked?'Your plan position is locked. Devices can still be added and adjusted.':'Align a known wall or boundary with the map.'}</p><button className="button primary full-width" onClick={toggleLock}>{plan.locked?<LockKeyOpen size={18}/>:<LockKey size={18}/>} {plan.locked?'Unlock alignment':'Lock alignment'}</button><button className="text-button reset-link" disabled={plan.locked} onClick={()=>{changePlan({rotation:0,width:INITIAL_PLAN.width,height:INITIAL_PLAN.width*plan.height/plan.width});toast('Rotation and scale reset.')}}>Reset rotation & scale</button>
              <div className="note teal next-step"><VideoCamera size={22}/><div><strong>Next: place your devices</strong><p>Cameras and readers stay anchored as you zoom.</p></div></div>
            </>:<>
              <label className="text-field"><span>Plan name</span><input value={plan.name} onChange={e=>changePlan({name:e.target.value})}/></label><div className="detail-list">{plan.sourcePdf&&<><div><span>Source PDF</span><strong>{plan.sourcePdf.filename}</strong></div><div><span>Selected page</span><strong>{plan.sourcePdf.pageNumber} of {plan.sourcePdf.pageCount}</strong></div></>}<div><span>Building</span><strong>Building A</strong></div><div><span>Level</span><strong>Ground floor</strong></div><div><span>Dimensions</span><strong>{plan.width.toFixed(1)} × {plan.height.toFixed(1)} m</strong></div><div><span>Alignment</span><strong>{plan.locked?'Locked':'Editable'}</strong></div><div><span>Map coordinates</span><strong>WGS 84</strong></div></div>
              <button className="button secondary full-width" disabled={plan.locked} onClick={()=>{const c=mapApi.current?.getCenter();if(c)bringPlanTo(c)}}><Crosshair size={18}/>Move plan to map center</button><button className="button secondary full-width" onClick={()=>fileInput.current?.click()}><UploadSimple size={18}/>Replace drawing</button><div className="note"><Info size={18}/><span>The sample plan is fictional and is not surveyed to this location. Align your own drawing before using measurements.</span></div>
            </>}
          </div></>}
        <div className="inspector-footer" hidden={Boolean(alignment)}><ShieldCheck size={15}/><span>Local prototype · export to keep changes</span></div>
      </aside>
    </main>
    {notice&&<div className="toast" role="status"><CheckCircle size={19}/><span>{notice}</span><IconButton label="Dismiss notification" onClick={()=>setNotice('')}><X size={15}/></IconButton></div>}
    <input ref={fileInput} className="sr-only" type="file" accept="application/pdf,.pdf,image/png,image/jpeg,image/webp" onChange={e=>importImage(e.target.files[0])}/>
    <input ref={projectInput} className="sr-only" type="file" accept=".json" onChange={e=>importProject(e.target.files[0])}/>
    {modal==='import'&&<Modal title="Bring your site into focus" description="Place a drawing over your map, then align it to the site." onClose={closeModal}><button className="upload-zone" onClick={()=>fileInput.current?.click()} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();importImage(e.dataTransfer.files[0])}}><UploadSimple size={34}/><strong>{importBusy?'Opening your plan…':'Choose a site plan'}</strong><span>or drag a drawing here</span><small>PDF up to 50 MB · PNG, JPG or WebP up to 12 MB</small></button><div className="import-steps"><span><b>1</b> Choose drawing</span><span><b>2</b> Align to map</span><span><b>3</b> Place devices</span></div><p className="modal-note">PDFs open in a page picker. The selected page replaces the current plan; device coordinates are retained. CAD drawings can be exported as PDF first.</p><button className="text-button sample-pdf-button" disabled={importBusy} onClick={openSamplePdf}><FileImage size={17}/>Try a sample PDF drawing set</button><br/><button className="text-button" onClick={()=>projectInput.current?.click()}>Open an exported PhySec project instead<ArrowRight size={15}/></button></Modal>}
    {modal==='pdf'&&pdfFile&&<Modal wide className="pdf-modal" title="Choose a PDF page" description={pdfFile.name} onClose={closeModal}><Suspense fallback={<div className="pdf-opening" role="status">Opening PDF importer…</div>}><PdfPagePicker file={pdfFile} onImport={importPdfPage} onChooseAnother={()=>{setPdfFile(null);setModal('import')}} onCancel={closeModal}/></Suspense></Modal>}
    {modal==='google'&&<Modal title="Connect Google Maps" description="Use Google's street and satellite imagery beneath your site plan." onClose={closeModal}><div className="note teal"><MapTrifold size={22}/><span>OpenStreetMap works right now without a key. Your plan and device positions are shared across map sources.</span></div><form onSubmit={e=>{e.preventDefault();if(keyDraft.trim().length<10){toast('Enter a valid Maps JavaScript API key.');return}setGoogleKey(keyDraft.trim());setProvider('google');setMapStyle('satellite');setMapError('');closeModal();toast('Connecting to Google Maps…')}}><label className="text-field"><span>Maps JavaScript API key</span><input autoComplete="off" type="password" placeholder="Paste your browser-restricted key" value={keyDraft} onChange={e=>setKeyDraft(e.target.value)} required/></label><p className="modal-note">The key is used only in this browser session and is excluded from project exports. Enable the Maps JavaScript API and allow this localhost address in its website restrictions.</p><a className="external-link" href="https://developers.google.com/maps/documentation/javascript/get-api-key" target="_blank" rel="noreferrer">Google Maps setup guide<ArrowSquareOut size={15}/></a><div className="modal-actions"><button type="button" className="button secondary" onClick={closeModal}>Keep current map</button><button className="button primary" type="submit">Connect Google Maps</button></div></form></Modal>}
    {modal==='overview'&&<Modal title="Westbrook Campus" description="A concept design workspace for planning physical security." onClose={closeModal}><div className="project-overview"><Buildings size={40} weight="duotone"/><div><strong>Building A / Ground floor</strong><p>1 plan overlay · {devices.length} security objects</p></div></div><div className="detail-list"><div><span>Design stage</span><strong>Concept design</strong></div><div><span>Plan alignment</span><strong>{plan.locked?'Locked':'In progress'}</strong></div><div><span>Basemap</span><strong>{basemapLabel}</strong></div></div><div className="note"><Info size={20}/><span>This demo uses a fictional plan on a real map. Import your own plan and find its address to begin a site-specific design.</span></div><div className="modal-actions"><button className="button secondary" onClick={()=>projectInput.current?.click()}><UploadSimple size={18}/>Open project</button><button className="button primary" onClick={closeModal}>Continue designing</button></div></Modal>}
    {modal==='equipment'&&<Modal wide title="Project equipment" description="Every placed object, tied to its location on the map." onClose={closeModal}><div className="equipment-table"><table><thead><tr><th>Device</th><th>Name</th><th>Type</th><th>Position</th><th></th></tr></thead><tbody>{devices.map(d=><tr key={d.id}><td><span className="device-id" style={{color:TYPE_META[d.type].color}}>{React.createElement(TYPE_META[d.type].Icon,{size:18})}{d.id}</span></td><td>{d.name}</td><td>{TYPE_META[d.type].singular}</td><td className="mono">{d.lat.toFixed(5)}, {d.lng.toFixed(5)}</td><td><button className="text-button" onClick={()=>{closeModal();choose({kind:'device',id:d.id});mapApi.current?.goTo(d.lat,d.lng)}}>Locate<ArrowSquareOut size={13}/></button></td></tr>)}</tbody></table>{!devices.length&&<p className="empty-state">No equipment yet. Choose a device tool to place your first object.</p>}</div><div className="modal-actions"><span className="muted">{devices.length} objects in this draft</span><button className="button primary" onClick={exportAction}><DownloadSimple size={18}/>Export project</button></div></Modal>}
    {modal==='review'&&<Modal title="Review the design" description="A clear checkpoint before taking the concept into the field." onClose={closeModal}><div className="review-summary"><div><strong>{counts.camera}</strong><span>Cameras</span></div><div><strong>{counts.reader}</strong><span>Readers</span></div><div><strong>{counts.light}</strong><span>Lights</span></div></div><div className="review-check"><span className={plan.locked?'check-good':'check-warn'}>{plan.locked?<CheckCircle size={24}/>:<WarningCircle size={24}/>}</span><div><strong>{plan.locked?'Plan alignment is locked':'Plan alignment is still editable'}</strong><p>{plan.locked?'Confirm the scale against a known site dimension.':'Align and lock the plan before finalizing device locations.'}</p></div></div><div className="review-check"><WarningCircle className="check-warn" size={24}/><div><strong>Field verification required</strong><p>Confirm coverage, obstructions, lighting, mounting positions and access requirements on site.</p></div></div><div className="review-check"><FileImage size={24}/><div><strong>Save a portable design file</strong><p>Export includes the plan image, alignment, and equipment coordinates. No API key is included.</p></div></div><div className="modal-actions"><button className="button secondary" onClick={closeModal}>Back to design</button><button className="button primary" onClick={exportAction}><DownloadSimple size={18}/>Export project</button></div></Modal>}
  </div>
}