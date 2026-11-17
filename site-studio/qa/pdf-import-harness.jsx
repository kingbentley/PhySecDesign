import React, { StrictMode, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { X } from '@phosphor-icons/react';
import PdfPagePicker from '../src/PdfPagePicker.jsx';
import '../src/styles.css';

function PickerDialog({file,onImport,onCancel}) {
  const dialog=useRef(null);
  useEffect(()=>{
    const element=dialog.current;
    element.showModal();
    return()=>element.close();
  },[]);
  return <dialog
    ref={dialog}
    className="modal wide pdf-modal"
    aria-label="PDF import QA picker"
    onCancel={event=>{event.preventDefault();onCancel();}}
    onClick={event=>{if(event.target===event.currentTarget)onCancel();}}
  >
    <div className="modal-heading">
      <div><h2>Choose a PDF page</h2><p>{file.name}</p></div>
      <button className="icon-button" aria-label="Close PDF picker" onClick={onCancel}><X size={20}/></button>
    </div>
    <PdfPagePicker file={file} onImport={onImport} onChooseAnother={onCancel} onCancel={onCancel}/>
  </dialog>;
}

function Harness() {
  const [file,setFile]=useState(null);
  const [busy,setBusy]=useState(false);
  const [status,setStatus]=useState('Choose a QA fixture.');
  const [result,setResult]=useState(null);

  async function openFixture(url,name) {
    setBusy(true);setStatus('Loading fixture…');setResult(null);
    try {
      const response=await fetch(url);
      if(!response.ok)throw new Error('Fixture request failed ('+response.status+').');
      const bytes=await response.arrayBuffer();
      setFile(new File([bytes],name,{type:'application/pdf'}));
      setStatus('Fixture opened.');
    } catch(error) {setStatus(error.message);}
    finally {setBusy(false);}
  }
  function openInvalid() {
    setResult(null);
    setFile(new File([new Blob(['This is deliberately not a valid PDF document.'],{type:'application/pdf'})],'invalid-drawing.pdf',{type:'application/pdf'}));
    setStatus('Invalid PDF fixture opened.');
  }
  function cancel() {setFile(null);setStatus('Picker closed.');}
  function imported(image) {
    setResult({
      filename:image.filename,
      page:image.pageNumber,
      label:image.pageLabel??image.label??null,
      width:image.width,
      height:image.height,
      widthPoints:image.widthPoints,
      heightPoints:image.heightPoints,
      pageCount:image.pageCount,
    });
    setFile(null);
    setStatus('Selected page imported successfully.');
  }
  return <main className="qa-pdf-harness">
    <span className="eyebrow">INTERNAL QA</span>
    <h1>PDF import test harness</h1>
    <p>This page runs the production PDF page picker with local test fixtures. Imported results show metadata only.</p>
    <div className="qa-fixture-buttons">
      <button className="button primary" disabled={busy} onClick={()=>openFixture('/qa/pdf-fixture/demo-campus-9-pages.pdf','demo-campus-9-pages.pdf')}>Open 9-page packet</button>
      <button className="button secondary" disabled={busy} onClick={()=>openFixture('/qa/pdf-fixture/demo-campus-protected.pdf','demo-campus-protected.pdf')}>Open protected PDF</button>
      <button className="button secondary" disabled={busy} onClick={openInvalid}>Open invalid PDF</button>
      <button className="button secondary" disabled={busy} onClick={()=>openFixture('/assets/demo-campus-plans.pdf','demo-campus-plans.pdf')}>Open 3-page sample</button>
    </div>
    <p className="qa-fixture-note">Protected fixture password: <code>site-studio-test</code>. The protected copy uses AES-256 encryption.</p>
    <div className="qa-status" role="status">{status}</div>
    {result&&<section className="qa-import-result" aria-label="Imported page metadata"><h2>Imported page metadata</h2><pre>{JSON.stringify(result,null,2)}</pre></section>}
    {file&&<PickerDialog file={file} onImport={imported} onCancel={cancel}/>}
  </main>;
}
createRoot(document.getElementById('qa-root')).render(<StrictMode><Harness/></StrictMode>);
