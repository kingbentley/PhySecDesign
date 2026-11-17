import { useEffect, useRef, useState } from 'react';
import { MagnifyingGlass, ArrowRight, X, MapPin, Crosshair, UploadSimple, SpinnerGap } from '@phosphor-icons/react';
import { searchAddresses, parseCoordinates } from './geocoding.js';

export default function AddressSearch({onLocation, onPlacePlan, onImportPlan, planLocked, disablePlanActions=false}) {
  const [query,setQuery]=useState('');
  const [results,setResults]=useState(null);
  const [error,setError]=useState('');
  const [busy,setBusy]=useState(false);
  const [picked,setPicked]=useState(null);
  const controller=useRef(null);
  const requestId=useRef(0);
  const input=useRef(null);
  useEffect(()=>()=>{requestId.current+=1;controller.current?.abort()},[]);
  function cancel(){controller.current?.abort();requestId.current+=1;setBusy(false);}
  function choose(place){cancel();setResults(null);setError('');setPicked(place);setQuery(place.label);onLocation(place);}
  async function submit(event){
    event.preventDefault();
    cancel();setError('');setResults(null);setPicked(null);
    const text=query.trim();
    if(!text){setError('Enter an address, place name, or latitude, longitude.');return;}
    try {
      const coordinates=parseCoordinates(text);
      if(coordinates){choose({...coordinates,label:text,detail:'Coordinates',id:'coordinates'});return;}
    } catch(cause){setError(cause.message);return;}
    const id=++requestId.current;
    const abort=new AbortController();controller.current=abort;setBusy(true);
    try {
      const places=await searchAddresses(text,{signal:abort.signal});
      if(id!==requestId.current)return;
      setResults(places);
    } catch(cause) {
      if(id===requestId.current&&cause.name!=='AbortError')setError(cause.message||'Address search is unavailable. Try again or enter coordinates.');
    } finally {if(id===requestId.current)setBusy(false);}
  }
  function edit(value){cancel();setQuery(value);setResults(null);setPicked(null);setError('');}
  return <div className="search-wrap address-search">
    <form className="coordinate-search" onSubmit={submit} role="search" aria-label="Property search">
      <MagnifyingGlass size={18}/>
      <input ref={input} aria-label="Search address or coordinates" placeholder="Search address or coordinates" value={query} onChange={e=>edit(e.target.value)} onKeyDown={e=>{if(e.key==='Escape'){cancel();setResults(null);setPicked(null);setError('')}}} autoComplete="off" maxLength={240}/>
      {query&&<button type="button" aria-label="Clear address search" onClick={()=>{edit('');input.current?.focus()}}><X size={15}/></button>}
      <button type="submit" aria-label="Search property" disabled={busy}>{busy?<SpinnerGap className="search-spinner" size={18}/>:<ArrowRight size={18}/>}</button>
    </form>
    {busy&&<div className="search-status" role="status">Searching addresses…</div>}
    {error&&<div className="search-error" role="alert">{error}</div>}
    {results!==null&&<div className="address-results">
      <div className="results-heading"><span>{results.length?'Choose a property':'No matching address found'}</span><button aria-label="Dismiss search results" onClick={()=>setResults(null)}><X size={15}/></button></div>
      {results.length?<ul aria-label="Address search results">{results.map(place=><li key={place.id}><button onClick={()=>choose(place)}><MapPin size={18}/><span><strong>{place.label}</strong><small>{place.detail}</small></span><ArrowRight size={15}/></button></li>)}</ul>:<p className="search-empty">Try a street number, city and postcode, or enter coordinates.</p>}
      <div className="search-credit">Search: <a href="https://photon.komoot.io" target="_blank" rel="noreferrer">Photon</a> · <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap contributors</a></div>
    </div>}
    {picked&&<div className="property-found">
      <div className="results-heading"><span><MapPin size={14}/>Property located</span><button aria-label="Dismiss located property" onClick={()=>setPicked(null)}><X size={15}/></button></div>
      <strong>{picked.label}</strong><p>{picked.detail}</p>
      <div className="property-actions" hidden={disablePlanActions}><button disabled={planLocked} title={planLocked?'Unlock plan alignment first':'Move the current plan to this property'} onClick={()=>{onPlacePlan(picked);setPicked(null)}}><Crosshair size={15}/>Bring plan here</button><button onClick={()=>{onImportPlan();setPicked(null)}}><UploadSimple size={15}/>Import plan</button></div>
      <small>{disablePlanActions?'Map moved. Continue selecting your alignment points.':planLocked?'Unlock alignment to move the current plan.':'Search moves the map. Your design stays in place until you move it.'}</small>
    </div>}
  </div>
}
