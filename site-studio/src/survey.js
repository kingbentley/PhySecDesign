export const SURVEY_LIMITS = {
  notesPerFloor: 100, measurementsPerNote: 12, photosPerNote: 6,
  photoFileBytes: 20 * 1024 * 1024,
  encodedPhotoChars: 700_000,
  totalPhotoChars: 24 * 1024 * 1024,
};

export const MEASUREMENT_UNITS = ['m', 'cm', 'mm', 'ft', 'in'];
export const SURVEY_PHOTO_LIMIT_MESSAGE = 'This project has reached the 24 MB survey photo limit. Remove photos before adding more.';

export function surveyPhotoSize(notes) {
  return notes.reduce((size, note) => size + note.photos.reduce((sum, photo) => sum + photo.dataUrl.length, 0), 0);
}

export function surveyPosition(note, devices) {
  if (note.anchor.kind === 'point') return note.anchor;
  return devices.find(device => device.id === note.anchor.deviceId);
}

export function preserveDeviceSurveys(notes, device) {
  if (!device) return notes;
  return notes.map(note => note.anchor.kind === 'device' && note.anchor.deviceId === device.id
    ? { ...note, anchor: { kind: 'point', lat: device.lat, lng: device.lng } }
    : note);
}

function supportedPhotoHeader(bytes) {
  const matches = (offset, prefix) => prefix.every((value, i) => bytes[offset + i] === value);
  return matches(0, [255, 216, 255]) ||
    matches(0, [137, 80, 78, 71, 13, 10, 26, 10]) ||
    (matches(0, [82, 73, 70, 70]) && matches(8, [87, 69, 66, 80]));
}

/** Decode in the browser and re-encode a bounded, metadata-free preview. */
export async function prepareSurveyPhoto(file) {
  if (!file || file.size < 12 || file.size > SURVEY_LIMITS.photoFileBytes) {
    throw new Error('Choose an image no larger than 20 MB.');
  }
  const header = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  if (!supportedPhotoHeader(header)) throw new Error('Choose a JPG, PNG, or WebP photo.');

  const source = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = source;
    try { await image.decode(); }
    catch { throw new Error('This image could not be opened. Try another photo.'); }
    const longest = Math.max(image.naturalWidth, image.naturalHeight);
    if (!longest || image.naturalWidth * image.naturalHeight > 80_000_000) {
      throw new Error('This photo is too large to open. Try resizing it first.');
    }
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) throw new Error('This browser could not prepare the photo.');
    for (const maxEdge of [1600, 1280, 960, 640]) {
      const scale = Math.min(1, maxEdge / longest);
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      context.fillStyle = '#fff';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
      if (dataUrl.startsWith('data:image/jpeg;base64,') && dataUrl.length <= SURVEY_LIMITS.encodedPhotoChars) {
        return { name: file.name.slice(0, 160), dataUrl };
      }
    }
    throw new Error('This photo could not be resized for the project.');
  } finally {
    URL.revokeObjectURL(source);
  }
}
