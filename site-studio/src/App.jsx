import React, { useState, useRef, useEffect, useMemo, lazy, Suspense } from 'react';
import { Cube, CaretDown, CaretRight, Buildings, TreeStructure, Stack, Eye, EyeSlash, LockKey, LockKeyOpen, FileImage, UploadSimple, DownloadSimple, VideoCamera, CreditCard, Lightbulb, Cursor, Ruler, MagnifyingGlass, Crosshair, Plus, Minus, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, X, Check, CheckCircle, WarningCircle, Trash, MapTrifold, MapPin, ArrowSquareOut, ShieldCheck, ArrowsOut, NavigationArrow, DotsThree, Info, GearSix, Door, BellRinging, Phone, Network, HardDrives, Path, Package, PlusCircle, Wall, Polygon, NotePencil, ArrowUUpLeft, ArrowUUpRight } from '@phosphor-icons/react';
import { BrandMark } from './BrandMark.jsx';
import { AccountMenu } from './AccountMenu.jsx';
import MapCanvas from './MapCanvas.jsx';
import AddressSearch from './AddressSearch.jsx';
import AlignmentGuide from './AlignmentGuide.jsx';
import { computeTwoPointAlignment } from './alignment.js';
import { createBlankPlan, makeId, normalizeProject, exportPortableProject, normalizeSecurityZone, normalizeSurveyNote, MAX_FLOOR_ZONES, createProjectRevision, MAX_PROJECT_FILE_BYTES } from './projectModel.js';
import { useProjectStore } from './projectStorage.js';
import { sameDesignValue } from './projectHistory.js';
import { DEVICE_TYPES, EQUIPMENT_CATALOG, catalogItem } from './catalog.js';
import { buildBOM, bomToCsv } from './materials.js';
import FloorManager from './FloorManager.jsx';
import EquipmentPanel from './EquipmentPanel.jsx';
import MaterialsPanel from './MaterialsPanel.jsx';
import RevisionPanel from './RevisionPanel.jsx';
import { RevisionReviewOwner } from './RevisionReview.jsx';
import RouteInspector from './RouteInspector.jsx';
import BarrierInspector from './BarrierInspector.jsx';
import CameraControls from './CameraControls.jsx';
import { computeCameraCoverage, computeCombinedCoverage } from './coverage.js';
import { defaultCoverageArea } from './coverageArea.js';
import CombinedCoveragePanel from './CombinedCoveragePanel.jsx';
import { CoverageStyleControl, DoriLegend } from './DoriControls.jsx';
import { detectableArea } from './dori.js';
import ZoneInspector, { ZoneCameraSummary, ZoneResult } from './ZoneInspector.jsx';
import { ZONE_TYPES, zoneCoverage } from './securityZones.js';
import SurveyInspector, { SurveyNoteList } from './SurveyInspector.jsx';
import ReportExportPanel from './ReportExportPanel.jsx';
import CapacityPanel, { CapacityDeviceSettings } from './CapacityPanel.jsx';
import { normalizeDeviceCapacity } from './capacity.js';
import { preserveDeviceSurveys, surveyPhotoSize, surveyPosition, SURVEY_LIMITS, SURVEY_PHOTO_LIMIT_MESSAGE } from './survey.js';
import './floors.css';
import './project-panels.css';
import './routes.css';
import './workflow.css';
const PdfPagePicker=lazy(()=>import('./PdfPagePicker.jsx'));

const INITIAL_PLAN = {url:'/assets/ground-floor.png',name:'Ground floor',filename:'Ground floor.png',lat:41.8898,lng:-87.6366,width:140,height:105,rotation:0,opacity:0.94,visible:true,locked:false};
const EMPTY_BARRIERS=[];
const EMPTY_ZONES=[];
const EMPTY_SURVEY_NOTES=[];
const TYPE_ICONS={camera:VideoCamera,reader:CreditCard,light:Lightbulb,door:Door,sensor:BellRinging,intercom:Phone,switch:Network,cabinet:HardDrives};
const TYPE_META=Object.fromEntries(Object.entries(DEVICE_TYPES).map(([type,meta])=>[type,{...meta,Icon:TYPE_ICONS[type]||Cube}]));
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
  return <dialog ref={dialog} aria-label={title} className={'modal '+(wide?'wide':'')+' '+className} onCancel={e=>{e.preventDefault();onClose()}} onClick={e=>{if(e.target===e.currentTarget)onClose()}}><div className="modal-heading"><div><h2>{title}</h2>{description&&<p>{description}</p>}</div><IconButton label="Close dialog" onClick={onClose}><X size={20}/></IconButton></div>{children}</dialog>
}
// `account` is the signed-in person ({ name }) with `onSignedOut`, or null where there is no
// server (the Sites package), which has no account menu (story 1.3).
export function App({ account = null, onSignedOut } = {}){
  const { project, revisions, setProject, replaceProject, setActiveFloor, addRevision, removeRevision,
    undo, redo, undoTarget, redoTarget, ready, saveStatus, error: saveError } = useProjectStore();
  const floor=project.floors.find(f=>f.id===project.activeFloorId)||project.floors[0];
  const building=project.buildings.find(b=>b.id===floor.buildingId);
  const plan=floor.plan,devices=floor.devices,routes=floor.routes,barriers=floor.barriers||EMPTY_BARRIERS;
  const zones = floor.zones ?? EMPTY_ZONES;
  const surveyNotes = floor.surveyNotes ?? EMPTY_SURVEY_NOTES;
  const hasPlan=Boolean(plan.url);
  const updateFloor=(id,update,group)=>setProject(p=>({...p,floors:p.floors.map(f=>f.id===id?update(f):f)}),group ? id + ':' + group : null);
  const setPlan=(update,group)=>updateFloor(floor.id,f=>({...f,plan:typeof update==='function'?update(f.plan):update}),group);
  const setDevices=(update,group)=>updateFloor(floor.id,f=>({...f,devices:typeof update==='function'?update(f.devices):update}),group);
  const [routeDraft,setRouteDraft]=useState(null);
  const [barrierDraft,setBarrierDraft]=useState(null);
  const [barrierError,setBarrierError]=useState('');
  const [analysisCameraId,setAnalysisCameraId]=useState(null);
  const [showCoverage,setShowCoverage]=useState(true);
  const [dori,setDori]=useState(false);
  const [coverageMode,setCoverageMode]=useState('single');
  const [coverageAreaDraft,setCoverageAreaDraft]=useState(null);
  const [coverageAreaError,setCoverageAreaError]=useState('');
  const [activeZoneId, setActiveZoneId] = useState(null);
  const [zoneDraft, setZoneDraft] = useState(null);
  const [zoneError, setZoneError] = useState('');
  const [newSurvey, setNewSurvey] = useState(null);
  const [placementItem,setPlacementItem]=useState(null);
  const [alignment,setAlignment]=useState(null);
  const [alignmentError,setAlignmentError]=useState('');
  const [alignmentUndo,setAlignmentUndo]=useState(null);
  const [compactPanel,setCompactPanel]=useState(null);
  const [selected,setSelected]=useState({kind:'plan'});
  const [tool,setTool]=useState('select');
  const [visibleTypes,setVisibleTypes]=useState(Object.fromEntries(Object.keys(TYPE_META).map(type=>[type,true])));
  const [provider,setProvider]=useState('osm');
  const [googleKey,setGoogleKey]=useState('');
  const [mapStyle,setMapStyle]=useState('street');
  const [keyDraft,setKeyDraft]=useState('');
  const [sourceMenu,setSourceMenu]=useState(false);
  const [activeTab,setActiveTab]=useState('Design');
  const [inspectorTab,setInspectorTab]=useState('Alignment');
  const [modal,setModal]=useState(null);
  const [reviewRevision, setReviewRevision] = useState(null);
  const [notice,setNotice]=useState('');
  const [mapError,setMapError]=useState('');
  const [measurement,setMeasurement]=useState(null);
  const [changed,setChanged]=useState(false);
  const [importBusy,setImportBusy]=useState(false);
  const [pdfFile,setPdfFile]=useState(null);
  const [pdfImportToken,setPdfImportToken]=useState(null);
  // All import paths share ownership so a late read cannot replace a newer floor or file.
  const importRequest=useRef({controller:null,reader:null,token:0});
  const mapApi=useRef(null), fileInput=useRef(null), projectInput=useRef(null), toastTimer=useRef(null);
  const currentDevice=selected.kind==='device'?devices.find(d=>d.id===selected.id):null;
  const currentRoute=routeDraft||(selected.kind==='route'?routes.find(r=>r.id===selected.id):null);
  const currentBarrier=barrierDraft||(selected.kind==='barrier'?barriers.find(b=>b.id===selected.id):null);
  const activeZone = zones.find(zone => zone.id === activeZoneId);
  const currentZone = zoneDraft ?? (selected.kind === 'zone' ? activeZone : null);
  const currentSurvey = selected.kind === 'survey'
    ? newSurvey ?? surveyNotes.find(note => note.id === selected.id)
    : null;
  const surveyDevice = currentSurvey?.anchor.kind === 'device'
    ? devices.find(device => device.id === currentSurvey.anchor.deviceId)
    : null;
  const surveying = tool === 'survey' || Boolean(currentSurvey);
  const zonePoints = activeZone?.points;
  const hasZoneTarget = Boolean(activeZone?.targetLevel);
  const analysisCamera=devices.find(d=>d.type==='camera'&&d.id===analysisCameraId)||devices.find(d=>d.type==='camera');
  const effectiveBarriers=useMemo(()=>{
    if(!barrierDraft||barrierDraft.points.length<(barrierDraft.kind==='wall'?2:3))return barriers;
    return [...barriers.filter(b=>b.id!==barrierDraft.id),barrierDraft];
  },[barriers,barrierDraft]);
  const coverageResult=useMemo(()=>{
    if(!analysisCamera||alignment)return null;
    try{return computeCameraCoverage(analysisCamera,effectiveBarriers,{cellSize:0.75,maxCells:6000,dori,contours:coverageMode==='single'&&showCoverage})}
    catch(error){return {nominalPolygons:[],visiblePolygons:[],blockedPolygons:[],nearBlindPolygons:[],stats:null,warnings:[error?.message||'Coverage could not be calculated. Check the camera settings and barrier outline.']}}
  },[analysisCamera,effectiveBarriers,alignment,dori,coverageMode,showCoverage]);
  const floorCameras=useMemo(()=>devices.filter(d=>d.type==='camera'),[devices]);
  const defaultArea=useMemo(()=>defaultCoverageArea(plan,floorCameras),[plan,floorCameras]);
  const analysisArea=floor.coverageArea||defaultArea;
  const areaSource=floor.coverageArea?'Custom area':defaultArea.source;
  const combinedTargetHeight=floor.coverageTargetHeight??0;
  const zoneAnalysis = useMemo(() => {
    if (!zonePoints || !hasZoneTarget || alignment || zoneDraft) return null;
    return computeCombinedCoverage(floorCameras, effectiveBarriers, {
      area: zonePoints, targetHeight: combinedTargetHeight, dori: true,
      cellSize: 0.75, maxCells: 10000, contours: true,
    });
  }, [zonePoints, hasZoneTarget, floorCameras, effectiveBarriers, combinedTargetHeight, alignment, zoneDraft]);
  const zoneResult = useMemo(() => activeZone && zoneCoverage(activeZone, zoneAnalysis), [activeZone, zoneAnalysis]);
  const combinedResult=useMemo(()=>{
    if(coverageMode!=='combined'||alignment||coverageAreaDraft||activeZone)return null;
    try{return computeCombinedCoverage(floorCameras,effectiveBarriers,{area:analysisArea.points,targetHeight:combinedTargetHeight,cellSize:0.75,maxCells:10000,dori,contours:showCoverage})}
    catch(error){return {invalid:true,boundaryPolygons:[],singlePolygons:[],overlapPolygons:[],uncoveredPolygons:[],stats:null,warnings:[error?.message||'Combined coverage could not be calculated. Check the analysis area and camera settings.']}}
  },[coverageMode,floorCameras,effectiveBarriers,analysisArea,combinedTargetHeight,alignment,coverageAreaDraft,dori,showCoverage,activeZone]);
  const coverageData=useMemo(()=>coverageMode==='combined'?{mode:'combined',combined:combinedResult}:{selectedId:analysisCamera?.id,cameras:coverageResult?[{id:analysisCamera.id,result:coverageResult}]:[]},[coverageMode,combinedResult,analysisCamera,coverageResult]);
  const allDevices=project.floors.flatMap(f=>f.devices);
  const allRoutes=project.floors.flatMap(f=>f.routes);
  const counts=Object.fromEntries(Object.keys(TYPE_META).map(t=>[t,devices.filter(d=>d.type===t).length]));
  const toast=message=>{setNotice(message);clearTimeout(toastTimer.current);toastTimer.current=setTimeout(()=>setNotice(''),4500)};
  const changePlan=(partial,field)=>{if(alignment)return;if(['lat','lng','width','height','rotation','url'].some(key=>key in partial))setAlignmentUndo(null);setPlan(p=>({...p,...partial}),field ? 'plan:' + field : null);setChanged(true)};
  const changeDevice=(id,partial,field)=>{setDevices(ds=>ds.map(d=>d.id===id?{...d,...partial}:d),field ? id + ':' + field : null);setChanged(true)};
  function changeCapacityDevice(floorId, deviceId, partial) {
    updateFloor(floorId, item => ({
      ...item, devices: item.devices.map(device => {
        if (device.id !== deviceId) return device;
        const capacity = { ...normalizeDeviceCapacity(device), ...partial };
        return { ...device, capacity: normalizeDeviceCapacity({ ...device, capacity }) };
      }),
    }));
  }
  const choose = selection => {
    setNewSurvey(null);
    clearZoneDraft();
    setCoverageAreaDraft(null);setCoverageAreaError('');setRouteDraft(null);setBarrierDraft(null);setBarrierError('');
    if (selection.kind === 'zone' && selection.id) setActiveZoneId(selection.id);
    if (selection.kind === 'coverage-area') setActiveZoneId(null);
    if(selection.kind==='device'&&devices.find(d=>d.id===selection.id)?.type==='camera')setAnalysisCameraId(selection.id);
    setCompactPanel('inspector');setSelected(selection);setTool('select');setInspectorTab('Alignment');
  };
  function resetEditing(){setNewSurvey(null);clearZoneDraft();setActiveZoneId(null);setCoverageAreaDraft(null);setCoverageAreaError('');setBarrierDraft(null);setBarrierError('');setAnalysisCameraId(null);setAlignment(null);setAlignmentError('');setAlignmentUndo(null);setRouteDraft(null);setSelected({kind:'plan'});setTool('select');setMeasurement(null);setPlacementItem(null);}
  function selectFloor(id){
    if(id===floor.id)return;
    cancelImport();setModal(null);resetEditing();setCompactPanel(null);
    setActiveFloor(id);
    const next=project.floors.find(f=>f.id===id);if(next)mapApi.current?.goTo(next.plan.lat,next.plan.lng,19);
  }
  function addBuilding(name){
    const id=makeId('building'),floorId=makeId('floor'),center=mapApi.current?.getCenter()||plan;
    cancelImport();setModal(null);
    setProject(p=>({...p,buildings:[...p.buildings,{id,name}],floors:[...p.floors,{id:floorId,buildingId:id,name:'Ground floor',plan:createBlankPlan(center),devices:[],routes:[],barriers:[]}],activeFloorId:floorId}));
    resetEditing();toast(name+' added. Import a drawing for its ground floor.');
  }
  function addFloor(buildingId,name){
    const id=makeId('floor'),center=mapApi.current?.getCenter()||plan;
    cancelImport();setModal(null);
    setProject(p=>({...p,floors:[...p.floors,{id,buildingId,name,plan:createBlankPlan(center),devices:[],routes:[],barriers:[]}],activeFloorId:id}));
    resetEditing();toast(name+' added. Import its drawing to begin.');
  }
  function removeFloor(id){
    if(project.floors.length<2)return;
    cancelImport();setModal(null);
    const next=project.floors.filter(f=>f.id!==id);
    setProject(p=>({...p,floors:p.floors.filter(f=>f.id!==id),activeFloorId:p.activeFloorId===id?next[0].id:p.activeFloorId}));
    if(id===floor.id){resetEditing();mapApi.current?.goTo(next[0].plan.lat,next[0].plan.lng,19)}
    toast('Floor and its equipment and routes removed.');
  }
  const place=(type,pos)=>{
    const meta=TYPE_META[type];if(!meta)return;
    const item=placementItem?.type===type?placementItem:EQUIPMENT_CATALOG.find(i=>i.type===type);
    const maxId=allDevices.filter(d=>d.type===type).reduce((m,d)=>Math.max(m,Number(d.id.split('-').pop())||0),0);
    const id=meta.prefix+'-'+String(maxId+1).padStart(2,'0');
    const defaults={bearing:180,fov:72,range:28,height:3.2,lens:4,mounting:'',...item?.defaults};
    setDevices(ds=>[...ds,{...defaults,id,type,name:item?.name||'New '+meta.singular.toLowerCase(),catalogId:item?.id||'',model:item?.model||'Generic',lat:pos.lat,lng:pos.lng,notes:'',requirement:'',status:'proposed'}]);
    if(type==='camera')setAnalysisCameraId(id);
    setSelected({kind:'device',id});setCompactPanel('inspector');setTool('select');setChanged(true);setVisibleTypes(v=>({...v,[type]:true}));toast(id+' placed on '+floor.name+'.');
  };
  function chooseCatalog(item){clearZoneDraft();setCoverageAreaDraft(null);setCoverageAreaError('');setBarrierDraft(null);setBarrierError('');setPlacementItem(item);setTool(item.type);setRouteDraft(null);setModal(null);setActiveTab('Design');setCompactPanel(null);toast('Click the map to place '+item.name+'.')}
  function removeDevice(id){
    const hasSurvey = surveyNotes.some(note => note.anchor.kind === 'device' && note.anchor.deviceId === id);
    updateFloor(floor.id, f => ({
      ...f,
      devices: f.devices.filter(device => device.id !== id),
      routes: f.routes.filter(route => route.fromDeviceId !== id && route.toDeviceId !== id),
      surveyNotes: preserveDeviceSurveys(f.surveyNotes ?? [], f.devices.find(device => device.id === id)),
    }));
    choose({kind:'plan'});setChanged(true);
    toast(hasSurvey ? 'Device removed. Survey notes kept at its last location.' : 'Device and its connected routes removed.');
  }
  function changeRoute(id,partial){updateFloor(floor.id,f=>({...f,routes:f.routes.map(r=>r.id===id?{...r,...partial}:r)}));setChanged(true)}
  function startRoute(existing=null){
    if(devices.length<2){toast('Place at least two devices on this floor to connect a cable route.');return}
    clearZoneDraft();setCoverageAreaDraft(null);setCoverageAreaError('');setBarrierDraft(null);setBarrierError('');
    const target=devices.find(d=>d.id!==devices[0].id&&(d.type==='switch'||d.type==='cabinet'))||devices[1];
    setRouteDraft(existing?{...existing,via:[...existing.via]}:{name:'Cable route '+(routes.length+1),fromDeviceId:devices[0].id,toDeviceId:target.id,via:[],cableType:'cat6',slackPercent:10});
    setTool('route');setCompactPanel('inspector');setSelected({kind:'route'});setMeasurement(null);
  }
  function saveRoute(){
    if(!routeDraft||routeDraft.fromDeviceId===routeDraft.toDeviceId||!devices.some(d=>d.id===routeDraft.fromDeviceId)||!devices.some(d=>d.id===routeDraft.toDeviceId))return;
    const route={...routeDraft,id:routeDraft.id||makeId('route')};
    updateFloor(floor.id,f=>({...f,routes:routeDraft.id?f.routes.map(r=>r.id===route.id?route:r):[...f.routes,route]}));
    setRouteDraft(null);setTool('select');setSelected({kind:'route',id:route.id});toast('Cable route saved. Length and materials updated.');
  }
  function cancelRoute(){setRouteDraft(null);setTool('select');setSelected({kind:'plan'})}
  function startBarrier(kind,existing=null){
    clearZoneDraft();setCoverageAreaDraft(null);setCoverageAreaError('');setRouteDraft(null);setBarrierError('');setPlacementItem(null);setMeasurement(null);
    setBarrierDraft(existing?{...existing,points:existing.points.map(p=>({...p}))}:{name:(kind==='wall'?'Wall ':'Obstruction ')+(barriers.filter(b=>b.kind===kind).length+1),kind,points:[],height:kind==='wall'?3:2,enabled:true});
    setTool(kind);setCompactPanel('inspector');setSelected({kind:'barrier'});setShowCoverage(true);
  }
  function normalizeBarriers(next){
    return normalizeProject({...project,floors:project.floors.map(f=>f.id===floor.id?{...f,barriers:next}:f)},{allowLocalAssets:true}).floors.find(f=>f.id===floor.id).barriers;
  }
  function saveBarrier(){
    if(!barrierDraft)return;
    const barrier={...barrierDraft,id:barrierDraft.id||makeId('barrier')};
    let next=barrierDraft.id?barriers.map(b=>b.id===barrier.id?barrier:b):[...barriers,barrier];
    try{next=normalizeBarriers(next)}catch(error){setBarrierError(error.message||'Check the outline and try again.');return}
    updateFloor(floor.id,f=>({...f,barriers:next}));setBarrierDraft(null);setBarrierError('');setTool('select');setSelected({kind:'barrier',id:barrier.id});toast((barrier.kind==='wall'?'Wall':'Obstruction')+' saved. Camera coverage updated.');
  }
  function changeBarrier(id,partial){
    let next=barriers.map(b=>b.id===id?{...b,...partial}:b);
    try{next=normalizeBarriers(next)}catch(error){toast(error.message||'This outline is invalid.');updateFloor(floor.id,f=>({...f,barriers:[...(f.barriers||[])]}));return}
    // Normalize geometry immediately, while keeping spaces the user is still typing.
    if(Object.hasOwn(partial,'name'))next=next.map(b=>b.id===id?{...b,name:partial.name}:b);
    updateFloor(floor.id,f=>({...f,barriers:next}));setChanged(true);
  }
  function cancelBarrier(){setBarrierDraft(null);setBarrierError('');setTool('select');setSelected({kind:'plan'})}
  function pickBarrierPoint(point){setBarrierDraft(d=>d?{...d,points:[...d.points,point]}:d);setBarrierError('')}
  function changeCoverageOverlay(value){
    setActiveZoneId(null);
    setDori(value);
    setShowCoverage(true);
    setVisibleTypes(types => types.camera ? types : {...types,camera:true});
  }
  function openCombinedCoverage(){
    setActiveZoneId(null);
    choose({kind:'coverage'});setCoverageMode('combined');setShowCoverage(true);setVisibleTypes(v=>({...v,camera:true}));
  }
  function startCoverageArea(){
    openCombinedCoverage();setCoverageAreaDraft({points:[]});setTool('coverage-area');setMeasurement(null);setPlacementItem(null);
  }
  function normalizeCoverageArea(points){
    return normalizeProject({...project,floors:project.floors.map(f=>f.id===floor.id?{...f,coverageArea:{points}}:f)},{allowLocalAssets:true}).floors.find(f=>f.id===floor.id).coverageArea;
  }
  function saveCoverageArea(){
    if(!coverageAreaDraft)return;
    try{
      const area=normalizeCoverageArea(coverageAreaDraft.points);
      updateFloor(floor.id,f=>({...f,coverageArea:area}));setCoverageAreaDraft(null);setCoverageAreaError('');setTool('select');setSelected({kind:'coverage-area'});toast('Analysis area saved. Combined coverage updated.');
    }catch(error){setCoverageAreaError(error.message||'Check the analysis area outline.');}
  }
  function changeCoverageArea(points){
    try{const area=normalizeCoverageArea(points);updateFloor(floor.id,f=>({...f,coverageArea:area}));setCoverageAreaError('');}
    catch(error){setCoverageAreaError(error.message||'Check the analysis area outline.');updateFloor(floor.id,f=>({...f,coverageArea:f.coverageArea?{...f.coverageArea}:null}));}
  }
  function cancelCoverageArea(){setCoverageAreaDraft(null);setCoverageAreaError('');setTool('select');setSelected({kind:'coverage'});}
  function pickCoverageAreaPoint(point){
    if(coverageAreaDraft?.points.length>=100){setCoverageAreaError('Use up to 100 corners for the analysis area.');return;}
    setCoverageAreaDraft(d=>d?{points:[...d.points,point]}:d);setCoverageAreaError('');
  }
  function clearZoneDraft() {
    setZoneDraft(null);
    setZoneError('');
  }

  function startZone(existing = null) {
    if (!existing && zones.length >= MAX_FLOOR_ZONES) {
      toast('This floor has reached the security zone limit.');
      return;
    }
    choose({ kind: 'zone', id: existing?.id });
    setTool('zone');
    setPlacementItem(null);
    setMeasurement(null);
    setZoneDraft(existing ? { ...existing, points: [] } : {
      id: makeId('zone'), name: 'Zone ' + (zones.length + 1),
      type: 'other', targetLevel: null, targetPercent: 90, points: [],
    });
  }

  function pickZonePoint(point) {
    if (zoneDraft?.points.length >= 100) {
      setZoneError('Use up to 100 corners for this zone.');
      return;
    }
    setZoneDraft(draft => draft && { ...draft, points: [...draft.points, point] });
    setZoneError('');
  }

  function saveZone() {
    if (!zoneDraft) return;
    try {
      const zone = normalizeSecurityZone(zoneDraft);
      updateFloor(floor.id, currentFloor => {
        const currentZones = currentFloor.zones ?? [];
        const nextZones = currentZones.some(item => item.id === zone.id)
          ? currentZones.map(item => item.id === zone.id ? zone : item)
          : [...currentZones, zone];
        return { ...currentFloor, zones: nextZones };
      });
      choose({ kind: 'zone', id: zone.id });
      toast('Security zone saved.');
    } catch (error) {
      setZoneError(error.message);
    }
  }

  function changeZone(id, partial) {
    const zone = zones.find(item => item.id === id);
    if (!zone) return;
    try {
      const next = normalizeSecurityZone({ ...zone, ...partial });
      // Preserve the outline reference for metadata-only changes.
      if (!partial.points) next.points = zone.points;
      updateFloor(floor.id, currentFloor => ({
        ...currentFloor, zones: currentFloor.zones.map(item => item.id === id ? next : item),
      }));
      setZoneError('');
    } catch (error) {
      setZoneError(error.message);
      // Redraw the saved outline if an invalid vertex drag was rejected.
      updateFloor(floor.id, currentFloor => ({ ...currentFloor, zones: [...currentFloor.zones] }));
    }
  }

  function closeZoneReview() {
    setActiveZoneId(null);
    if (selected.kind === 'zone') choose({ kind: 'plan' });
  }

  function removeZone(zone) {
    updateFloor(floor.id, currentFloor => ({
      ...currentFloor, zones: currentFloor.zones.filter(item => item.id !== zone.id),
    }));
    closeZoneReview();
    toast('Security zone removed.');
  }

  function startSurveyPin() {
    if (surveyNotes.length >= SURVEY_LIMITS.notesPerFloor) {
      toast('This floor has reached the survey note limit.');
      return;
    }
    choose({ kind: 'plan' });
    setTool('survey');
    setCompactPanel(null);
    setMeasurement(null);
  }

  function createSurvey(anchor) {
    if (surveyNotes.length >= SURVEY_LIMITS.notesPerFloor) {
      toast('This floor has reached the survey note limit.');
      return;
    }
    const note = {
      id: makeId('survey'), anchor, title: '', notes: '', measurements: [], photos: [],
    };
    choose({ kind: 'survey', id: note.id });
    setNewSurvey(note);
  }

  function locateSurvey(note) {
    const position = surveyPosition(note, devices);
    if (position) mapApi.current?.goTo(position.lat, position.lng, Math.max(19, mapApi.current?.getView?.().zoom ?? 19));
  }

  function closeSurvey(note) {
    choose(note.anchor.kind === 'device' ? { kind: 'device', id: note.anchor.deviceId } : { kind: 'plan' });
  }

  function saveSurvey(draft) {
    const note = normalizeSurveyNote(draft, new Set(devices.map(device => device.id)));
    const existing = surveyNotes.some(saved => saved.id === note.id);
    if (!existing && surveyNotes.length >= SURVEY_LIMITS.notesPerFloor) throw new Error('This floor has reached the survey note limit.');
    const next = existing ? surveyNotes.map(saved => saved.id === note.id ? note : saved) : [...surveyNotes, note];
    const photoChars = project.floors.reduce((sum, item) =>
      sum + surveyPhotoSize(item.id === floor.id ? next : item.surveyNotes ?? []), 0);
    if (photoChars > SURVEY_LIMITS.totalPhotoChars) throw new Error(SURVEY_PHOTO_LIMIT_MESSAGE);
    updateFloor(floor.id, currentFloor => ({ ...currentFloor, surveyNotes: next }));
    choose({ kind: 'survey', id: note.id });
    toast('Survey note saved.');
  }

  function removeSurvey(note) {
    updateFloor(floor.id, currentFloor => ({
      ...currentFloor, surveyNotes: currentFloor.surveyNotes.filter(item => item.id !== note.id),
    }));
    closeSurvey(note);
    toast('Survey note removed.');
  }
  function locateDevice(floorId,id){
    if(floorId!==floor.id)selectFloor(floorId);
    const d=project.floors.find(f=>f.id===floorId)?.devices.find(d=>d.id===id);
    closeModal();choose({kind:'device',id});if(d?.type==='camera')setAnalysisCameraId(id);if(d)mapApi.current?.goTo(d.lat,d.lng,19);
  }
  useEffect(()=>{const escape=e=>{if(e.key==='Escape'){cancelImport();setNewSurvey(null);clearZoneDraft();setCoverageAreaDraft(null);setCoverageAreaError('');setTool('select');setSourceMenu(false);setModal(null);setAlignment(null);setAlignmentError('');setRouteDraft(null);setBarrierDraft(null);setBarrierError('')}};window.addEventListener('keydown',escape);return()=>{window.removeEventListener('keydown',escape);clearTimeout(toastTimer.current);importRequest.current.token+=1;importRequest.current.controller?.abort();importRequest.current.reader?.abort()}},[]);
  function setWidth(value){changePlan({width:value,height:plan.height*value/plan.width})}
  function nudge(east,north){changePlan({lat:plan.lat+north/111320,lng:plan.lng+east/(111320*Math.cos(plan.lat*Math.PI/180))})}
  function toggleLock(){changePlan({locked:!plan.locked});toast(plan.locked?'Alignment unlocked. Move the plan or adjust its corners.':'Alignment locked. Choose a device tool to place it on the map.')}
  async function importImage(file){
    if(alignment){toast('Finish or cancel alignment before importing a plan.');return;}
    if(!file)return;
    const token=cancelImport();
    if(fileInput.current)fileInput.current.value='';
    if(file.type==='application/pdf'||/\.pdf$/i.test(file.name)){if(file.size>50*1024*1024){toast('Choose a PDF smaller than 50 MB.');return;}setPdfFile(file);setPdfImportToken(token);setModal('pdf');return;}
    if(!/^image\/(png|jpeg|webp)$/.test(file.type)){toast('Choose a PDF, PNG, JPG, or WebP drawing.');return;}
    if(file.size>12*1024*1024){toast('Choose an image smaller than 12 MB.');return}
    setImportBusy(true);
    try {
      const url=await new Promise((resolve,reject)=>{const r=new FileReader();importRequest.current.reader=r;r.onload=()=>resolve(r.result);r.onerror=reject;r.onabort=()=>reject(new DOMException('Import canceled','AbortError'));r.readAsDataURL(file)});
      if(token!==importRequest.current.token)return;
      importRequest.current.reader=null;
      const dimensions=await new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve({width:im.naturalWidth,height:im.naturalHeight});im.onerror=reject;im.src=url});
      if(token!==importRequest.current.token)return;
      const center=mapApi.current?.getCenter()||plan;
      setAlignmentUndo(null);
      setPlan({...INITIAL_PLAN,url,filename:file.name,name:file.name.replace(/\.[^.]+$/,''),lat:center.lat,lng:center.lng,width:140,height:140*dimensions.height/dimensions.width,opacity:0.75,locked:false});
      choose({kind:'plan'});setChanged(true);setModal(null);toast('Plan imported. Align it with the map, then lock its position.');
    } catch {if(token===importRequest.current.token)toast('That image could not be opened. Try a PNG or JPG.')}
    finally {if(token===importRequest.current.token){importRequest.current.reader=null;setImportBusy(false)}}
  }
  function importPdfPage(image,token){
    if(token!==importRequest.current.token)return;
    const center=mapApi.current?.getCenter()||plan;
    const width=Math.min(140,2000*image.width/image.height),height=width*image.height/image.width;
    if(width<5||height<1){toast('This sheet is too narrow for a site plan. Crop it to the drawing area and try again.');return;}
    const label=image.pageLabel&&image.pageLabel!==String(image.pageNumber)?image.pageLabel:'Page '+image.pageNumber;
    const sourcePdf={filename:image.filename,pageNumber:image.pageNumber,pageCount:image.pageCount,pageLabel:image.pageLabel||String(image.pageNumber),widthPoints:image.widthPoints,heightPoints:image.heightPoints,rasterWidth:image.width,rasterHeight:image.height};
    cancelImport();
    setAlignmentUndo(null);
    setPlan({...INITIAL_PLAN,url:image.url,name:image.filename.replace(/\.pdf$/i,'')+' · '+label,filename:image.filename+' · Page '+image.pageNumber,lat:center.lat,lng:center.lng,width,height,opacity:0.65,visible:true,locked:false,sourcePdf});
    choose({kind:'plan'});setMapStyle('satellite');setChanged(true);setModal(null);setPdfFile(null);
    toast('PDF page '+image.pageNumber+' imported. Use two-point alignment to match it to the building.');
  }
  function cancelImport(){
    const request=importRequest.current;
    request.token+=1;
    request.controller?.abort();request.controller=null;
    request.reader?.abort();request.reader=null;
    setImportBusy(false);setPdfFile(null);setPdfImportToken(null);
    return request.token;
  }
  async function openSamplePdf(){
    if(importBusy)return;
    const token=cancelImport(),abort=new AbortController();
    importRequest.current.controller=abort;
    setImportBusy(true);
    try {
      const response=await fetch('/assets/demo-campus-plans.pdf',{signal:abort.signal});
      if(abort.signal.aborted||token!==importRequest.current.token)return;
      if(!response.ok)throw new Error();
      const blob=await response.blob();
      if(abort.signal.aborted||token!==importRequest.current.token)return;
      const file=new File([blob],'Demo campus plans.pdf',{type:'application/pdf'});
      setPdfFile(file);setPdfImportToken(token);setModal('pdf');
    } catch {
      if(!abort.signal.aborted&&token===importRequest.current.token)toast('The sample PDF could not be opened. Choose a PDF from your computer.');
    } finally {
      if(token===importRequest.current.token){importRequest.current.controller=null;setImportBusy(false);}
    }
  }
  function downloadFile(content,type,filename){
    const url=URL.createObjectURL(new Blob([content],{type}));
    const a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  async function exportProject(){
    const portable=await exportPortableProject({...project,revisions});
    const file=new Blob([JSON.stringify(portable,null,2)],{type:'application/json'});
    if(file.size>MAX_PROJECT_FILE_BYTES)throw new Error('This backup exceeds 100 MB. Remove unused revisions or reduce drawing and photo sizes, then export again.');
    downloadFile(file,'application/json',(project.name.toLowerCase().replace(/[^a-z0-9]+/g,'-')||'project')+'.physec.json');
    setChanged(false);toast('Project backup exported with saved revisions.');
  }
  function exportMaterials(){downloadFile(bomToCsv(buildBOM(project)),'text/csv;charset=utf-8','materials.csv');toast('Bill of materials exported as CSV.')}
  async function importProject(file){
    if(!file)return;
    const token=cancelImport();
    if(projectInput.current)projectInput.current.value='';
    setImportBusy(true);
    try{
      if(file.size>MAX_PROJECT_FILE_BYTES)throw new Error('Project files must be under 100 MB.');
      const contents=await file.text();
      if(token!==importRequest.current.token)return;
      const restored=normalizeProject(JSON.parse(contents));
      cancelImport();
      replaceProject(restored);resetEditing();setChanged(false);setModal(null);setActiveTab('Design');
      const f=restored.floors.find(f=>f.id===restored.activeFloorId)||restored.floors[0];mapApi.current?.goTo(f.plan.lat,f.plan.lng,19);
      toast('Project restored with '+restored.floors.length+' floors.');
    }catch(cause){if(token===importRequest.current.token)toast(cause.message||'This is not a supported PhySec project file.')}
    finally{if(token===importRequest.current.token)setImportBusy(false)}
  }
  function selectProvider(next){
    setSourceMenu(false);setMapError('');
    if(next==='osm'||next==='usgs'){setProvider('osm');setMapStyle(next==='usgs'?'satellite':'street');return;}
    if(googleKey){setProvider('google')}else setModal('google');
  }
  function locateProperty(place){mapApi.current?.goTo(place.lat,place.lng,19);setCompactPanel(routeDraft||barrierDraft||coverageAreaDraft||zoneDraft?'inspector':null);setTool(tool==='survey'?'survey':zoneDraft?'zone':coverageAreaDraft?'coverage-area':barrierDraft?barrierDraft.kind:routeDraft?'route':'select');}
  function bringPlanTo(place){
    if(plan.locked){toast('Unlock alignment before moving your plan.');return;}
    changePlan({lat:place.lat,lng:place.lng,visible:true,opacity:0.5});
    choose({kind:'plan'});
    toast('Plan moved here at 50% opacity. Rotate and resize it to match the building. Devices keep their coordinates.');
  }
  const basemapLabel=provider==='google'?'Google Maps':mapStyle==='satellite'?'USGS Imagery':'OpenStreetMap';
  const openNav=tab=>{setActiveTab(tab);if(tab!=='Design')setModal(tab.toLowerCase())};
  const closeModal=()=>{cancelImport();setModal(null);setActiveTab('Design')};
  const exportAction=()=>exportProject().catch(cause=>toast(cause.message || 'Export failed. Please try again.'));
  const openExport=()=>setModal('export');
  const historyLocked = Boolean(alignment || routeDraft || barrierDraft || zoneDraft || coverageAreaDraft || newSurvey || importBusy);

  function centerOnDesign(design) {
    const target = design.floors.find(item => item.id === design.activeFloorId);
    if (target) mapApi.current?.goTo(target.plan.lat, target.plan.lng, 19);
  }

  function travelHistory(direction) {
    const target = direction === 'undo' ? undoTarget : redoTarget;
    if (!target || historyLocked || modal) return;
    if (direction === 'undo') undo();
    else redo();
    setAlignmentUndo(null);
    const nextFloor = target.floors.find(item => item.id === floor.id);
    if (target.activeFloorId !== floor.id || !nextFloor) {
      resetEditing();
      setCompactPanel(null);
      centerOnDesign(target);
    } else {
      const collection = { device: nextFloor.devices, route: nextFloor.routes, barrier: nextFloor.barriers,
        zone: nextFloor.zones, survey: nextFloor.surveyNotes }[selected.kind];
      if (selected.id && !collection?.some(item => item.id === selected.id)) choose({ kind: 'plan' });
      if (activeZoneId && !nextFloor.zones?.some(zone => zone.id === activeZoneId)) setActiveZoneId(null);
    }
    setChanged(true);
    toast(direction === 'undo' ? 'Edit undone.' : 'Edit redone.');
  }

  useEffect(() => {
    function handleHistoryShortcut(event) {
      if (event.defaultPrevented || event.altKey || !(event.ctrlKey || event.metaKey) || event.repeat ||
        event.target?.closest?.('input, textarea, select, [contenteditable], [role="textbox"]') || historyLocked || modal) return;
      const key = event.key.toLowerCase();
      if (key !== 'z' && key !== 'y') return;
      event.preventDefault();
      travelHistory(key === 'y' || event.shiftKey ? 'redo' : 'undo');
    }
    window.addEventListener('keydown', handleHistoryShortcut);
    return () => window.removeEventListener('keydown', handleHistoryShortcut);
  });

  function restoreRevision(revision) {
    if (historyLocked) return;
    if (sameDesignValue(project, revision.design)) {
      toast('This revision matches the working draft.');
      return;
    }
    setProject(revision.design);
    resetEditing();
    setCompactPanel(null);
    centerOnDesign(revision.design);
    closeModal();
    setChanged(true);
    toast('Restored ' + revision.name + '. Undo returns to your previous draft.');
  }
  function downloadReport(blob,filename){downloadFile(blob,'application/pdf',filename);toast('Design report downloaded.');}
  function cancelAlignment(){setAlignment(null);setAlignmentError('');setTool('select');}
  function startAlignment(){
    if(!hasPlan){setModal('import');return;}
    clearZoneDraft();setCoverageAreaDraft(null);setCoverageAreaError('');setRouteDraft(null);setBarrierDraft(null);setBarrierError('');
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
  const toolText=tool==='survey'?'Pin a survey note · click the location on this floor':tool==='zone'?'Draw security zone · click each corner, then save':tool==='coverage-area'?'Draw analysis boundary · click each corner, then finish the area':tool==='wall'?'Draw wall · click each corner, then save':tool==='obstacle'?'Outline obstruction · click its corners, then save':tool==='route'?'Cable route · click the map to add path points':tool==='select'?(selected.kind==='plan'&&!plan.locked&&plan.visible?'Align plan · drag the center or resize with the corners':null):tool==='ruler'?'Measure · click two points on the map':('Place '+(TYPE_META[tool]?.singular||'device').toLowerCase()+' · click a location on the map');
  if(!ready)return <div className="project-loading"><BrandMark size={72}/><h1>Opening your workspace</h1><p>Restoring your local project…</p></div>;
  return <div className={'app'+(alignment?' alignment-active':'')}>
    <header className="app-header" inert={alignment?true:undefined}>
      <a href="#" className="brand" onClick={e=>{e.preventDefault();mapApi.current?.fitPlan();choose({kind:'plan'})}}><BrandMark size={32}/><span>Phy<b>Sec</b></span></a>
      <span className="studio-label">Site Survey Design</span>
      <div className="breadcrumb"><span>Projects</span><span className="slash">/</span><strong>{project.name}</strong><CaretDown size={13}/></div>
      <span className="stage-badge">Concept design</span>
      <span className={'draft-status '+(saveStatus==='error'?'save-error':'')} title={saveError||'Saved in this browser on this device'}><span className={'status-dot '+(saveStatus!=='saved'?'changed':'')}/>{saveStatus==='saved'?'Saved locally':saveStatus==='error'?'Save failed':'Saving…'}</span>
      <button className="button secondary export-button" onClick={openExport}><DownloadSimple size={18}/>Export</button>
      <button className="button primary" onClick={()=>{setModal('review');setActiveTab('Review')}}>Review design<ArrowSquareOut size={16}/></button>
      {account && <AccountMenu name={account.name} role={account.role} onSignedOut={onSignedOut}/>}
    </header>
    <nav inert={alignment?true:undefined} className="workflow-nav" aria-label="Project workflow">
      <div className="revision-edit-controls" role="group" aria-label="Edit history">
        <IconButton label="Undo" disabled={!undoTarget || historyLocked} aria-keyshortcuts="Control+Z Meta+Z" onClick={()=>travelHistory('undo')}><ArrowUUpLeft size={18}/></IconButton>
        <IconButton label="Redo" disabled={!redoTarget || historyLocked} aria-keyshortcuts="Control+Shift+Z Meta+Shift+Z Control+Y" onClick={()=>travelHistory('redo')}><ArrowUUpRight size={18}/></IconButton>
      </div>
      {['Overview','Design','Revisions','Equipment','Materials','Capacity','Review'].map(tab=><button key={tab} className={activeTab===tab?'active':''} onClick={()=>openNav(tab)}>{tab}</button>)}<div className="nav-caption"><span className="small-dot"/>Planning workspace</div>
    </nav>
    <div inert={alignment?true:undefined} className="compact-panels" aria-label="Workspace panels"><button aria-pressed={compactPanel==='project'} onClick={()=>setCompactPanel(p=>p==='project'?null:'project')}><Stack size={16}/>Project & layers</button><button aria-pressed={compactPanel==='inspector'} onClick={()=>setCompactPanel(p=>p==='inspector'?null:'inspector')}><GearSix size={16}/>Properties</button><button onClick={()=>setModal('import')}><UploadSimple size={16}/>Import plan</button></div>
    <main className={'workspace'+(alignment?' aligning':'')} data-panel={compactPanel||'map'}>
      <aside className="sidebar" inert={alignment?true:undefined}>
        <div className="sidebar-main">
          <FloorManager project={project} onSelectFloor={selectFloor} onAddBuilding={addBuilding} onRenameBuilding={(id,name)=>setProject(p=>({...p,buildings:p.buildings.map(b=>b.id===id?{...b,name}:b)}))} onAddFloor={addFloor} onRenameFloor={(id,name)=>updateFloor(id,f=>({...f,name}))} onRemoveFloor={removeFloor} onRenameProject={name=>setProject(p=>({...p,name}))} disabled={Boolean(alignment)}/>
          <div className="side-divider"/>
          <div className="section-heading"><h2>Floor drawing</h2><span className="count">{hasPlan?1:0}</span></div>
          <div className={'plan-row '+(selected.kind==='plan'?'selected':'')}>
            <button className="plan-select" onClick={()=>choose({kind:'plan'})}>{hasPlan?<img src={plan.url} alt={floor.name+" drawing thumbnail"}/>:<FileImage size={30}/>}<span><strong>{plan.filename||'Import a drawing'}</strong><small>{plan.sourcePdf?'PDF · Page '+plan.sourcePdf.pageNumber+' of '+plan.sourcePdf.pageCount:floor.name+' · Plan overlay'}</small></span></button>
            <div className="plan-meta" hidden={!hasPlan}><span className="plan-opacity">{Math.round(plan.opacity*100)}% opacity</span><IconButton label={plan.visible?'Hide site plan':'Show site plan'} aria-pressed={plan.visible} onClick={()=>changePlan({visible:!plan.visible})}>{plan.visible?<Eye size={18}/>:<EyeSlash size={18}/>}</IconButton><IconButton label={plan.locked?'Unlock plan':'Lock plan'} onClick={toggleLock}>{plan.locked?<LockKey size={17}/>:<LockKeyOpen size={17}/>}</IconButton></div>
          </div>
          <div className="side-divider"/>
          <div className="section-heading"><h2>Security layers</h2><span className="count">{devices.length}</span></div>
          {Object.entries(TYPE_META).filter(([type])=>counts[type]>0).map(([type,meta])=><div className="layer-row" key={type}><IconButton label={(visibleTypes[type]?'Hide ':'Show ')+meta.label.toLowerCase()} onClick={()=>setVisibleTypes(v=>({...v,[type]:!v[type]}))} aria-pressed={visibleTypes[type]}>{visibleTypes[type]?<Eye size={18}/>:<EyeSlash size={18}/>}</IconButton><meta.Icon size={19}/><span>{meta.label}</span><span className="layer-count">{counts[type]}</span></div>)}
          <button className="text-button all-devices" onClick={()=>setModal('equipment')}>Catalog & equipment<CaretRight size={14}/></button>
          <button className="combined-sidebar-button" aria-pressed={coverageMode==='combined'} onClick={openCombinedCoverage}><Stack size={18}/><span>Combined coverage<small>Overlap & blind spots</small></span><CaretRight size={14}/></button>
          <div className="side-divider"/>
          <div className="section-heading"><h2>Security zones</h2><span className="count">{zones.length}</span></div>
          <div className="barrier-sidebar-list zone-sidebar-list">
            {zones.map(zone => <button key={zone.id} className={activeZone?.id === zone.id ? 'selected' : ''} onClick={() => choose({kind:'zone', id:zone.id})}>
              <Polygon size={17}/><span>{zone.name}</span><small>{ZONE_TYPES[zone.type]}</small>
            </button>)}
          </div>
          <button className="text-button" onClick={() => startZone()}><Plus size={15}/>Draw zone</button>
          <div className="side-divider"/>
          <div className="section-heading"><h2>Site survey</h2><span className="count">{surveyNotes.length}</span></div>
          <SurveyNoteList notes={surveyNotes} selectedId={currentSurvey?.id} showAnchor onOpen={note => {
            choose({kind:'survey', id:note.id});
            locateSurvey(note);
          }}/>
          <button className="text-button" onClick={startSurveyPin}><MapPin size={15}/>Pin survey note</button>
          <div className="side-divider"/><div className="section-heading"><h2>Walls & obstructions</h2><span className="count">{barriers.length}</span></div>
          <div className="barrier-sidebar-list">{barriers.map(b=><button key={b.id} className={(selected.kind==='barrier'&&selected.id===b.id?'selected ':'')+(!b.enabled?'disabled-barrier':'')} onClick={()=>choose({kind:'barrier',id:b.id})}>{b.kind==='wall'?<Wall size={17}/>:<Polygon size={17}/>}<span>{b.name}</span><small>{b.height} m</small></button>)}</div>
          <div className="barrier-add-actions"><button className="text-button" onClick={()=>startBarrier('wall')}><Plus size={14}/>Wall</button><button className="text-button" onClick={()=>startBarrier('obstacle')}><Plus size={14}/>Obstruction</button></div>
          <div className="side-divider"/><div className="section-heading"><h2>Cable routes</h2><span className="count">{routes.length}</span></div>
          <div className="route-sidebar-list">{routes.map(r=><button key={r.id} className={selected.kind==='route'&&selected.id===r.id?'selected':''} onClick={()=>{setRouteDraft(null);choose({kind:'route',id:r.id})}}><Path size={17}/><span>{r.name}</span></button>)}</div>
          <button className="text-button" onClick={()=>startRoute()}><Plus size={15}/>Add cable route</button>
        </div>
        <div className="sidebar-bottom"><button className="button secondary import-button" onClick={()=>setModal('import')}><UploadSimple size={19}/>Import site plan</button><div className="workspace-label"><Buildings size={17}/><div>Local proof of concept<small>{project.floors.length} floors · {allDevices.length} devices</small></div><IconButton label="Open saved project" onClick={()=>projectInput.current?.click()}><UploadSimple size={16}/></IconButton></div></div>
      </aside>
      <section className="map-viewport" aria-label="Interactive site design map" onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();importImage(e.dataTransfer.files[0])}}>
        <MapCanvas plan={displayPlan} alignment={alignment} onAlignmentPick={pickAlignmentPoint} onAlignmentError={setAlignmentError} onAlignmentCancel={cancelAlignment} devices={devices} visibleTypes={visibleTypes} selected={selected} tool={tool} provider={provider} googleKey={googleKey} mapStyle={mapStyle} googleType={mapStyle==='satellite'?'satellite':'roadmap'} barriers={barriers} barrierDraft={barrierDraft} coverage={coverageData} showCoverage={showCoverage} surveyNotes={surveyNotes} surveyDraft={currentSurvey===newSurvey?newSurvey:null} surveyDeviceId={surveyDevice?.id} suspendCoverage={surveying} onSurveyPoint={point=>createSurvey({kind:'point',...point})} zones={zones} zoneDraft={zoneDraft} activeZoneId={activeZone?.id} zoneResult={zoneResult} onZonePoint={pickZonePoint} onZoneBoundaryChange={(id,points)=>changeZone(id,{points})} coverageArea={floor.coverageArea} coverageAreaDraft={coverageAreaDraft} onCoverageAreaPoint={pickCoverageAreaPoint} onCoverageAreaChange={changeCoverageArea} onBarrierPoint={pickBarrierPoint} onBarrierChange={changeBarrier} routes={routes} routeDraft={routeDraft} onRoutePoint={point=>setRouteDraft(d=>d?{...d,via:[...d.via,point]}:d)} onRouteChange={changeRoute} onSelect={selection=>{if(!routeDraft&&!barrierDraft&&!coverageAreaDraft&&!zoneDraft)choose(selection)}} onPlanChange={changePlan} onDeviceChange={changeDevice} onPlace={place} onMeasure={setMeasurement} onMapReady={api=>mapApi.current=api} onError={message=>setMapError(message)}/>
        {saveStatus==='error'&&<div className="autosave-warning" role="alert">Local save failed. Export your project to keep a copy. {saveError}</div>}<div className="map-topbar">
          <AddressSearch onLocation={locateProperty} onPlacePlan={bringPlanTo} onImportPlan={()=>setModal('import')} planLocked={plan.locked||Boolean(alignment)} disablePlanActions={Boolean(alignment)}/>
          <div className="source-wrap"><button className={'map-source '+(sourceMenu?'open':'')} onClick={()=>setSourceMenu(s=>!s)} aria-expanded={sourceMenu} aria-label="Choose map provider"><Stack size={19}/><span>{basemapLabel}</span><CaretDown size={14}/></button>{sourceMenu&&<div className="source-menu"><span className="eyebrow">BASEMAP</span><button onClick={()=>selectProvider('osm')}><MapTrifold size={21}/><span><strong>OpenStreetMap</strong><small>Street map · no key needed</small></span>{provider==='osm'&&mapStyle==='street'&&<Check size={18}/>}</button><button onClick={()=>selectProvider('usgs')}><Buildings size={21}/><span><strong>USGS Imagery</strong><small>Satellite / aerial · U.S. coverage</small></span>{provider==='osm'&&mapStyle==='satellite'&&<Check size={18}/>}</button><button onClick={()=>selectProvider('google')}><MapPin size={21}/><span><strong>Google Maps</strong><small>{googleKey?'Satellite & street':'Connect your Maps API key'}</small></span>{provider==='google'&&<Check size={18}/>}</button></div>}
            <div className="basemap-style" role="group" aria-label="Map view"><button aria-pressed={mapStyle==='street'} onClick={()=>{setMapStyle('street');setMapError('')}}>Street</button><button aria-pressed={mapStyle==='satellite'} onClick={()=>{setMapStyle('satellite');setMapError('')}}>Satellite</button></div>
          </div>
        </div>
        {!hasPlan&&devices.length===0&&tool==='select'&&!routeDraft&&!barrierDraft&&!activeZone&&!currentSurvey&&coverageMode!=='combined'&&<div className="blank-floor-card"><Stack size={26}/><strong>{building?.name} / {floor.name}</strong><p>Import a drawing for this floor, or place equipment directly on the map.</p><button className="button primary" onClick={()=>setModal('import')}><UploadSimple size={17}/>Import floor drawing</button></div>}
        <div className="north"><NavigationArrow size={22} weight="fill"/><span>N</span></div>
        {!alignment&&toolText&&<div className="map-hint"><Crosshair size={16}/><span>{toolText}</span></div>}
        {mapError&&<div className="map-error"><WarningCircle size={18}/><span>{mapError}</span>{(provider==='google'||mapStyle==='satellite')&&<button onClick={()=>selectProvider('osm')}>Use street map</button>}<IconButton label="Dismiss map message" onClick={()=>setMapError('')}><X size={16}/></IconButton></div>}
        {measurement!==null&&<div className="measurement"><Ruler size={18}/><strong>{measurement.toFixed(1)} m</strong><span>measured distance</span><IconButton label="Clear measurement" onClick={()=>{setMeasurement(null);setTool('select')}}><X size={15}/></IconButton></div>}
        {!alignment && !surveying && activeZone && !zoneDraft && <section className="coverage-map-card zone-map-card" aria-label="Security zone review">
          <div className="coverage-map-heading">
            <strong>{activeZone.name}</strong>
            <IconButton label="Close zone overlay" onClick={closeZoneReview}><X size={16}/></IconButton>
          </div>
          <ZoneResult zone={activeZone} result={zoneResult} compact/>
          <button className="text-button" onClick={() => choose({ kind: 'zone', id: activeZone.id })}>Zone settings<ArrowRight size={13}/></button>
        </section>}
        {!alignment&&!surveying&&!activeZone&&!zoneDraft&&(analysisCamera||coverageMode==='combined')&&<section className={'coverage-map-card '+(!showCoverage?'coverage-hidden':'')} aria-label="Camera coverage analysis">
          <div className="coverage-map-heading"><label htmlFor="coverage-camera">{coverageMode==='combined'?'Combined coverage':'Camera coverage'}</label><button className="icon-button" aria-label={showCoverage?'Hide camera coverage':'Show camera coverage'} onClick={()=>setShowCoverage(v=>!v)}>{showCoverage?<Eye size={17}/>:<EyeSlash size={17}/>}</button></div>
          <select id="coverage-camera" aria-label="Coverage view" disabled={Boolean(barrierDraft||routeDraft||coverageAreaDraft)} value={coverageMode==='combined'?'all':analysisCamera?.id||'all'} onChange={e=>{if(e.target.value==='all'){openCombinedCoverage();return;}setCoverageMode('single');setAnalysisCameraId(e.target.value);choose({kind:'device',id:e.target.value});}}><option value="all">All cameras · this floor ({floorCameras.length})</option>{floorCameras.map(d=><option key={d.id} value={d.id}>{d.id} · {d.name}</option>)}</select>
          <CoverageStyleControl dori={dori} onChange={changeCoverageOverlay}/>
          {showCoverage && <>
            {dori ? <DoriLegend combined={coverageMode==='combined'}/> : coverageMode==='combined' ?
              <div className="coverage-map-legend"><span><i className="coverage-visible-key"/>1 camera</span><span><i className="coverage-overlap-key"/>2+ cameras</span><span><i className="coverage-blocked-key"/>Blind spot</span></div> :
              <div className="coverage-map-legend"><span><i className="coverage-visible-key"/>Visible</span><span><i className="coverage-blocked-key"/>Blocked</span><span><i className="coverage-near-key"/>Near blind (approx.)</span></div>}
            {coverageMode==='combined' ? <>
              <p>{coverageAreaDraft ? 'Draw the analysis boundary on the map.' : <>
                {barrierDraft?'Preview · ':''}{areaSource} · target {combinedTargetHeight} m<br/>
                {dori && <>Best camera per point · IEC 2014<br/></>}
                {!combinedResult?.invalid && combinedResult?.stats?.area > 0 ? <>
                  {dori && combinedResult.dori
                    ? `${(100 * detectableArea(combinedResult.dori) / combinedResult.stats.area).toFixed(1)}% Detect or better`
                    : `${combinedResult.stats.coveredPercent.toFixed(0)}% covered · ${combinedResult.stats.uncoveredPercent.toFixed(0)}% unseen`}
                  {combinedResult.stats.sampledCells > 0 && <><br/>{combinedResult.stats.cellSize.toFixed(2)} m sampling</>}
                </> : 'Check analysis settings'}
              </>}</p>
              <button className="text-button" onClick={()=>{
                if(barrierDraft||routeDraft||coverageAreaDraft){toast('Save or cancel the current drawing before opening analysis settings.');return;}
                openCombinedCoverage();
              }}>Area & analysis settings<ArrowRight size={13}/></button>
            </> : <>
              <p>{barrierDraft?'Preview · ':''}{analysisCamera?.id} · target {analysisCamera?.targetHeight??0} m<br/>
                {dori && <>Pixel density estimate · IEC 2014<br/></>}
                {coverageResult?.stats?.nominalArea > 0.000001
                  ? <>{coverageResult.stats.blockedPercent.toFixed(0)}% of view blocked · {coverageResult.stats.cellSize.toFixed(2)} m sampling</>
                  : 'No target-plane coverage'}
              </p>
              <button className="text-button" onClick={()=>{
                if(barrierDraft||routeDraft){toast('Save or cancel the current drawing before editing camera settings.');return;}
                choose({kind:'device',id:analysisCamera.id});
              }}>Adjust camera<ArrowRight size={13}/></button>
            </>}
          </>}
        </section>}
        <div className="map-bottom"><div className="canvas-note"><span className="small-dot"/>Geometric coverage estimate{provider==='osm'&&mapStyle==='satellite'&&<span className="imagery-source-note">USGS aerial · U.S. coverage · dates & detail vary</span>}</div><div className="tool-dock" role="toolbar" aria-label="Map drawing tools">{[{type:'select',label:'Select',Icon:Cursor},{type:'camera',label:'Camera',Icon:VideoCamera},{type:'reader',label:'Reader',Icon:CreditCard},{type:'light',label:'Light',Icon:Lightbulb},{type:'wall',label:'Wall',Icon:Wall},{type:'obstacle',label:'Obstacle',Icon:Polygon},{type:'zone',label:'Zone',Icon:Polygon},{type:'survey',label:'Survey',Icon:NotePencil},{type:'coverage',label:'Coverage',Icon:Stack},{type:'catalog',label:'Catalog',Icon:Package},{type:'route',label:'Cable',Icon:Path},{type:'ruler',label:'Measure',Icon:Ruler}].map(({type,label,Icon})=><button key={type} aria-label={label+' tool'} className={tool===type?'active':''} onClick={()=>{if(type==='survey'){startSurveyPin();return;}if(type==='zone'){startZone();return;}if(type==='coverage'){openCombinedCoverage();return;}if(type==='wall'||type==='obstacle'){startBarrier(type);return}if(type==='catalog'){setModal('equipment');return}if(type==='route'){startRoute();return}clearZoneDraft();setCoverageAreaDraft(null);setCoverageAreaError('');setRouteDraft(null);setBarrierDraft(null);setBarrierError('');setPlacementItem(null);setTool(type);if(type==='ruler')setMeasurement(null)}} aria-pressed={tool===type}><Icon size={22} weight={tool===type?'fill':'regular'}/><span>{label}</span></button>)}</div><div className="map-controls"><IconButton label="Fit plan" onClick={()=>mapApi.current?.fitPlan()}><ArrowsOut size={19}/></IconButton><div className="zoom-group"><IconButton label="Zoom in" onClick={()=>mapApi.current?.zoomIn()}><Plus size={19}/></IconButton><IconButton label="Zoom out" onClick={()=>mapApi.current?.zoomOut()}><Minus size={19}/></IconButton></div></div></div>
      </section>
      <aside className={'inspector'+(alignment?' alignment-inspector':'')}>
        {alignment?<AlignmentGuide alignment={alignment} error={alignmentError} onBack={backAlignment} onNext={()=>{setAlignment(a=>({...a,phase:'target',targetPoints:[]}));setAlignmentError('')}} onRestart={restartAlignment} onCancel={cancelAlignment} onApply={applyAlignment} onOpacity={value=>setAlignment(a=>({...a,previewOpacity:value}))}/>:currentSurvey?<SurveyInspector
          key={floor.id + ':' + currentSurvey.id + (newSurvey ? ':new' : '')}
          note={currentSurvey} isNew={Boolean(newSurvey)} device={surveyDevice} floorName={floor.name}
          onSave={saveSurvey} onClose={() => closeSurvey(currentSurvey)}
          onLocate={() => locateSurvey(currentSurvey)} onRemove={() => removeSurvey(currentSurvey)}
        />:currentZone?<ZoneInspector
          key={currentZone.id + (zoneDraft ? '-draft' : '-saved')}
          zone={currentZone} drawing={Boolean(zoneDraft)} coverage={zoneAnalysis} result={zoneResult}
          targetHeight={combinedTargetHeight} error={zoneError}
          onChange={partial => zoneDraft ? setZoneDraft(draft => ({ ...draft, ...partial })) : changeZone(currentZone.id, partial)}
          onUndo={() => { setZoneDraft(draft => ({ ...draft, points: draft.points.slice(0,-1) })); setZoneError(''); }}
          onSave={saveZone} onCancel={() => choose(activeZone ? {kind:'zone', id:activeZone.id} : {kind:'plan'})}
          onFit={() => mapApi.current?.fitArea?.(currentZone.points)} onRedraw={() => startZone(currentZone)}
          onRemove={() => removeZone(currentZone)} onClose={closeZoneReview}
        />:(selected.kind==='coverage'||selected.kind==='coverage-area'||coverageAreaDraft)?<CombinedCoveragePanel result={combinedResult} dori={dori} onOverlayChange={changeCoverageOverlay} cameraCount={floorCameras.length} targetHeight={combinedTargetHeight} onTargetHeightChange={value=>updateFloor(floor.id,f=>({...f,coverageTargetHeight:value}))} areaSource={areaSource} hasCustomArea={Boolean(floor.coverageArea)} isDrawing={Boolean(coverageAreaDraft)} pointCount={coverageAreaDraft?.points.length||0} error={coverageAreaError} onFitArea={()=>mapApi.current?.fitArea?.(analysisArea.points)} onStartDrawing={startCoverageArea} onFinishDrawing={saveCoverageArea} onCancelDrawing={cancelCoverageArea} onUndoPoint={()=>{setCoverageAreaDraft(d=>({...d,points:d.points.slice(0,-1)}));setCoverageAreaError('');}} onEditArea={()=>{choose({kind:'coverage-area'});toast('Drag the numbered boundary corners to adjust the analysis area.');}} onResetArea={()=>{updateFloor(floor.id,f=>({...f,coverageArea:null}));choose({kind:'coverage'});}}/>:currentBarrier?<BarrierInspector barrier={currentBarrier} isDraft={Boolean(barrierDraft)} error={barrierError} onChange={partial=>barrierDraft?setBarrierDraft(b=>({...b,...partial})):changeBarrier(currentBarrier.id,partial)} onSave={saveBarrier} onCancel={cancelBarrier} onEditShape={()=>startBarrier(currentBarrier.kind,currentBarrier)} onRemove={()=>{updateFloor(floor.id,f=>({...f,barriers:f.barriers.filter(b=>b.id!==currentBarrier.id)}));cancelBarrier();toast('Barrier removed. Coverage updated.')}} onUndoPoint={()=>{setBarrierDraft(b=>({...b,points:b.points.slice(0,-1)}));setBarrierError('')}}/>:currentRoute?<RouteInspector route={currentRoute} devices={devices} isDraft={Boolean(routeDraft)} onChange={partial=>routeDraft?setRouteDraft(d=>({...d,...partial})):changeRoute(currentRoute.id,partial)} onSave={saveRoute} onCancel={cancelRoute} onEditPath={()=>startRoute(currentRoute)} onRemove={()=>{updateFloor(floor.id,f=>({...f,routes:f.routes.filter(r=>r.id!==currentRoute.id)}));cancelRoute();toast('Route removed.')}} onUndoPoint={()=>setRouteDraft(d=>({...d,via:d.via.slice(0,-1)}))}/>:currentDevice?<><div className="inspector-header"><span className="eyebrow">{TYPE_META[currentDevice.type].singular.toUpperCase()} PROPERTIES</span><div className="title-row"><h1>{currentDevice.id}</h1><span className="proposed-badge">{currentDevice.status==='existing'?'Existing':'Proposed'}</span></div><p>{currentDevice.name}</p></div><div className="inspector-body">
          <div className="device-heading" style={{color:TYPE_META[currentDevice.type].color}}>{React.createElement(TYPE_META[currentDevice.type].Icon,{size:36,weight:'duotone'})}<div><strong>{catalogItem(currentDevice.catalogId)?.name||TYPE_META[currentDevice.type].singular}</strong><small>{currentDevice.model||'Generic design object'}</small></div></div>
          <div className="survey-device-section">
            <SurveyNoteList notes={surveyNotes.filter(note => note.anchor.kind === 'device' && note.anchor.deviceId === currentDevice.id)}
              onOpen={note => choose({kind:'survey', id:note.id})}/>
            <button className="text-button" onClick={() => createSurvey({kind:'device', deviceId:currentDevice.id})}>
              <NotePencil size={16}/>Add device survey note
            </button>
          </div>
          {currentDevice.type==='camera'&&activeZone&&<ZoneCameraSummary zone={activeZone} result={zoneResult} onOpen={() => choose({kind:'zone', id:activeZone.id})}/>}
          {currentDevice.type==='camera'&&!activeZone&&coverageMode==='combined'&&<div className="combined-camera-note">Map: all cameras at {combinedTargetHeight} m target height.<button className="text-button" onClick={openCombinedCoverage}>View combined summary<ArrowRight size={13}/></button></div>}
          {currentDevice.type==='camera'&&<CameraControls key={'camera:' + currentDevice.id} camera={currentDevice} dori={dori} reviewingZone={Boolean(activeZone)} onOverlayChange={changeCoverageOverlay} analysis={analysisCamera?.id===currentDevice.id?coverageResult:null} onChange={partial=>changeDevice(currentDevice.id,partial,'bearing' in partial ? 'bearing' : null)}/>}
          <CapacityDeviceSettings key={'capacity:' + currentDevice.id} device={currentDevice} onChange={partial=>changeCapacityDevice(floor.id,currentDevice.id,partial)}/>
          <label className="text-field"><span>Device name</span><input value={currentDevice.name} onChange={e=>changeDevice(currentDevice.id,{name:e.target.value},'name')}/></label>
          <label className="text-field"><span>Model / specification</span><input value={currentDevice.model||''} onChange={e=>changeDevice(currentDevice.id,{model:e.target.value},'model')}/></label>
          <label className="text-field"><span>Installation status</span><select value={currentDevice.status||'proposed'} onChange={e=>changeDevice(currentDevice.id,{status:e.target.value})}><option value="proposed">Proposed · include in materials</option><option value="existing">Existing · retain on plan</option></select></label>
          <label className="text-field"><span>Mounting / installation</span><input value={currentDevice.mounting||''} placeholder="Wall, ceiling, pole…" onChange={e=>changeDevice(currentDevice.id,{mounting:e.target.value},'mounting')}/></label>
          <div className="side-divider"/><h3>Design intent</h3><label className="text-field"><span className="sr-only">Design intent</span><textarea rows="3" placeholder="What should this device protect?" value={currentDevice.requirement} onChange={e=>changeDevice(currentDevice.id,{requirement:e.target.value},'requirement')}/></label>
          <label className="text-field"><span>Installation notes</span><textarea rows="2" value={currentDevice.notes||''} onChange={e=>changeDevice(currentDevice.id,{notes:e.target.value},'notes')}/></label><div className="note amber"><WarningCircle size={19}/><span>Coverage models geometry and opaque barriers. Verify dimensions, lighting and image detail on site.</span></div>
          <button className="button danger" onClick={()=>removeDevice(currentDevice.id)}><Trash size={17}/>Remove device{routes.some(r=>r.fromDeviceId===currentDevice.id||r.toDeviceId===currentDevice.id)?' & connected routes':''}</button>
        </div></>:<><div className="inspector-header"><span className="eyebrow">PLAN OVERLAY</span><div className="title-row"><h1>{plan.name}</h1><IconButton label="Plan details" onClick={()=>setInspectorTab('Details')}><DotsThree size={21}/></IconButton></div><p>{plan.filename}</p><div className="segmented" role="tablist" aria-label="Plan inspector">{['Alignment','Details'].map(t=><button role="tab" aria-selected={inspectorTab===t} className={inspectorTab===t?'active':''} key={t} onClick={()=>setInspectorTab(t)}>{t}</button>)}</div></div>
          <div className="inspector-body">
            {!hasPlan?<div className="empty-floor-inspector"><FileImage size={38}/><h3>No drawing on this floor</h3><p>Import a PDF page or image, then align it to the property.</p><button className="button primary full-width" onClick={()=>setModal('import')}>Import drawing</button></div>:inspectorTab==='Alignment'?<>
              <button className="button secondary full-width two-point-trigger" disabled={plan.locked} onClick={startAlignment}><Crosshair size={18}/>Two-point alignment</button><p className="two-point-help">Match two plan corners to the building.</p>
              {alignmentUndo&&<button className="text-button undo-alignment" disabled={plan.locked} onClick={undoAlignment}>Undo last alignment</button>}
              <div className="slider-field"><label htmlFor="opacity">Opacity<strong>{Math.round(plan.opacity*100)}%</strong></label><input id="opacity" type="range" min="0" max="100" value={Math.round(plan.opacity*100)} onChange={e=>changePlan({opacity:Number(e.target.value)/100},'opacity')}/><div className="range-labels"><span>Map</span><span>Plan</span></div></div>
              <div className="alignment-quick-actions"><button onClick={()=>changePlan({opacity:0.5,visible:true})}>50% overlay</button><button onClick={()=>changePlan({visible:!plan.visible})}>{plan.visible?<EyeSlash size={14}/>:<Eye size={14}/>} {plan.visible?'Hide plan':'Show plan'}</button></div>
              <button className="button secondary full-width align-here" disabled={plan.locked} onClick={()=>{const center=mapApi.current?.getCenter();if(center)bringPlanTo(center)}}><Crosshair size={16}/>Bring plan to map center</button>
              <fieldset className="alignment-fields" disabled={plan.locked}><NumberField label="Rotation" value={plan.rotation} min={-180} max={180} unit="°" onChange={v=>changePlan({rotation:v})}/><NumberField label="Width" value={Number(plan.width.toFixed(1))} min={5} max={1000} step={1} unit="m" onChange={setWidth}/><p className="field-hint">Height scales proportionally.</p><div className="position-title">Position</div><div className="coordinate-fields"><NumberField label="Latitude" value={plan.lat} min={-85} max={85} step={0.00001} digits={5} onChange={v=>changePlan({lat:v})}/><NumberField label="Longitude" value={plan.lng} min={-180} max={180} step={0.00001} digits={5} onChange={v=>changePlan({lng:v})}/></div><div className="nudge-buttons"><IconButton label="Nudge plan north 1 metre" onClick={()=>nudge(0,1)}><ArrowUp size={18}/></IconButton><IconButton label="Nudge plan south 1 metre" onClick={()=>nudge(0,-1)}><ArrowDown size={18}/></IconButton><IconButton label="Nudge plan west 1 metre" onClick={()=>nudge(-1,0)}><ArrowLeft size={18}/></IconButton><IconButton label="Nudge plan east 1 metre" onClick={()=>nudge(1,0)}><ArrowRight size={18}/></IconButton></div></fieldset>
              <div className="side-divider"/><p className="alignment-help">{plan.locked?'Your plan position is locked. Devices can still be added and adjusted.':'Align a known wall or boundary with the map.'}</p><button className="button primary full-width" onClick={toggleLock}>{plan.locked?<LockKeyOpen size={18}/>:<LockKey size={18}/>} {plan.locked?'Unlock alignment':'Lock alignment'}</button><button className="text-button reset-link" disabled={plan.locked} onClick={()=>{changePlan({rotation:0,width:INITIAL_PLAN.width,height:INITIAL_PLAN.width*plan.height/plan.width});toast('Rotation and scale reset.')}}>Reset rotation & scale</button>
              <div className="note teal next-step"><VideoCamera size={22}/><div><strong>Next: place your devices</strong><p>Select a camera to analyze coverage. Draw walls and obstructions to test blind spots.</p></div></div>
            </>:<>
              <label className="text-field"><span>Plan name</span><input value={plan.name} onChange={e=>changePlan({name:e.target.value},'name')}/></label><div className="detail-list">{plan.sourcePdf&&<><div><span>Source PDF</span><strong>{plan.sourcePdf.filename}</strong></div><div><span>Selected page</span><strong>{plan.sourcePdf.pageNumber} of {plan.sourcePdf.pageCount}</strong></div></>}<div><span>Building</span><strong>{building?.name}</strong></div><div><span>Level</span><strong>{floor.name}</strong></div><div><span>Dimensions</span><strong>{plan.width.toFixed(1)} × {plan.height.toFixed(1)} m</strong></div><div><span>Alignment</span><strong>{plan.locked?'Locked':'Editable'}</strong></div><div><span>Map coordinates</span><strong>WGS 84</strong></div></div>
              <button className="button secondary full-width" disabled={plan.locked} onClick={()=>{const c=mapApi.current?.getCenter();if(c)bringPlanTo(c)}}><Crosshair size={18}/>Move plan to map center</button><button className="button secondary full-width" onClick={()=>fileInput.current?.click()}><UploadSimple size={18}/>Replace drawing</button><div className="note"><Info size={18}/><span>The sample plan is fictional and is not surveyed to this location. Align your own drawing before using measurements.</span></div>
            </>}
          </div></>}
        <div className="inspector-footer" hidden={Boolean(alignment)}><ShieldCheck size={15}/><span>Saved on this device · export a backup</span></div>
      </aside>
    </main>
    {notice&&<div className="toast" role="status"><CheckCircle size={19}/><span>{notice}</span><IconButton label="Dismiss notification" onClick={()=>setNotice('')}><X size={15}/></IconButton></div>}
    <input ref={fileInput} className="sr-only" type="file" accept="application/pdf,.pdf,image/png,image/jpeg,image/webp" onChange={e=>importImage(e.target.files[0])}/>
    <input ref={projectInput} className="sr-only" type="file" accept=".json" onChange={e=>importProject(e.target.files[0])}/>
    {modal==='import'&&<Modal title="Bring your site into focus" description="Import a drawing for the active floor, then align it to the site." onClose={closeModal}><button className="upload-zone" onClick={()=>fileInput.current?.click()} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();importImage(e.dataTransfer.files[0])}}><UploadSimple size={34}/><strong>{importBusy?'Opening your plan…':'Choose a site plan'}</strong><span>or drag a drawing here</span><small>PDF up to 50 MB · PNG, JPG or WebP up to 12 MB</small></button><div className="import-steps"><span><b>1</b> Choose drawing</span><span><b>2</b> Align to map</span><span><b>3</b> Place devices</span></div><p className="modal-note">PDFs open in a page picker. The selected page replaces only this floor’s drawing; its device coordinates are retained. Add another floor to keep more pages. CAD drawings can be exported as PDF first.</p><button className="text-button sample-pdf-button" disabled={importBusy} onClick={openSamplePdf}><FileImage size={17}/>Try a sample PDF drawing set</button><br/><button className="text-button" onClick={()=>projectInput.current?.click()}>Open an exported PhySec project instead<ArrowRight size={15}/></button></Modal>}
    {modal==='pdf'&&pdfFile&&<Modal wide className="pdf-modal" title="Choose a PDF page" description={pdfFile.name} onClose={closeModal}><Suspense fallback={<div className="pdf-opening" role="status">Opening PDF importer…</div>}><PdfPagePicker key={pdfImportToken} file={pdfFile} onImport={image=>importPdfPage(image,pdfImportToken)} onChooseAnother={()=>{cancelImport();setModal('import')}} onCancel={closeModal}/></Suspense></Modal>}
    {modal==='google'&&<Modal title="Connect Google Maps" description="Use Google's street and satellite imagery beneath your site plan." onClose={closeModal}><div className="note teal"><MapTrifold size={22}/><span>OpenStreetMap works right now without a key. Your plan and device positions are shared across map sources.</span></div><form onSubmit={e=>{e.preventDefault();if(keyDraft.trim().length<10){toast('Enter a valid Maps JavaScript API key.');return}setGoogleKey(keyDraft.trim());setProvider('google');setMapStyle('satellite');setMapError('');closeModal();toast('Connecting to Google Maps…')}}><label className="text-field"><span>Maps JavaScript API key</span><input autoComplete="off" type="password" placeholder="Paste your browser-restricted key" value={keyDraft} onChange={e=>setKeyDraft(e.target.value)} required/></label><p className="modal-note">The key is used only in this browser session and is excluded from project exports. Enable the Maps JavaScript API and allow this localhost address in its website restrictions.</p><a className="external-link" href="https://developers.google.com/maps/documentation/javascript/get-api-key" target="_blank" rel="noreferrer">Google Maps setup guide<ArrowSquareOut size={15}/></a><div className="modal-actions"><button type="button" className="button secondary" onClick={closeModal}>Keep current map</button><button className="button primary" type="submit">Connect Google Maps</button></div></form></Modal>}
    {modal==='overview'&&<Modal title={project.name} description="A property-wide physical security concept." onClose={closeModal}><div className="project-overview"><Buildings size={40} weight="duotone"/><div><strong>{project.buildings.length} buildings · {project.floors.length} floors</strong><p>{allDevices.length} devices · {allRoutes.length} cable routes</p></div></div><div className="detail-list"><div><span>Active floor</span><strong>{building?.name} / {floor.name}</strong></div><div><span>Local save</span><strong>{saveStatus==='saved'?'Saved on this device':saveStatus}</strong></div><div><span>Basemap</span><strong>{basemapLabel}</strong></div></div><div className="note"><Info size={20}/><span>Each floor keeps its own drawing, alignment, equipment and routes. Export a project file to transfer or back up your work.</span></div><div className="modal-actions"><button className="button secondary" onClick={()=>projectInput.current?.click()}><UploadSimple size={18}/>Open project</button><button className="button primary" onClick={closeModal}>Continue designing</button></div></Modal>}
    {modal==='equipment'&&<Modal wide className="workflow-modal" title="Equipment" description="Choose a generic device or review equipment across the property." onClose={closeModal}><EquipmentPanel project={project} onPlace={chooseCatalog} onLocate={locateDevice} onClose={closeModal}/></Modal>}
    {modal==='revisions'&&<Modal wide className="workflow-modal" title="Design revisions" description="Save named versions, compare layouts, or return to a previous design." onClose={closeModal}>
      <RevisionPanel project={project} revisions={revisions} locked={historyLocked}
        onSave={name=>addRevision(createProjectRevision(project,name))} onRestore={restoreRevision} onDelete={removeRevision}
        onReview={revision => { setReviewRevision(revision); setModal('revision-review'); }}/>
    </Modal>}
    {modal==='revision-review'&&reviewRevision&&<Modal wide className="workflow-modal" title="Share and review" onClose={closeModal}>
      <RevisionReviewOwner key={reviewRevision.id} revision={reviewRevision} onBack={() => setModal('revisions')}/>
    </Modal>}
    {modal==='materials'&&<Modal wide className="workflow-modal" title="Bill of materials" description="Review equipment, routed cable, accessories, and optional installation labor." onClose={closeModal}><MaterialsPanel project={project} onCostsChange={costs=>setProject(p=>({...p,costs}))} onEstimateChange={estimate=>setProject(p=>({...p,estimate}))} onExportCsv={exportMaterials} onClose={closeModal}/></Modal>}
    {modal==='capacity'&&<Modal wide className="workflow-modal" title="Capacity planning" description="Estimate recording storage, camera bandwidth, switch ports and PoE across the property." onClose={closeModal}>
      <CapacityPanel project={project}
        onRetentionChange={retentionDays=>setProject(current=>({...current,capacity:{retentionDays}}))}
        onChangeDevice={changeCapacityDevice} onLocate={locateDevice}/>
    </Modal>}
    {modal==='export'&&<Modal title="Export design" onClose={closeModal} wide className="report-export-modal">
      <ReportExportPanel project={project} floor={floor} dori={dori} onDownload={downloadReport} onBackup={exportAction}/>
    </Modal>}
    {modal==='review'&&<Modal title="Review the design" description="A clear checkpoint before taking the concept into the field." onClose={closeModal}><div className="review-summary"><div><strong>{project.floors.length}</strong><span>Floors</span></div><div><strong>{allDevices.length}</strong><span>Devices</span></div><div><strong>{allRoutes.length}</strong><span>Cable routes</span></div></div><div className="review-check"><span className={plan.locked?'check-good':'check-warn'}>{plan.locked?<CheckCircle size={24}/>:<WarningCircle size={24}/>}</span><div><strong>{plan.locked?'Plan alignment is locked':'Plan alignment is still editable'}</strong><p>{plan.locked?'Confirm the scale against a known site dimension.':'Align and lock the plan before finalizing device locations.'}</p></div></div><div className="review-check"><WarningCircle className="check-warn" size={24}/><div><strong>Field verification required</strong><p>Confirm coverage, obstructions, lighting, mounting positions and access requirements on site.</p></div></div><div className="review-check"><FileImage size={24}/><div><strong>Save a portable design file</strong><p>Export includes floors, drawings, equipment, routes, survey notes, photos and estimates. No API key is included.</p></div></div><div className="modal-actions"><button className="button secondary" onClick={closeModal}>Back to design</button><button className="button primary" onClick={openExport}><DownloadSimple size={18}/>Export design</button></div></Modal>}
  </div>
}
