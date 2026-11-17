import test from 'node:test';
import assert from 'node:assert/strict';
import { createBlankPlan, createDemoProject, exportPortableProject, normalizeProject, normalizeSurveyNote } from '../src/projectModel.js';
import { prepareSurveyPhoto, preserveDeviceSurveys, surveyPosition, SURVEY_LIMITS } from '../src/survey.js';

const photo = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGNgAAIAAAUAAen63NgAAAAASUVORK5CYII=';
const pin = { kind: 'point', lat: 41.89, lng: -87.63 };
const deviceNote = {
  id: 'survey-1', title: 'Mounting check', anchor: { kind: 'device', deviceId: 'C-01' },
  notes: 'Verify ceiling access.\nBring a ladder.',
  measurements: [{ label: 'Mounting height', value: 11.5, unit: 'ft' }],
  photos: [{ name: 'mounting.png', dataUrl: photo }],
};

test('survey photos, measurements, multiline notes and both anchors travel with the floor in a portable project', async () => {
  const project = createDemoProject();
  const floor = project.floors[0];
  floor.plan.url = photo;
  delete floor.surveyNotes;
  assert.deepEqual(normalizeProject(project).floors[0].surveyNotes, []);
  const pinNote = { ...deviceNote, id: 'survey-2', anchor: pin, title: 'Conduit path' };
  floor.surveyNotes = [deviceNote, pinNote];
  project.floors.push({ id: 'floor-other', buildingId: floor.buildingId, name: 'Second floor', plan: createBlankPlan() });
  const restored = normalizeProject(JSON.parse(JSON.stringify(await exportPortableProject(project))));
  assert.deepEqual(restored.floors[0].surveyNotes, [deviceNote, pinNote]);
  assert.deepEqual(restored.floors[1].surveyNotes, []);
  project.floors[1].surveyNotes = [deviceNote];
  assert.throws(() => normalizeProject(project), /device on the same floor/);
});

test('device notes follow the device and retain their contents as a pin after removal', () => {
  const device = { id: 'C-01', lat: 40, lng: -80 };
  assert.equal(surveyPosition(deviceNote, [device]), device);
  const [retained] = preserveDeviceSurveys([deviceNote], device);
  assert.deepEqual(retained, { ...deviceNote, anchor: { kind: 'point', lat: 40, lng: -80 } });
  assert.deepEqual(normalizeSurveyNote(retained, new Set()), retained);
});

test('photo imports reject external, unsupported and oversized data and raw files are checked before decoding', async () => {
  const devices = new Set(['C-01']);
  for (const dataUrl of ['https://example.invalid/image.png', 'data:image/svg+xml;base64,PHN2Zz4=']) {
    assert.throws(() => normalizeSurveyNote({ ...deviceNote, photos: [{ name: 'file', dataUrl }] }, devices), /embedded/);
  }
  const dataUrl = 'data:image/jpeg;base64,' + 'A'.repeat(SURVEY_LIMITS.encodedPhotoChars);
  assert.throws(() => normalizeSurveyNote({ ...deviceNote, photos: [{ name: 'large.jpg', dataUrl }] }, devices), /too large/);
  await assert.rejects(prepareSurveyPhoto(new Blob(['This is not a photo.'], { type: 'image/jpeg' })), /JPG, PNG, or WebP/);
});
