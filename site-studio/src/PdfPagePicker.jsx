import { useEffect, useRef, useState } from 'react';
import { FilePdf, ArrowLeft, ArrowRight, Check, SpinnerGap, LockKey, WarningCircle, MapTrifold } from '@phosphor-icons/react';
const PAGE_BATCH=6;
function pageTitle(number,label){return label&&label!==String(number)?'Page '+number+' · '+label:'Page '+number}

export default function PdfPagePicker({file,onImport,onChooseAnother,onCancel}) {
  const [session,setSession]=useState(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const [selected,setSelected]=useState(1);
  const [pageDraft,setPageDraft]=useState('1');
  const [batch,setBatch]=useState(0);
  const [thumbs,setThumbs]=useState({});
  const [preview,setPreview]=useState(null);
  const [previewError,setPreviewError]=useState('');
  const [previewBusy,setPreviewBusy]=useState(false);
  const [importing,setImporting]=useState(false);
  const [importError,setImportError]=useState('');
  const [passwordPrompt,setPasswordPrompt]=useState(null);
  const [password,setPassword]=useState('');
  const passwordReply=useRef(null);
  const lifetime=useRef(null);
  const docRef=useRef(null);
  useEffect(()=>{
    const abort=new AbortController();lifetime.current=abort;setSession(null);setLoading(true);setError('');setSelected(1);setPageDraft('1');setBatch(0);setThumbs({});setPreview(null);
    let opened=null;
    async function open(){
      try {
        const {openPdf}=await import('./pdfImport.js');
        if(abort.signal.aborted)return;
        opened=await openPdf(file,{signal:abort.signal,onPassword:({incorrect})=>new Promise(resolve=>{passwordReply.current=resolve;setPassword('');setPasswordPrompt({incorrect})})});
        if(abort.signal.aborted){await opened.destroy();return;}
        docRef.current=opened;setSession(opened);setLoading(false);
      } catch(cause){if(!abort.signal.aborted){setError(cause.message||'This PDF could not be opened.');setLoading(false)}}
    }
    open();
    return()=>{abort.abort();passwordReply.current?.(null);passwordReply.current=null;docRef.current=null;opened?.destroy().catch(()=>{})};
  },[file]);
  useEffect(()=>{
    if(!session)return;
    const abort=new AbortController();
    setThumbs({});
    async function renderBatch(){
      const first=batch*PAGE_BATCH+1,last=Math.min(first+PAGE_BATCH-1,session.pageCount);
      for(let page=first;page<=last;page++){
        if(abort.signal.aborted)return;
        try {const image=await session.renderPage(page,{maxDimension:240,signal:abort.signal});if(!abort.signal.aborted)setThumbs(current=>({...current,[page]:image}));}
        catch(cause){if(!abort.signal.aborted)setThumbs(current=>({...current,[page]:{error:true}}));}
      }
    }
    renderBatch();return()=>abort.abort();
  },[session,batch]);
  useEffect(()=>{
    if(!session)return;
    const abort=new AbortController();setPreview(null);setPreviewError('');setPreviewBusy(true);setImportError('');
    session.renderPage(selected,{maxDimension:1400,signal:abort.signal}).then(image=>{if(!abort.signal.aborted)setPreview(image)}).catch(cause=>{if(!abort.signal.aborted)setPreviewError(cause.message||'This page could not be rendered.')}).finally(()=>{if(!abort.signal.aborted)setPreviewBusy(false)});
    return()=>abort.abort();
  },[session,selected]);
  function choose(page){if(importing)return;setSelected(page);setPageDraft(String(page));setBatch(Math.floor((page-1)/PAGE_BATCH));}
  function jump(){const page=Number(pageDraft);if(Number.isInteger(page)&&page>=1&&page<=session.pageCount)choose(page);else setPageDraft(String(selected));}
  async function importSelected(){
    if(!session||!preview||importing)return;
    setImporting(true);setImportError('');
    try {
      let image=await session.renderPage(selected,{maxDimension:3200,signal:lifetime.current.signal});
      if(image.url.length>16*1024*1024)image=await session.renderPage(selected,{maxDimension:2400,signal:lifetime.current.signal});
      if(image.url.length>16*1024*1024)throw new Error('This page is too complex to import at this size. Export a smaller image of the sheet and try again.');
      if(lifetime.current.signal.aborted)return;
      onImport({...image,filename:file.name,pageCount:session.pageCount});
    } catch(cause){if(!lifetime.current.signal.aborted)setImportError(cause.message||'The selected page could not be imported.');}
    finally{if(!lifetime.current.signal.aborted)setImporting(false);}
  }
  if(passwordPrompt)return <div className="pdf-password"><LockKey size={38}/><h3>This PDF is password protected</h3><p>{passwordPrompt.incorrect?'That password did not unlock the PDF. Try again.':'Enter its password to preview the pages on this device.'}</p><form onSubmit={event=>{event.preventDefault();const reply=passwordReply.current;passwordReply.current=null;setPasswordPrompt(null);reply?.(password)}}><label><span>PDF password</span><input aria-label="PDF password" type="password" value={password} onChange={event=>setPassword(event.target.value)} autoComplete="off" required autoFocus/></label><button className="button primary" type="submit">Unlock PDF</button></form><button className="text-button" onClick={onCancel}>Cancel</button></div>;
  if(error)return <div className="pdf-open-error" role="alert"><WarningCircle size={38}/><h3>Unable to open this PDF</h3><p>{error}</p><button className="button secondary" onClick={onChooseAnother}>Choose another file</button></div>;
  if(loading)return <div className="pdf-opening" role="status"><SpinnerGap className="search-spinner" size={30}/><strong>Opening your drawing set…</strong><span>Preparing pages on this device.</span></div>;
  const first=batch*PAGE_BATCH+1,last=Math.min(first+PAGE_BATCH-1,session.pageCount);
  const label=session.pageLabels?.[selected-1];
  return <div className="pdf-picker">
    <div className="pdf-picker-grid">
      <aside className="pdf-pages">
        <div className="pdf-pages-heading"><span>DRAWING SET</span><strong>{session.pageCount} {session.pageCount===1?'page':'pages'}</strong></div>
        <div className="pdf-thumbnail-list" role="group" aria-label="PDF pages">{Array.from({length:last-first+1},(_,index)=>first+index).map(number=><button key={number} type="button" className={'pdf-thumbnail '+(selected===number?'selected':'')} onClick={()=>choose(number)} disabled={importing} aria-pressed={selected===number} aria-label={'Select '+pageTitle(number,session.pageLabels?.[number-1]).toLowerCase()}><div className="pdf-thumb-image">{thumbs[number]?.url?<img src={thumbs[number].url} alt=""/>:thumbs[number]?.error?<FilePdf size={25}/>:<SpinnerGap className="search-spinner" size={20}/>}</div><span>{pageTitle(number,session.pageLabels?.[number-1])}</span>{selected===number&&<Check className="pdf-selected-check" size={15}/>}</button>)}</div>
        {session.pageCount>PAGE_BATCH&&<div className="pdf-batch-nav"><button aria-label="Previous page thumbnails" disabled={batch===0||importing} onClick={()=>setBatch(value=>value-1)}><ArrowLeft size={15}/></button><span>{first}–{last} of {session.pageCount}</span><button aria-label="Next page thumbnails" disabled={last>=session.pageCount||importing} onClick={()=>setBatch(value=>value+1)}><ArrowRight size={15}/></button></div>}
      </aside>
      <section className="pdf-page-preview" aria-label="Selected PDF page preview">
        <div className="pdf-preview-toolbar"><strong>{pageTitle(selected,label)}</strong><div><button aria-label="Previous PDF page" disabled={selected===1||importing} onClick={()=>choose(selected-1)}><ArrowLeft size={16}/></button><label><span className="sr-only">PDF page number</span><input type="number" aria-label="PDF page number" value={pageDraft} min="1" max={session.pageCount} disabled={importing} onChange={event=>setPageDraft(event.target.value)} onBlur={jump} onKeyDown={event=>{if(event.key==='Enter'){jump();event.currentTarget.blur()}}}/></label><span>/ {session.pageCount}</span><button aria-label="Next PDF page" disabled={selected===session.pageCount||importing} onClick={()=>choose(selected+1)}><ArrowRight size={16}/></button></div></div>
        <div className="pdf-preview-sheet" aria-busy={previewBusy}>{previewBusy?<div className="pdf-preview-loading" role="status"><SpinnerGap className="search-spinner" size={26}/><span>Rendering page {selected}…</span></div>:previewError?<div className="pdf-preview-loading" role="alert"><WarningCircle size={28}/><span>{previewError}</span></div>:preview?<img src={preview.url} alt={'Preview of PDF page '+selected} />:null}</div>
        <div className="pdf-preview-caption"><span>{preview?Math.round(preview.widthPoints/72*10)/10+' × '+Math.round(preview.heightPoints/72*10)/10+' in sheet':''}</span><span>Rendered locally · one page per plan</span></div>
      </section>
    </div>
    {importError&&<div className="pdf-import-error" role="alert">{importError}</div>}
    <div className="pdf-picker-footer"><div><strong>Place this page over your map</strong><p>The selected sheet replaces the current plan. Use two-point alignment to match the building.</p></div><button className="button secondary" disabled={importing} onClick={onCancel}>Cancel</button><button className="button primary" disabled={!preview||previewBusy||Boolean(previewError)||importing} onClick={importSelected}>{importing?<SpinnerGap className="search-spinner" size={18}/>:<MapTrifold size={18}/>} {importing?'Preparing page…':'Use page '+selected}</button></div>
  </div>;
}
