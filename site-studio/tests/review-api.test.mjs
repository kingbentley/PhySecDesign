import test from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { mkdtemp, readdir, readFile, rmdir, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createReviewApi } from '../server/reviewApi.mjs';
import { createBlankPlan, createDemoProject, createProjectRevision } from '../src/projectModel.js';
import { normalizeReviewRevision } from '../src/reviewModel.js';

const ownerToken = '1'.repeat(64);
const otherToken = '0'.repeat(64);
const roomId = 'a'.repeat(32);
const nextRoomId = 'b'.repeat(32);

function sampleRevision() {
  const project = createDemoProject();
  project.floors[0].plan = { ...createBlankPlan(), url: 'data:image/png;base64,AAAA', visible: true };
  project.floors[0].devices[0].notes = 'internal equipment note';
  project.costs = { equipment: { 'camera-dome-4mp': 540 } };
  return createProjectRevision(project, 'Entrance review');
}

test('review snapshot keeps floor layout and omits internal project records', () => {
  const snapshot = normalizeReviewRevision(sampleRevision());
  assert.equal(snapshot.design.floors[0].devices.length, 11);
  assert.equal(snapshot.design.floors[0].plan.url, 'data:image/png;base64,AAAA');
  assert.equal('estimate' in snapshot.design, false);
  assert.equal('costs' in snapshot.design, false);
  assert.equal('surveyNotes' in snapshot.design.floors[0], false);
  assert.equal('notes' in snapshot.design.floors[0].devices[0], false);
  assert.throws(() => normalizeReviewRevision({ ...snapshot, design: { ...snapshot.design, activeFloorId: 'missing' } }), /active floor/);
});

test('specific invitation holders can pin comments and approve only their immutable revision', async t => {
  const directory = await mkdtemp(join(tmpdir(), 'physec-review-test-'));
  let middleware = createReviewApi({ directory });
  t.after(async () => {
    for (const file of await readdir(directory)) await unlink(join(directory, file));
    await rmdir(directory);
  });
  function request(token, action, body, id = roomId) {
    const json = body ? Buffer.from(JSON.stringify(body)) : null;
    const req = Object.assign(Readable.from(json ? [json] : []), {
      url: `/api/reviews/${id}${action}`, method: body ? 'POST' : 'GET',
      headers: { authorization: token ? 'Bearer ' + token : undefined, 'content-type': 'application/json' },
    });
    return new Promise((resolve, reject) => {
      let status;
      middleware(req, {
        writeHead(code) { status = code; },
        end(payload) { resolve({ status, value: JSON.parse(payload) }); },
      }, () => reject(new Error('The review handler skipped the request.')));
    });
  }
  const revision = sampleRevision();
  assert.equal((await request(ownerToken, '', { revision })).status, 200);
  assert.equal((await request(null, '')).status, 404);
  assert.equal((await request(otherToken, '')).status, 404);
  assert.equal((await request(ownerToken, '', { revision: { ...revision, name: 'Attempted overwrite' } })).value.room.revision.name, 'Entrance review');

  const first = await request(ownerToken, '/invite', { name: 'Avery', email: 'avery@example.test' });
  const second = await request(ownerToken, '/invite', { name: 'Jordan', email: 'jordan@example.test' });
  const a = first.value.invitation.token;
  const b = second.value.invitation.token;
  const floorId = revision.design.activeFloorId;
  assert.notEqual(a, b);
  assert.equal((await request(a, '')).value.room.reviewer.name, 'Avery');
  assert.equal((await request(a, '')).value.room.reviewers, undefined);
  assert.equal((await request(a, '/invite', { name: 'Other', email: 'other@example.test' })).status, 403);
  assert.equal((await request(ownerToken, '/decision', { status: 'approved' })).status, 403);

  const comment = { id: 'c'.repeat(32), floorId, u: 0.7, v: 0.3, text: 'Check the entrance angle.' };
  assert.equal((await request(a, '/comments', { ...comment, floorId: 'outside' })).status, 400);
  assert.equal((await request(a, '/comments', { ...comment, u: 1.01 })).status, 400);
  const comments = await Promise.all([request(a, '/comments', comment), request(a, '/comments', comment), request(b, '/comments', { ...comment, text: 'Confirm reader height.' })]);
  assert.ok(comments.every(result => result.status === 200));
  assert.equal((await request(a, '/decision', { status: ['approved'] })).status, 400);
  await request(a, '/decision', { status: 'changes-requested' });
  await request(a, '/decision', { status: 'approved' });
  await request(a, '/decision', { status: 'approved' });
  assert.equal((await request(b, '')).value.room.decisions.length, 0);

  const owner = (await request(ownerToken, '')).value.room;
  assert.equal(owner.comments.length, 2);
  assert.deepEqual(owner.comments.map(item => item.number), [1, 2]);
  assert.deepEqual(owner.decisions.map(item => [item.name, item.status]), [['Avery', 'changes-requested'], ['Avery', 'approved']]);
  assert.equal((await request(ownerToken, '?version=' + owner.version)).value.unchanged, true);
  assert.equal((await request(ownerToken, '?version=0')).value.room.revision.design, undefined);
  await request(ownerToken, '', { revision: { ...revision, id: 'revision-2', name: 'Second version' } }, nextRoomId);
  assert.equal((await request(a, '', undefined, nextRoomId)).status, 404);
  assert.deepEqual((await request(ownerToken, '', undefined, nextRoomId)).value.room.decisions, []);

  await request(ownerToken, '/revoke', { reviewerId: first.value.invitation.reviewerId });
  assert.equal((await request(a, '')).status, 404);
  assert.equal((await request(a, '/decision', { status: 'approved' })).status, 404);
  const renewed = await request(ownerToken, '/refresh-link', { reviewerId: first.value.invitation.reviewerId });
  assert.equal((await request(a, '')).status, 404);
  assert.equal((await request(renewed.value.invitation.token, '')).value.room.decisions.at(-1).status, 'approved');

  middleware = createReviewApi({ directory });
  const restored = (await request(ownerToken, '')).value.room;
  assert.equal(restored.revision.name, revision.name);
  assert.equal(restored.revision.design.floors[0].plan.url, 'data:image/png;base64,AAAA');
  assert.equal(restored.comments.length, 2);
  assert.equal(restored.decisions.length, 2);
  const disk = await readFile(join(directory, roomId + '.json'), 'utf8');
  assert.equal(disk.includes(a) || disk.includes(b) || disk.includes(ownerToken), false);
});
