// IEC 62676-4:2014 thresholds as listed in Axis's pixel-density guide (px/m).
export const DORI_BANDS = [
  { label: 'Unseen', minimum: null, color: '#d66e6a', opacity: 0.32 },
  { label: 'Below Detect', minimum: 0, color: '#717e91', opacity: 0.4 },
  { label: 'Detect', minimum: 25, color: '#3282c8', opacity: 0.44 },
  { label: 'Observe', minimum: 63, color: '#159779', opacity: 0.46 },
  { label: 'Recognize', minimum: 125, color: '#dc9c25', opacity: 0.5 },
  { label: 'Identify', minimum: 250, color: '#7552be', opacity: 0.55 },
];

export const MIN_IMAGE_WIDTH = 160;
export const MAX_IMAGE_WIDTH = 16384;

export function defaultImageWidth(catalogId) {
  return catalogId === 'camera-bullet-8mp' ? 3840 : 2688;
}

export function imageWidth(camera) {
  const width = camera.imageWidth === undefined ? defaultImageWidth(camera.catalogId) : camera.imageWidth;
  if (!Number.isInteger(width) || width < MIN_IMAGE_WIDTH || width > MAX_IMAGE_WIDTH) {
    throw new RangeError(`Horizontal stream resolution must be a whole number from ${MIN_IMAGE_WIDTH} to ${MAX_IMAGE_WIDTH} px.`);
  }
  return width;
}

export function doriBand(pixelDensity) {
  for (let index = DORI_BANDS.length - 1; index >= 2; index--) {
    if (pixelDensity >= DORI_BANDS[index].minimum) return index;
  }
  return 1;
}

export function detectableArea(bands) {
  return bands.slice(2).reduce((sum, band) => sum + band.area, 0);
}
