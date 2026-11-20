import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, CheckCircle, ClockCounterClockwise, Copy, LinkSimple, MapPin, UsersThree } from '@phosphor-icons/react';
import { BrandMark } from './BrandMark.jsx';
import RevisionLayout from './RevisionLayout.jsx';
import { comparisonFrame } from './revisionComparison.js';
import { COMMENT_MAX_LENGTH, DECISION_LABELS, prepareReviewRevision, REVIEWER_LIMIT } from './reviewModel.js';
import { getOrCreateReviewOwner, loadReviewOwner, makeReviewLink, randomReviewHex, reviewRequest, useReviewSession } from './reviewClient.js';
import './review.css';

const dateTime = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });
const clamp = value => Math.max(0, Math.min(1, value));

function DecisionBadge({ status }) {
  return <span className={`shared-review-decision ${status ?? 'pending'}`}>{DECISION_LABELS[status] ?? 'Awaiting decision'}</span>;
}

function PlanComments({ room, onComment, busy }) {
  const { design } = room.revision;
  const [floorId, setFloorId] = useState(design.activeFloorId);
  const [placing, setPlacing] = useState(false);
  const [pin, setPin] = useState(null);
  const [selected, setSelected] = useState(null);
  const [text, setText] = useState('');
  const board = useRef(null);
  const commentInput = useRef(null);
  const submission = useRef(null);

  const floor = design.floors.find(item => item.id === floorId) ?? design.floors[0];
  const frame = useMemo(() => comparisonFrame(floor), [floor]);
  const { x, y, width, height } = frame.bounds;
  const buildings = useMemo(() => new Map(design.buildings.map(building => [building.id, building.name])), [design]);
  const comments = room.comments.filter(comment => comment.floorId === floor.id);

  useEffect(() => {
    if (placing) board.current?.focus();
    else if (pin) commentInput.current?.focus();
  }, [placing, Boolean(pin)]);

  function startPin() {
    setSelected(null);
    setPin({ u: 0.5, v: 0.5 });
    setPlacing(true);
  }

  function choosePoint(event) {
    if (!placing) return;
    const svg = event.currentTarget;
    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    const matrix = svg.getScreenCTM();
    if (!matrix) return;
    const local = point.matrixTransform(matrix.inverse());
    setPin({ u: clamp((local.x - x) / width), v: clamp((local.y - y) / height) });
    setPlacing(false);
  }

  function movePin(event) {
    const movement = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[event.key];
    if (movement) {
      event.preventDefault();
      const step = event.shiftKey ? 0.0025 : 0.02;
      setPin(current => ({ u: clamp(current.u + movement[0] * step), v: clamp(current.v + movement[1] * step) }));
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setPlacing(false);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      setPin(null);
      setPlacing(false);
    }
  }

  async function post(event) {
    event.preventDefault();
    if (!pin || placing || !text.trim() || busy) return;
    submission.current ??= randomReviewHex(16);
    if (await onComment({ id: submission.current, floorId: floor.id, ...pin, text })) {
      setText('');
      setPin(null);
      submission.current = null;
    }
  }

  function showPin(comment) {
    setSelected(comment.id);
    setPin(null);
    setPlacing(false);
  }

  const pinRadius = frame.marker * 1.65;
  const overlay = <>
    {comments.map(comment => <g key={comment.id} className={`shared-review-pin ${selected === comment.id ? 'selected' : ''}`}
      transform={`translate(${x + comment.u * width} ${y + comment.v * height})`}
      onClick={placing ? undefined : event => { event.stopPropagation(); showPin(comment); }}>
      <title>Comment {comment.number} by {comment.name}</title>
      <circle r={pinRadius} vectorEffect="non-scaling-stroke"/>
      <text dy="0.34em" textAnchor="middle" fontSize={pinRadius}>{comment.number}</text>
    </g>)}
    {pin && <g className="shared-review-pin draft" transform={`translate(${x + pin.u * width} ${y + pin.v * height})`}>
      <circle r={pinRadius} vectorEffect="non-scaling-stroke"/>
      <text dy="0.34em" textAnchor="middle" fontSize={pinRadius}>+</text>
    </g>}
  </>;

  return <section className="shared-review-plan" aria-label="Floor plan and comments">
    <div className="shared-review-plan-drawing">
      <div className="shared-review-plan-tools">
        <label><span>Floor</span><select value={floor.id} onChange={event => {
          setFloorId(event.target.value); setPin(null); setPlacing(false); setSelected(null);
        }}>
          {design.floors.map(item => <option key={item.id} value={item.id}>{buildings.get(item.buildingId)} / {item.name}</option>)}
        </select></label>
        {onComment && <button type="button" className="poc-secondary" disabled={busy || placing} onClick={startPin}><MapPin size={17}/>Pin comment</button>}
      </div>
      {placing && <p className="shared-review-placement" role="status">Click the plan, or use the arrow keys and press Enter to place the pin.</p>}
      <RevisionLayout entry={{ name: floor.name }} floor={floor} frame={frame} overlay={overlay}
        svgProps={placing ? { ref: board, tabIndex: 0, role: 'button', 'aria-label': 'Choose a comment location on the floor plan',
          className: 'shared-review-placement-target', onClick: choosePoint, onKeyDown: movePin } : {}}/>
    </div>
    <div className="shared-review-comments">
      <h3>Floor comments <span>{comments.length}</span></h3>
      {onComment && pin && !placing && <form className="shared-review-comment-form" onSubmit={post}>
        <label><span>Comment</span><textarea ref={commentInput} rows={3} maxLength={COMMENT_MAX_LENGTH} required value={text}
          onChange={event => setText(event.target.value)} placeholder="What should change at this location?"/></label>
        <div className="shared-review-actions">
          <button type="button" className="poc-secondary" disabled={busy} onClick={() => { setPin(null); setText(''); submission.current = null; }}>Cancel</button>
          <button type="submit" className="poc-primary" disabled={busy || !text.trim()}>Post comment</button>
        </div>
      </form>}
      {comments.length > 0 ? <ol className="shared-review-comment-list">{comments.map(comment => <li key={comment.id} className={selected === comment.id ? 'selected' : ''}>
        <button type="button" className="shared-review-comment-pick" aria-label={`Show comment ${comment.number} by ${comment.name}`}
          aria-pressed={selected === comment.id} onClick={() => showPin(comment)}>
          <span className="shared-review-comment-number">{comment.number}</span><strong>{comment.name}</strong>
          <time dateTime={new Date(comment.createdAt).toISOString()}>{dateTime.format(comment.createdAt)}</time>
        </button>
        <p>{comment.text}</p>
      </li>)}</ol> : <p className="shared-review-muted">Comments pinned to this floor will appear here.</p>}
    </div>
  </section>;
}

function ReviewerRoster({ room, run, busy }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [invitation, setInvitation] = useState(null);
  const [copyStatus, setCopyStatus] = useState('');
  const [replace, setReplace] = useState(null);
  const linkInput = useRef(null);

  function showInvitation(next) {
    if (!next) return;
    setInvitation(next);
    setCopyStatus('');
    setReplace(null);
  }

  async function invite(event) {
    event.preventDefault();
    const next = await run('invite', { name, email });
    if (next) {
      showInvitation(next);
      setName('');
      setEmail('');
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(linkInput.current.value);
      setCopyStatus('Invitation link copied.');
    } catch {
      linkInput.current.focus();
      linkInput.current.select();
      setCopyStatus('Press Ctrl+C or Cmd+C to copy the selected link.');
    }
  }

  async function changeAccess(action, reviewerId) {
    const result = await run(action, { reviewerId });
    if (!result) return;
    if (action === 'refresh-link') showInvitation(result);
    else {
      if (invitation?.reviewerId === reviewerId) setInvitation(null);
      setReplace(null);
    }
  }

  const full = room.reviewers.length >= REVIEWER_LIMIT;
  return <section className="shared-review-roster" aria-label="Reviewers and approvals">
    <form className="shared-review-invite" onSubmit={invite}>
      <label><span>Reviewer name</span><input value={name} maxLength={80} required disabled={full} onChange={event => setName(event.target.value)} placeholder="Full name"/></label>
      <label><span>Reviewer email</span><input type="email" value={email} maxLength={254} required disabled={full} onChange={event => setEmail(event.target.value)} placeholder="reviewer@example.com"/></label>
      <button className="poc-primary" type="submit" disabled={busy || full}><LinkSimple size={17}/>Create invitation</button>
    </form>
    {full && <p className="shared-review-muted">This review supports {REVIEWER_LIMIT} reviewer records.</p>}
    {invitation && <div className="shared-review-invitation">
      <label><span>Invitation link for {invitation.name}</span><input ref={linkInput} value={makeReviewLink(room.id, invitation.token)} readOnly onFocus={event => event.target.select()}/></label>
      <button className="poc-secondary" type="button" onClick={copyLink}><Copy size={16}/>Copy link</button>
      <p>Send this link to {invitation.name}. Anyone who has the link can respond as this reviewer. For another device, use a server address the reviewer can reach.</p>
      {copyStatus && <p role="status">{copyStatus}</p>}
    </div>}
    {room.reviewers.length ? <ul className="shared-review-reviewers">{room.reviewers.map(reviewer => {
      const decision = room.decisions.findLast(item => item.reviewerId === reviewer.id);
      return <li key={reviewer.id}>
        <div className="shared-review-person"><strong>{reviewer.name}</strong><small>{reviewer.email}</small></div>
        <div className="shared-review-person"><DecisionBadge status={decision?.status}/>{decision && <small>{dateTime.format(decision.createdAt)}</small>}{reviewer.revokedAt && <small>Access revoked</small>}</div>
        <div className="shared-review-actions">
          {replace?.id === reviewer.id ? <>
            <span>{replace.action === 'revoke' ? 'Revoke this link?' : 'Replace the previous link?'}</span>
            <button className="poc-secondary" type="button" disabled={busy} onClick={() => setReplace(null)}>Cancel</button>
            <button className="poc-primary" type="button" disabled={busy} onClick={() => changeAccess(replace.action, reviewer.id)}>Confirm</button>
          </> : <>
            <button className="poc-secondary" type="button" disabled={busy} aria-label={`New link for ${reviewer.name}`}
              onClick={() => reviewer.revokedAt ? changeAccess('refresh-link', reviewer.id) : setReplace({ id: reviewer.id, action: 'refresh-link' })}>New link</button>
            {!reviewer.revokedAt && <button className="poc-secondary" type="button" disabled={busy} aria-label={`Revoke access for ${reviewer.name}`}
              onClick={() => setReplace({ id: reviewer.id, action: 'revoke' })}>Revoke access</button>}
          </>}
        </div>
      </li>;
    })}</ul> : <p className="shared-review-muted">Create an invitation for each person reviewing this revision.</p>}
    {room.decisions.length > 0 && <section className="shared-review-history" aria-label="Decision history">
      <h3><ClockCounterClockwise size={17}/>Decision history</h3>
      <ol>{room.decisions.slice().reverse().map(decision => <li key={decision.id}>
        <strong>{decision.name}</strong><DecisionBadge status={decision.status}/><time dateTime={new Date(decision.createdAt).toISOString()}>{dateTime.format(decision.createdAt)}</time>
      </li>)}</ol>
    </section>}
  </section>;
}

function useReviewActions(act) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function run(action, data) {
    if (busy) return false;
    setBusy(true);
    setError('');
    try { return (await act(action, data)) ?? true; }
    catch (cause) { setError(cause.message || 'The review action failed. Try again.'); return false; }
    finally { setBusy(false); }
  }
  return { busy, error, run, actState: { setBusy, setError } };
}

export function RevisionReviewOwner({ revision, onBack }) {
  const [access, setAccess] = useState(() => loadReviewOwner(revision.design.id, revision.id));
  const { room, loadError, accept, act } = useReviewSession(access);
  const { busy, error, run, actState: { setBusy, setError } } = useReviewActions(act);
  const [tab, setTab] = useState('reviewers');
  const statuses = room?.reviewers.map(reviewer => room.decisions.findLast(decision => decision.reviewerId === reviewer.id)?.status) ?? [];

  async function start() {
    if (busy) return;
    setBusy(true); setError('');
    try {
      const snapshot = await prepareReviewRevision(revision);
      const owner = getOrCreateReviewOwner(revision.design.id, revision.id);
      const result = await reviewRequest(owner, null, { revision: snapshot });
      accept(result.room, true);
      setAccess(owner);
    } catch (cause) { setError(cause.message || 'Could not start the revision review.'); }
    finally { setBusy(false); }
  }

  return <div className="shared-review-owner">
    <button type="button" className="text-button shared-review-back" onClick={onBack}><ArrowLeft size={16}/>Back to revisions</button>
    <div className="shared-review-title">
      <div><h3>{revision.name}</h3><p>{revision.design.name} · Saved {dateTime.format(revision.savedAt)}</p></div>
      {room && <div className="shared-review-metrics">
        <span><strong>{room.reviewers.length}</strong> invited</span>
        <span><strong>{statuses.filter(status => status === 'approved').length}</strong> approved</span>
        <span><strong>{statuses.filter(status => status === 'changes-requested').length}</strong> changes requested</span>
      </div>}
    </div>
    {error && <p className="shared-review-error" role="alert">{error}</p>}
    {loadError && (room || !error) && <p className="shared-review-error" role="alert">{loadError}</p>}
    {room ? <>
      <div className="revision-tabs" role="group" aria-label="Review section">
        <button type="button" aria-pressed={tab === 'reviewers'} onClick={() => setTab('reviewers')}><UsersThree size={18}/>Reviewers &amp; approvals</button>
        <button type="button" aria-pressed={tab === 'comments'} onClick={() => setTab('comments')}><MapPin size={17}/>Plan &amp; comments ({room.comments.length})</button>
      </div>
      <div hidden={tab !== 'reviewers'}><ReviewerRoster room={room} run={run} busy={busy}/></div>
      <div hidden={tab !== 'comments'}><PlanComments room={room}/></div>
    </> : <div className="shared-review-start">
      <UsersThree size={31}/><div><strong>Share a fixed copy of this revision</strong>
        <p>Invite reviewers to view the floor drawings and layout, pin comments, and record a decision.</p></div>
      <button className="poc-primary" type="button" disabled={busy || Boolean(access && !loadError)} onClick={start}>
        {busy ? 'Preparing review…' : access && !loadError ? 'Opening review…' : 'Start review'}
      </button>
    </div>}
  </div>;
}

export function RevisionReviewPage({ access }) {
  const { room, loadError, act } = useReviewSession(access);
  const { busy, error, run } = useReviewActions(act);
  const decision = room?.decisions.at(-1);
  const invalid = !access.id;

  return <main className="shared-review-page">
    <header className="shared-review-page-header"><BrandMark size={30}/><strong>PhySec</strong><span>Revision review</span></header>
    <div className="shared-review-page-content">
      {!room ? <div className="shared-review-start" role={loadError || invalid ? 'alert' : 'status'}>
        <div><h1>{invalid ? 'Invalid review link' : loadError ? 'Review unavailable' : 'Opening revision review'}</h1>
          <p>{invalid ? 'Ask the designer for your invitation link.' : loadError || 'Loading the shared floor plans…'}</p></div>
      </div> : <>
        <div className="shared-review-title">
          <div><h1>{room.revision.name}</h1><p>{room.revision.design.name} · Saved {dateTime.format(room.revision.savedAt)}</p></div>
          <span className="shared-review-assigned">Reviewing as <strong>{room.reviewer?.name}</strong></span>
        </div>
        <div className="shared-review-decision-bar">
          <div><strong>Your decision</strong><DecisionBadge status={decision?.status}/></div>
          <div className="shared-review-actions">
            <button className="poc-secondary" type="button" disabled={busy || decision?.status === 'changes-requested'}
              onClick={() => run('decision', { status: 'changes-requested' })}>Request changes</button>
            <button className="poc-primary" type="button" disabled={busy || decision?.status === 'approved'}
              onClick={() => run('decision', { status: 'approved' })}><CheckCircle size={18}/>Approve revision</button>
          </div>
        </div>
        {error && <p className="shared-review-error" role="alert">{error}</p>}
        {loadError && <p className="shared-review-error" role="alert">{loadError}</p>}
        <PlanComments room={room} busy={busy} onComment={data => run('comments', data)}/>
      </>}
    </div>
  </main>;
}
