import React, { useEffect, useRef } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { VideoCamera, CreditCard, Lightbulb, ArrowsOutCardinal, ArrowsOutSimple, Crosshair, Door, Broadcast, PhoneCall, Network, HardDrives, NotePencil } from '@phosphor-icons/react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { planPointToLatLng, latLngToPlanPoint } from './alignment.js';
import { CABLE_TYPES, routePoints, routeLengthMeters } from './cables.js';

const EARTH = 6371008.8;
const radians = (value) => value * Math.PI / 180;
const degrees = (value) => value * 180 / Math.PI;
const color = { camera: '#087f74', reader: '#8b5acb', light: '#bc8924', door: '#b16e3d', sensor: '#d0666c', intercom: '#356db4', switch: '#59719c', cabinet: '#566763' };
const icons = { camera: VideoCamera, reader: CreditCard, light: Lightbulb, door: Door, sensor: Broadcast, intercom: PhoneCall, switch: Network, cabinet: HardDrives };
const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const limit = (value, min, max) => Math.max(min, Math.min(max, value));

export function destination(origin, bearing, distance) {
  const lat = radians(origin.lat);
  const lng = radians(origin.lng);
  const angle = radians(bearing);
  const arc = distance / EARTH;
  const endLat = Math.asin(Math.sin(lat) * Math.cos(arc) + Math.cos(lat) * Math.sin(arc) * Math.cos(angle));
  const endLng = lng + Math.atan2(Math.sin(angle) * Math.sin(arc) * Math.cos(lat), Math.cos(arc) - Math.sin(lat) * Math.sin(endLat));
  return { lat: degrees(endLat), lng: degrees(endLng) };
}

export function distanceBetween(a, b) {
  const dLat = radians(b.lat - a.lat);
  const dLng = radians(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(radians(a.lat)) * Math.cos(radians(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH * Math.asin(Math.sqrt(limit(h, 0, 1)));
}

export function bearingBetween(a, b) {
  const aLat = radians(a.lat);
  const bLat = radians(b.lat);
  const dLng = radians(b.lng - a.lng);
  return (degrees(Math.atan2(Math.sin(dLng) * Math.cos(bLat), Math.cos(aLat) * Math.sin(bLat) - Math.sin(aLat) * Math.cos(bLat) * Math.cos(dLng))) + 360) % 360;
}

function planCorners(plan) {
  return [{u:0,v:0},{u:1,v:0},{u:1,v:1},{u:0,v:1}].map(point => planPointToLatLng(plan, point));
}

export function resizedPlan(plan, cursor) {
  const diagonal = Math.hypot(plan.width, plan.height) / 2;
  const direction = bearingBetween(plan, planCorners(plan)[2]);
  const projected = distanceBetween(plan, cursor) * Math.cos(radians(bearingBetween(plan, cursor) - direction));
  const width = +limit(plan.width * projected / diagonal, 5, 1000).toFixed(1);
  return { ...plan, width, height: plan.height * width / plan.width };
}

function createPlanImage(plan, onClick) {
  const node = document.createElement('div');
  node.className = 'physec-plan-image';
  Object.assign(node.style, { position: 'absolute', transformOrigin: '50% 50%', userSelect: 'none', zIndex: '1', pointerEvents: 'none' });
  const img = document.createElement('img');
  img.src = plan.url;
  img.alt = plan.name || 'Uploaded site plan';
  img.draggable = false;
  Object.assign(img.style, { width: '100%', height: '100%', display: 'block', userSelect: 'none' });
  node.appendChild(img);
  node.addEventListener('click', onClick);
  return node;
}

function setPlanImage(node, plan, project) {
  const center = project(plan);
  const unrotated = { ...plan, rotation: 0 };
  const topLeft = project(planPointToLatLng(unrotated, { u: 0, v: 0 }));
  const bottomRight = project(planPointToLatLng(unrotated, { u: 1, v: 1 }));
  Object.assign(node.style, {
    left: `${center.x}px`, top: `${center.y}px`,
    width: `${Math.abs(bottomRight.x - topLeft.x)}px`, height: `${Math.abs(bottomRight.y - topLeft.y)}px`,
    transform: `translate(-50%, -50%) rotate(${plan.rotation || 0}deg)`,
    opacity: String(limit(plan.opacity > 1 ? plan.opacity / 100 : plan.opacity ?? 0.75, 0, 1)),
  });
}


// Request the public NAIP Plus mosaic at the visible extent instead of
// enlarging the low-resolution ImageryOnly cache for property alignment.
function highResolutionAerial(current) {
  const AerialLayer = L.Layer.extend({
    onAdd(map) {
      this._map = map;
      this._sequence = 0;
      this._refresh = () => {
        const sequence = ++this._sequence;
        window.clearTimeout(this._timeout);
        this._pending?.remove();
        this._pending = null;
        if (map.getZoom() < 16) { this._image?.remove(); this._image = null; return; }
        const bounds = map.getBounds();
        const southwest = L.CRS.EPSG3857.project(bounds.getSouthWest());
        const northeast = L.CRS.EPSG3857.project(bounds.getNorthEast());
        const size = map.getSize();
        if (size.x < 1 || size.y < 1) return;
        const scale = Math.min(1, 2000 / Math.max(size.x, size.y));
        const parameters = new URLSearchParams({
          bbox: [southwest.x, southwest.y, northeast.x, northeast.y].join(','),
          bboxSR: '3857', imageSR: '3857',
          size: Math.round(size.x * scale) + ',' + Math.round(size.y * scale),
          format: 'jpg', f: 'image', interpolation: 'RSP_BilinearInterpolation',
          renderingRule: JSON.stringify({ rasterFunction: 'NaturalColor' }),
        });
        const image = L.imageOverlay('https://imagery.nationalmap.gov/arcgis/rest/services/USGSNAIPPlus/ImageServer/exportImage?' + parameters, bounds, { pane: 'tilePane', opacity: 0, interactive: false, zIndex: 2 });
        this._pending = image;
        image.once('load', () => {
          if (!this._map || this._sequence !== sequence) return;
          window.clearTimeout(this._timeout);
          this._image?.remove();
          image.setOpacity(1);
          this._image = image;
          this._pending = null;
          current.current.onError?.('');
        });
        const failed = () => {
          if (!this._map || this._sequence !== sequence) return;
          window.clearTimeout(this._timeout);
          image.remove();
          this._pending = null;
          current.current.onError?.('Detailed aerial imagery could not load. The overview imagery remains available; retry by moving the map or choose Street.');
        };
        image.once('error', failed);
        this._timeout = window.setTimeout(failed, 20000);
        image.addTo(map);
      };
      map.on('moveend resize', this._refresh);
      this._refresh();
    },
    onRemove(map) {
      map.off('moveend resize', this._refresh);
      ++this._sequence;
      window.clearTimeout(this._timeout);
      this._pending?.remove();
      this._image?.remove();
      this._map = null;
    },
  });
  return new AerialLayer();
}


function alignmentClick(props, position) {
  const alignment = props.alignment;
  if (!alignment) return false;
  position = { lat: position.lat, lng: ((position.lng + 180) % 360 + 360) % 360 - 180 };
  if (alignment.phase === 'source') {
    try {
      const point = latLngToPlanPoint(alignment.originalPlan || props.plan, position);
      if (point.u < -0.002 || point.u > 1.002 || point.v < -0.002 || point.v > 1.002) {
        props.onAlignmentError?.('Choose a point inside the site plan image.');
      } else {
        props.onAlignmentError?.('');
        props.onAlignmentPick?.({ u: limit(point.u, 0, 1), v: limit(point.v, 0, 1) });
      }
    } catch (error) {
      props.onAlignmentError?.(error.message || 'That plan point could not be selected.');
    }
  } else if (alignment.phase === 'target') {
    props.onAlignmentError?.('');
    props.onAlignmentPick?.(position);
  }
  return true;
}

function alignmentPoints(props) {
  const alignment = props.alignment;
  if (!alignment) return { source: [], target: [] };
  return {
    source: alignment.phase === 'target' ? [] : (alignment.sourcePoints || []).map((point) => planPointToLatLng(props.plan, point)),
    target: alignment.phase === 'source' ? [] : (alignment.targetPoints || []),
  };
}


function unwrappedRoutePoints(points) {
  return points.reduce((path, point) => {
    const previous = path.at(-1);
    let lng = point.lng;
    if (previous) lng += Math.round((previous.lng - lng) / 360) * 360;
    path.push({ lat: point.lat, lng });
    return path;
  }, []);
}

function normalizedMapPoint(point) {
  return { lat: point.lat, lng: ((point.lng + 180) % 360 + 360) % 360 - 180 };
}


function coverageGeometry(value) {
  if (!Array.isArray(value)) return [];
  return value.filter(polygon => Array.isArray(polygon) && polygon.length >= 3 && polygon.every(point => point && Number.isFinite(point.lat) && Number.isFinite(point.lng) && Math.abs(point.lat) <= 90))
    .map(polygon => unwrappedRoutePoints(polygon));
}

function drawDoriBands(result, addArea, strokeStyle) {
  result.dori.forEach((band, index) => {
    addArea(result.contours?.[index] ?? band.polygons, { ...strokeStyle, fillColor: band.color, fillOpacity: band.opacity });
  });
}

function polygonEditors(props) {
  const areas = (props.zones ?? [])
    .filter(zone => zone.id !== props.zoneDraft?.id)
    .map(zone => ({
      area: zone,
      label: zone.name,
      selection: { kind: 'zone', id: zone.id },
      selected: !props.zoneDraft && props.selected?.kind === 'zone' && props.selected.id === zone.id,
      active: zone.id === props.activeZoneId,
    }));
  if (props.zoneDraft) {
    areas.push({ area: props.zoneDraft, label: 'Security zone', draft: true, selection: { kind: 'zone' } });
  } else if (!props.suspendCoverage && (!props.activeZoneId || props.coverageAreaDraft)) {
    const draft = Boolean(props.coverageAreaDraft);
    const selected = props.selected?.kind === 'coverage-area';
    if (draft || (props.showCoverage && props.visibleTypes?.camera !== false && (props.coverage?.mode === 'combined' || selected))) {
      areas.push({
        area: props.coverageAreaDraft ?? props.coverageArea,
        label: 'Coverage analysis area',
        selection: { kind: 'coverage-area' },
        draft, selected: !draft && selected,
      });
    }
  }
  return areas;
}

function drawZoneFill(result, addArea, strokeStyle) {
  addArea(result.qualifyingPolygons, { ...strokeStyle, fillColor: '#168d76', fillOpacity: 0.38 });
  addArea(result.gapPolygons, { ...strokeStyle, fillColor: '#ca675d', fillOpacity: 0.42 });
}

function surveyPins(props) {
  const notes = props.surveyNotes ?? [];
  const pins = props.surveyDraft ? [...notes, props.surveyDraft] : notes;
  return pins.filter(note => note.anchor.kind === 'point');
}

function surveyPinStyle(props, note) {
  const selected = props.selected?.kind === 'survey' && props.selected.id === note.id;
  return {
    selected,
    title: 'Survey pin: ' + (note.title || 'New survey note'),
    clickable: props.tool === 'select' && note.id !== props.surveyDraft?.id,
  };
}

function barrierGeometry(barrier) {
  if (!barrier || !Array.isArray(barrier.points)) return [];
  if (barrier.points.some(point => !point || !Number.isFinite(point.lat) || !Number.isFinite(point.lng) || Math.abs(point.lat) > 90)) return [];
  return unwrappedRoutePoints(barrier.points);
}

function cameraAnalyses(props) {
  if (props.showCoverage === false || props.visibleTypes?.camera === false || !Array.isArray(props.coverage?.cameras)) return [];
  const cameraIds = new Set(props.devices.filter(device => device.type === 'camera').map(device => device.id));
  return props.coverage.cameras.filter(entry => cameraIds.has(entry.id) && entry.result);
}


function analysisAreaBounds(points) {
  const path = barrierGeometry({ points });
  if (!path.length) return null;
  const south = Math.min(...path.map(point => point.lat));
  const north = Math.max(...path.map(point => point.lat));
  const west = Math.min(...path.map(point => point.lng));
  const east = Math.max(...path.map(point => point.lng));
  return { path, south, north, west, east, center: normalizedMapPoint({ lat: (south + north) / 2, lng: (west + east) / 2 }) };
}

function makeLeaflet(host, current, viewport) {
  const initial = current.current;
  const map = L.map(host, { center: [viewport?.lat ?? initial.plan.lat, viewport?.lng ?? initial.plan.lng], zoom: viewport?.zoom ?? 19, zoomControl: false, attributionControl: true, maxZoom: 22, minZoom: 3 });
  const planPane = map.createPane('physecPlanPane');
  planPane.style.zIndex = '350';
  planPane.style.pointerEvents = 'none';
  let basemap = null;
  let displayedStyle = null;
  let tileErrors = 0;
  function updateBasemap() {
    const style = current.current.mapStyle === 'satellite' ? 'satellite' : 'street';
    if (displayedStyle === style) return;
    basemap?.remove();
    displayedStyle = style;
    tileErrors = 0;
    const source = style === 'satellite'
      ? {
          url: 'https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryOnly/MapServer/tile/{z}/{y}/{x}',
          maxNativeZoom: 16,
          attribution: 'Imagery: <a href="https://www.usgs.gov/programs/national-geospatial-program/national-map" target="_blank" rel="noreferrer">USGS The National Map</a> / USDA',
        }
      : {
          url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
          maxNativeZoom: 19,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
        };
    const tiles = L.tileLayer(source.url, { maxNativeZoom: source.maxNativeZoom, maxZoom: 22, attribution: source.attribution });
    tiles.on('tileerror', () => {
      if (++tileErrors === 4) current.current.onError?.(style === 'satellite'
        ? 'Aerial imagery could not load for this area. USGS imagery is intended for U.S. sites; try Street or configured Google Maps.'
        : 'Some street map tiles could not load. Check your connection or switch the basemap.');
    });
    basemap = style === 'satellite' ? L.layerGroup([tiles, highResolutionAerial(current)]) : tiles;
    basemap.addTo(map);
  }
  updateBasemap();
  L.control.scale({ position: 'bottomleft', imperial: false, maxWidth: 100 }).addTo(map);
  let scene = L.layerGroup().addTo(map);
  const coveragePane = map.createPane('physecCoveragePane');
  coveragePane.style.zIndex = '360';
  coveragePane.style.pointerEvents = 'none';
  const coverageRenderer = L.canvas({ padding: 0.3, pane: 'physecCoveragePane' });
  const analysisLayers = new Map();
  let planNode = null;
  let displayedPlan = null;
  let ruler = L.layerGroup().addTo(map);
  let measureStart = null;
  let measured = false;

  const updateImage = () => { if (planNode && displayedPlan) setPlanImage(planNode, displayedPlan, (point) => map.project(point).subtract(map.getPixelOrigin())); };
  map.on('zoom viewreset move', updateImage);

  const clearMeasure = () => { ruler.clearLayers(); measureStart = null; measured = false; };
  const handleClick = (event) => {
    const props = current.current;
    if (alignmentClick(props, { lat: event.latlng.lat, lng: event.latlng.lng })) return;
    if (props.tool === 'route') { props.onRoutePoint?.(normalizedMapPoint(event.latlng)); return; }
    if (props.tool === 'coverage-area') { props.onCoverageAreaPoint?.(normalizedMapPoint(event.latlng)); return; }
    if (props.tool === 'zone') { props.onZonePoint?.(normalizedMapPoint(event.latlng)); return; }
    if (props.tool === 'survey') { props.onSurveyPoint?.(normalizedMapPoint(event.latlng)); return; }
    if (props.tool === 'wall' || props.tool === 'obstacle') { props.onBarrierPoint?.(normalizedMapPoint(event.latlng)); return; }
    if (Object.hasOwn(icons, props.tool)) props.onPlace?.(props.tool, { lat: event.latlng.lat, lng: event.latlng.lng });
    if (props.tool !== 'ruler') return;
    if (measured) clearMeasure();
    const point = { lat: event.latlng.lat, lng: event.latlng.lng };
    L.circleMarker(point, { radius: 4, color: '#087f74', weight: 2, fillColor: '#fff', fillOpacity: 1 }).addTo(ruler);
    if (!measureStart) { measureStart = point; return; }
    const meters = distanceBetween(measureStart, point);
    L.polyline([measureStart, point], { color: '#087f74', weight: 2, dashArray: '6 5' }).addTo(ruler);
    L.tooltip({ permanent: true, direction: 'top', className: 'physec-measure-label' }).setLatLng({ lat: (point.lat + measureStart.lat) / 2, lng: (point.lng + measureStart.lng) / 2 }).setContent(`${meters.toFixed(1)} m`).addTo(ruler);
    current.current.onMeasure?.(meters);
    measured = true;
  };
  map.on('click', handleClick);

  const handleIcon = (Icon, title) => L.divIcon({ className: 'physec-map-handle', html: `<span title="${title}" style="display:grid;place-items:center;width:28px;height:28px;border:2px solid #087f74;border-radius:50%;background:white;color:#087f74;box-shadow:0 2px 8px #16302a28">${renderToStaticMarkup(<Icon size={17} weight="bold" />)}</span>`, iconSize: [28, 28], iconAnchor: [14, 14] });


  function renderAlignment(props) {
    const points = alignmentPoints(props);
    const preview = props.alignment.phase === 'preview';
    const addPoints = (items, tint, kind) => {
      if (items.length > 1) L.polyline(items, { color: tint, weight: kind === 'target' ? 3 : 2, dashArray: kind === 'target' ? '7 5' : undefined, opacity: 0.85, interactive: false }).addTo(scene);
      items.forEach((position, index) => {
        const ring = preview && kind === 'target';
        const size = ring ? 38 : 28;
        const icon = L.divIcon({
          className: 'physec-alignment-point',
          html: '<span style="display:grid;place-items:center;width:' + size + 'px;height:' + size + 'px;border:3px solid ' + tint + ';border-radius:50%;background:' + (ring ? 'transparent' : '#fff') + ';color:' + tint + ';font:700 13px Inter,Arial,sans-serif;box-shadow:0 2px 8px #162e2828;pointer-events:none">' + (ring ? '' : index + 1) + '</span>',
          iconSize: [size, size], iconAnchor: [size / 2, size / 2],
        });
        L.marker(position, { icon, interactive: false, keyboard: false, title: (kind === 'target' ? 'Building point ' : 'Plan point ') + (index + 1), zIndexOffset: ring ? 900 : 1000 }).addTo(scene);
      });
    };
    addPoints(points.target, '#bd7c16', 'target');
    addPoints(points.source, '#087f74', 'source');
  }


  function renderRoutes(props) {
    const draw = (route, draft = false) => {
      const path = unwrappedRoutePoints(routePoints(route, props.devices));
      if (path.length < 2) return;
      const selected = !draft && props.selected?.kind === 'route' && props.selected.id === route.id;
      const tint = CABLE_TYPES[route.cableType]?.color || CABLE_TYPES.cat6.color;
      const canSelect = !draft && props.tool === 'select';
      const halo = L.polyline(path, { color: '#fff', weight: selected || draft ? 9 : 6, opacity: 0.8, interactive: false }).addTo(scene);
      const line = L.polyline(path, {
        className: 'physec-route-line', color: tint, weight: selected || draft ? 5 : 3,
        opacity: 0.95, dashArray: draft ? '8 6' : undefined,
        interactive: canSelect, bubblingMouseEvents: false,
      }).addTo(scene);
      if (canSelect) {
        line.on('click', (event) => { L.DomEvent.stopPropagation(event); current.current.onSelect?.({ kind: 'route', id: route.id }); });
        line.bindTooltip(escapeHtml((route.name || route.id) + ' · ' + routeLengthMeters(route, props.devices).toFixed(1) + ' m'), { sticky: true });
        line.getElement()?.setAttribute('aria-label', 'Cable route ' + (route.name || route.id));
      }
      if (selected || draft) (route.via || []).forEach((position, index) => {
        const size = selected ? 26 : 22;
        const icon = L.divIcon({
          className: 'physec-route-handle',
          html: '<span style="display:grid;place-items:center;width:' + size + 'px;height:' + size + 'px;border:2px solid ' + tint + ';border-radius:6px;background:white;color:' + tint + ';font:700 11px Inter,Arial,sans-serif;box-shadow:0 2px 7px #122c2830">' + (index + 1) + '</span>',
          iconSize: [size, size], iconAnchor: [size / 2, size / 2],
        });
        const handle = L.marker(position, { icon, draggable: selected && props.tool === 'select', interactive: selected && props.tool === 'select', keyboard: selected && props.tool === 'select', title: 'Route bend ' + (index + 1), zIndexOffset: 800, bubblingMouseEvents: false }).addTo(scene);
        if (selected && props.tool === 'select') {
          handle.on('click', L.DomEvent.stopPropagation);
          handle.on('drag', () => {
            const via = route.via.map((point, i) => i === index ? normalizedMapPoint(handle.getLatLng()) : point);
            const nextPath = unwrappedRoutePoints(routePoints({ ...route, via }, props.devices));
            line.setLatLngs(nextPath); halo.setLatLngs(nextPath);
          });
          handle.on('dragend', () => {
            const via = route.via.map((point, i) => i === index ? normalizedMapPoint(handle.getLatLng()) : { ...point });
            current.current.onRouteChange?.(route.id, { via });
          });
        }
      });
    };
    (props.routes || []).forEach(route => draw(route));
    if (props.routeDraft) draw(props.routeDraft, true);
  }


  function renderCoverage(props) {
    if (props.zoneDraft || props.suspendCoverage) return;
    if (props.activeZoneId) {
      if (!props.zoneResult) return;
      const layers = L.layerGroup().addTo(scene);
      analysisLayers.set('__zone_coverage__', layers);
      drawZoneFill(props.zoneResult, (value, style) => {
        const polygons = coverageGeometry(value);
        if (polygons.length) L.polygon(polygons.map(polygon => [polygon]), {
          renderer: coverageRenderer, interactive: false, smoothFactor: 0, ...style,
        }).addTo(layers);
      }, { stroke: false });
      return;
    }
    if (props.showCoverage === false || props.visibleTypes?.camera === false || props.coverageAreaDraft) return;
    if (props.coverage?.mode === 'combined') {
      const result = props.coverage.combined;
      if (!result) return;
      const layers = L.layerGroup().addTo(scene);
      analysisLayers.set('__combined_coverage__', layers);
      const addArea = (value, options) => {
        const polygons = coverageGeometry(value);
        if (polygons.length) L.polygon(polygons.map(polygon => [polygon]), {
          renderer: coverageRenderer, interactive: false, smoothFactor: result.contours ? 0 : 1, ...options,
        }).addTo(layers);
      };
      if (result.dori) drawDoriBands(result, addArea, { stroke: false });
      else {
        addArea(result.contours?.[0] ?? result.uncoveredPolygons, { stroke: false, fillColor: '#d66e6a', fillOpacity: 0.32 });
        addArea(result.contours?.[1] ?? result.singlePolygons, { stroke: false, fillColor: '#159779', fillOpacity: 0.3 });
        addArea(result.contours?.[2] ?? result.overlapPolygons, { stroke: false, fillColor: '#6860c4', fillOpacity: 0.42 });
      }
      if (barrierGeometry(props.coverageArea).length < 3) addArea(result.boundaryPolygons, { color: '#6553b9', weight: 2, dashArray: '7 5', opacity: 0.9, fill: false });
      return;
    }
    for (const entry of cameraAnalyses(props)) {
      const layers = L.layerGroup().addTo(scene);
      analysisLayers.set(entry.id, layers);
      const selected = props.coverage.selectedId === entry.id;
      const addArea = (value, options) => {
        const polygons = coverageGeometry(value);
        if (!polygons.length) return;
        // Keep merged cell polygons in one multipolygon layer, not thousands of DOM nodes.
        L.polygon(polygons.map(polygon => [polygon]), {
          renderer: coverageRenderer, interactive: false, smoothFactor: entry.result.contours ? 0 : 1, ...options,
        }).addTo(layers);
      };
      if (entry.result.dori) drawDoriBands(entry.result, addArea, { stroke: false });
      else addArea(entry.result.contours?.[1] ?? entry.result.visiblePolygons, { stroke: false, fillColor: '#159779', fillOpacity: selected ? 0.3 : 0.18 });
      if (selected) {
        if (!entry.result.dori) addArea(entry.result.contours?.[0] ?? entry.result.blockedPolygons, { stroke: false, fillColor: '#d46a67', fillOpacity: 0.3 });
        addArea(entry.result.nearBlindPolygons, { color: '#bb8b24', weight: 1, dashArray: '5 5', opacity: 0.55, fillColor: '#e3af47', fillOpacity: entry.result.dori ? 0 : 0.22 });
        addArea(entry.result.nominalPolygons, { color: '#117c6d', weight: 1.25, dashArray: '6 5', opacity: 0.7, fill: false });
      }
    }
  }

  function hideAnalysis(id) {
    analysisLayers.get('__combined_coverage__')?.clearLayers();
    analysisLayers.get('__zone_coverage__')?.clearLayers();
    if (id) analysisLayers.get(id)?.clearLayers();
    else analysisLayers.forEach(layers => layers.clearLayers());
  }


  function renderArea(props, { area, label, selection, draft, selected, active }) {
    const points = barrierGeometry(area);
    if (!points.length || (!draft && points.length < 3)) return;
    const canEdit = selected && props.tool === 'select';
    const zone = selection.kind === 'zone';
    const tint = zone ? '#4d626a' : '#6553b9';
    const options = { color: tint, weight: draft || selected || active ? 3 : 2, dashArray: '8 5', opacity: 0.95, fill: draft && points.length >= 3, fillColor: tint, fillOpacity: 0.08, interactive: !draft && props.tool === 'select', bubblingMouseEvents: false, className: 'physec-coverage-area' };
    const shape = points.length >= 2 ? (points.length >= 3 ? L.polygon(points, options) : L.polyline(points, options)).addTo(scene) : null;
    if (shape && !draft && props.tool === 'select') {
      shape.on('click', event => { L.DomEvent.stopPropagation(event); current.current.onSelect?.(selection); });
      shape.bindTooltip(escapeHtml(label), { sticky: true });
      shape.getElement()?.setAttribute('aria-label', label);
    }
    if (selected || draft) points.forEach((position, index) => {
      const size = draft ? 22 : 26;
      const icon = L.divIcon({
        className: 'physec-coverage-area-handle',
        html: '<span style="display:grid;place-items:center;width:' + size + 'px;height:' + size + 'px;border:2px solid ' + tint + ';border-radius:5px;background:white;color:' + tint + ';font:700 11px Inter,Arial,sans-serif;box-shadow:0 2px 7px #122c2830">' + (index + 1) + '</span>',
        iconSize: [size, size], iconAnchor: [size / 2, size / 2],
      });
      const handle = L.marker(position, { icon, draggable: canEdit, interactive: canEdit, keyboard: canEdit, title: label + ' corner ' + (index + 1), zIndexOffset: 875, bubblingMouseEvents: false }).addTo(scene);
      if (canEdit) {
        handle.on('click', L.DomEvent.stopPropagation);
        handle.on('dragstart', () => hideAnalysis());
        handle.on('drag', () => {
          const moved = area.points.map((point, i) => i === index ? normalizedMapPoint(handle.getLatLng()) : point);
          shape?.setLatLngs(unwrappedRoutePoints(moved));
        });
        handle.on('dragend', () => {
          const moved = area.points.map((point, i) => i === index ? normalizedMapPoint(handle.getLatLng()) : { ...point });
          if (zone) current.current.onZoneBoundaryChange?.(area.id, moved);
          else current.current.onCoverageAreaChange?.(moved);
        });
      }
    });
  }

  function renderBarriers(props) {
    const draw = (barrier, draft = false) => {
      const points = barrierGeometry(barrier);
      if (!points.length) return;
      const obstacle = barrier.kind === 'obstacle';
      const selected = !draft && props.selected?.kind === 'barrier' && props.selected.id === barrier.id;
      const canEdit = selected && props.tool === 'select';
      const enabled = barrier.enabled !== false;
      const tint = draft || selected ? '#c98224' : enabled ? (obstacle ? '#9a673b' : '#50656d') : '#9aa3a1';
      const options = { color: tint, weight: selected || draft ? 4 : obstacle ? 2 : 5, opacity: enabled || draft ? 0.95 : 0.55, dashArray: draft || !enabled ? '8 6' : undefined, fillColor: tint, fillOpacity: obstacle ? (enabled ? 0.18 : 0.06) : 0, interactive: !draft && props.tool === 'select', bubblingMouseEvents: false, className: 'physec-barrier-shape' };
      const shape = points.length >= 2 ? (obstacle && points.length >= 3 ? L.polygon(points, options) : L.polyline(points, options)).addTo(scene) : null;
      if (shape && !draft && props.tool === 'select') {
        shape.on('click', (event) => { L.DomEvent.stopPropagation(event); current.current.onSelect?.({ kind: 'barrier', id: barrier.id }); });
        shape.bindTooltip(escapeHtml((barrier.name || barrier.id) + ' · ' + (barrier.height ?? 3) + ' m high' + (enabled ? '' : ' · excluded')), { sticky: true });
        shape.getElement()?.setAttribute('aria-label', (obstacle ? 'Obstacle ' : 'Wall ') + (barrier.name || barrier.id));
      }
      if (selected || draft) points.forEach((position, index) => {
        const size = draft ? 22 : 26;
        const icon = L.divIcon({
          className: 'physec-barrier-handle',
          html: '<span style="display:grid;place-items:center;width:' + size + 'px;height:' + size + 'px;border:2px solid ' + tint + ';border-radius:' + (obstacle ? '5px' : '50%') + ';background:white;color:' + tint + ';font:700 11px Inter,Arial,sans-serif;box-shadow:0 2px 7px #122c2830">' + (index + 1) + '</span>',
          iconSize: [size, size], iconAnchor: [size / 2, size / 2],
        });
        const handle = L.marker(position, { icon, draggable: canEdit, interactive: canEdit, keyboard: canEdit, title: (obstacle ? 'Obstacle vertex ' : 'Wall vertex ') + (index + 1), zIndexOffset: 850, bubblingMouseEvents: false }).addTo(scene);
        if (canEdit) {
          handle.on('click', L.DomEvent.stopPropagation);
          handle.on('dragstart', () => hideAnalysis());
          handle.on('drag', () => {
            const moved = barrier.points.map((point, i) => i === index ? normalizedMapPoint(handle.getLatLng()) : point);
            shape?.setLatLngs(unwrappedRoutePoints(moved));
          });
          handle.on('dragend', () => {
            const moved = barrier.points.map((point, i) => i === index ? normalizedMapPoint(handle.getLatLng()) : { ...point });
            current.current.onBarrierChange?.(barrier.id, { points: moved });
          });
        }
      });
    };
    (props.barriers || []).forEach(barrier => draw(barrier));
    if (props.barrierDraft) draw(props.barrierDraft, true);
  }

  function render() {
    const props = current.current;
    updateBasemap();
    scene.clearLayers(); analysisLayers.clear();
    if (planNode) { planNode.remove(); planNode = null; }
    const plan = props.plan;
    if (plan.visible && plan.url) {
      displayedPlan = plan;
      planNode = createPlanImage(plan, (event) => { if (current.current.tool === 'select') { event.stopPropagation(); current.current.onSelect?.({ kind: 'plan' }); } });
      planNode.style.pointerEvents = 'none';
      planPane.appendChild(planNode);
      updateImage();
      const planHitArea = L.polygon(planCorners(plan), { fillOpacity: 0, stroke: false, interactive: !props.alignment && props.tool === 'select', bubblingMouseEvents: false }).addTo(scene);
      planHitArea.on('click', () => current.current.onSelect?.({ kind: 'plan' }));
      if (props.selected?.kind === 'plan') {
        const corners = planCorners(plan);
        const outline = L.polygon(corners, { color: '#087f74', weight: 1.5, dashArray: '7 6', fill: false, interactive: false }).addTo(scene);
        if (!props.alignment && !plan.locked && props.tool === 'select') {
          const move = L.marker([plan.lat, plan.lng], { icon: handleIcon(ArrowsOutCardinal, 'Move site plan'), draggable: true, title: 'Move site plan', zIndexOffset: 600 }).addTo(scene);
          const resize = L.marker(corners[2], { icon: handleIcon(ArrowsOutSimple, 'Resize site plan'), draggable: true, title: 'Resize site plan', zIndexOffset: 600 }).addTo(scene);
          move.on('drag', () => {
            const position = move.getLatLng();
            displayedPlan = { ...plan, lat: position.lat, lng: position.lng };
            outline.setLatLngs(planCorners(displayedPlan));
            planHitArea.setLatLngs(planCorners(displayedPlan));
            resize.setLatLng(planCorners(displayedPlan)[2]);
            updateImage();
          });
          move.on('dragend', () => { const position = move.getLatLng(); current.current.onPlanChange?.({ lat: position.lat, lng: position.lng }); });
          resize.on('drag', () => {
            displayedPlan = resizedPlan(plan, resize.getLatLng());
            outline.setLatLngs(planCorners(displayedPlan));
            planHitArea.setLatLngs(planCorners(displayedPlan));
            resize.setLatLng(planCorners(displayedPlan)[2]);
            updateImage();
          });
          resize.on('dragend', () => { if (displayedPlan) { resize.setLatLng(planCorners(displayedPlan)[2]); current.current.onPlanChange?.({ width: displayedPlan.width, height: displayedPlan.height }); } });
          move.on('click', L.DomEvent.stopPropagation);
          resize.on('click', L.DomEvent.stopPropagation);
        }
      }
    } else displayedPlan = null;

    if (props.alignment) {
      renderAlignment(props);
      host.style.cursor = props.alignment.phase === 'preview' ? '' : 'crosshair';
      clearMeasure();
      return;
    }

    renderCoverage(props);
    polygonEditors(props).forEach(area => renderArea(props, area));
    renderBarriers(props);
    renderRoutes(props);
    const surveyGlyph = renderToStaticMarkup(<NotePencil size={17}/>);
    for (const note of surveyPins(props)) {
      const { selected, title, clickable } = surveyPinStyle(props, note);
      const icon = L.divIcon({
        className: 'physec-survey-marker', iconSize: [30, 30], iconAnchor: [15, 15],
        html: '<span class="survey-map-pin' + (selected ? ' selected' : '') + '">' + surveyGlyph + '</span>',
      });
      const pin = L.marker(note.anchor, {
        icon, title, alt: title, interactive: clickable, keyboard: clickable, bubblingMouseEvents: false,
        zIndexOffset: selected ? 700 : 300,
      }).addTo(scene);
      if (clickable) pin.on('click', event => {
        L.DomEvent.stopPropagation(event);
        current.current.onSelect?.({ kind: 'survey', id: note.id });
      });
    }
    props.devices.forEach((device) => {
      if (props.visibleTypes?.[device.type] === false) return;
      const deviceSelected = props.selected?.kind === 'device' && props.selected.id === device.id;
      const isSelected = deviceSelected || props.surveyDeviceId === device.id;
      const tint = color[device.type] || color.camera;
      const Icon = icons[device.type] || VideoCamera;
      const markup = renderToStaticMarkup(<Icon size={18} weight="regular" />);
      const icon = L.divIcon({ className: 'physec-device-marker', html: `<div style="position:relative;width:32px;height:32px;display:grid;place-items:center;background:${isSelected ? tint : '#fff'};color:${isSelected ? '#fff' : tint};border:2px solid ${tint};border-radius:50%;box-shadow:${isSelected ? `0 0 0 5px ${tint}26,` : ''}0 2px 7px #142b2b20">${markup}<span style="position:absolute;left:37px;top:5px;white-space:nowrap;color:${isSelected ? '#fff' : '#263b37'};background:${isSelected ? tint : '#ffffffee'};border-radius:4px;padding:3px 5px;font:600 10px Inter,Arial,sans-serif;box-shadow:0 1px 3px #142b2b15">${escapeHtml(device.id)}</span></div>`, iconSize: [32, 32], iconAnchor: [16, 16] });
      const interactive = !['wall', 'obstacle', 'coverage-area', 'zone', 'survey'].includes(props.tool);
      const marker = L.marker(device, { icon, draggable: props.tool === 'select', interactive, keyboard: interactive, title: `${device.id} — ${device.name}`, zIndexOffset: isSelected ? 400 : 200, bubblingMouseEvents: false }).addTo(scene);
      marker.on('click', (event) => { L.DomEvent.stopPropagation(event); current.current.onSelect?.({ kind: 'device', id: device.id }); });
      marker.on('dragstart', () => hideAnalysis(device.id));
      marker.on('dragend', () => { const position = marker.getLatLng(); current.current.onDeviceChange?.(device.id, { lat: position.lat, lng: position.lng }); });
      if (deviceSelected && device.type === 'camera' && props.tool === 'select') {
        const aim = L.marker(destination(device, Number(device.bearing) || 0, Number(device.range) || 28), { icon: handleIcon(Crosshair, 'Aim camera'), draggable: true, title: 'Drag to aim camera', zIndexOffset: 500 }).addTo(scene);
        aim.on('dragstart', () => hideAnalysis(device.id));
        aim.on('dragend', () => current.current.onDeviceChange?.(device.id, { bearing: Math.round(bearingBetween(device, aim.getLatLng())) }));
        aim.on('click', L.DomEvent.stopPropagation);
      }
    });
    host.style.cursor = props.tool === 'select' ? '' : 'crosshair';
    if (props.tool !== 'ruler') clearMeasure();
  }

  const resizeObserver = new ResizeObserver(() => map.invalidateSize({ pan: false }));
  resizeObserver.observe(host);
  return {
    render, clearMeasure,
    zoomIn: () => map.zoomIn(), zoomOut: () => map.zoomOut(),
    fitPlan: () => { const plan = current.current.plan; if (!plan.url) { map.setView([plan.lat, plan.lng], Math.min(map.getZoom(), 19)); return; } map.fitBounds(L.latLngBounds(planCorners(plan)), { padding: [80, 70], maxZoom: 20 }); },
    fitArea: (points) => { const bounds = analysisAreaBounds(points); if (bounds) map.fitBounds(L.latLngBounds(bounds.path), { padding: [30, 30], maxZoom: 20 }); },
    fitPlanForAlignment: () => map.fitBounds(L.latLngBounds(planCorners(current.current.alignment?.originalPlan || current.current.plan)), { paddingTopLeft: [60, 100], paddingBottomRight: [60, 260], maxZoom: 20 }),
    goTo: (lat, lng, zoom = 19) => map.setView([lat, lng], limit(zoom, 3, 22)),
    getCenter: () => { const p = map.getCenter(); return { lat: p.lat, lng: p.lng }; },
    getView: () => { const p = map.getCenter(); return { lat: p.lat, lng: p.lng, zoom: map.getZoom() }; },
    destroy: () => { resizeObserver.disconnect(); planNode?.remove(); map.off('zoom viewreset move', updateImage); map.remove(); },
  };
}

function loadGoogle(key, targetWindow, signal, onAuthFailure) {
  return new Promise((resolve, reject) => {
    const callback = `physecGoogleReady_${Date.now()}`;
    const script = targetWindow.document.createElement('script');
    let complete = false;
    script.async = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&callback=${callback}&v=weekly&loading=async`;
    const cleanup = () => { window.clearTimeout(timeout); delete targetWindow[callback]; signal.removeEventListener('abort', abort); };
    const fail = (message) => { if (!complete) { complete = true; cleanup(); script.remove(); reject(new Error(message)); } };
    const abort = () => fail('Map loading was cancelled.');
    const timeout = window.setTimeout(() => fail('Google Maps took too long to load. Check your key and connection.'), 20000);
    targetWindow[callback] = () => { if (!complete) { complete = true; cleanup(); resolve(targetWindow.google.maps); } };
    targetWindow.gm_authFailure = () => {
      const message = 'Google Maps rejected this key. Check that Maps JavaScript API and billing are enabled, and that the key allows this website.';
      if (!complete) fail(message); else if (!signal.aborted) onAuthFailure(message);
    };
    script.onerror = () => fail('Google Maps could not load. Check your API key and connection.');
    signal.addEventListener('abort', abort, { once: true });
    if (signal.aborted) abort(); else targetWindow.document.head.appendChild(script);
  });
}

function makeGoogle(host, maps, current, viewport) {
  const initial = current.current;
  const map = new maps.Map(host, { center: { lat: viewport?.lat ?? initial.plan.lat, lng: viewport?.lng ?? initial.plan.lng }, zoom: viewport?.zoom ?? 19, mapTypeId: initial.mapStyle ? (initial.mapStyle === 'satellite' ? 'satellite' : 'roadmap') : initial.googleType || 'satellite', disableDefaultUI: true, keyboardShortcuts: true, gestureHandling: 'greedy', tilt: 0, heading: 0 });
  let scene = [];
  const analysisLayers = new Map();
  let overlay;
  let measureStart;
  let measurement = [];
  let measured = false;
  const clearObjects = (items) => { items.forEach((item) => { maps.event.clearInstanceListeners(item); item.setMap(null); }); };
  const clearMeasure = () => { clearObjects(measurement); measurement = []; measureStart = null; measured = false; };
  const add = (item) => { scene.push(item); return item; };
  const point = (location) => ({ lat: location.lat(), lng: location.lng() });
  const marker = (position, options = {}) => add(new maps.Marker({ map, position, ...options }));
  const handleIcon = { path: maps.SymbolPath.CIRCLE, scale: 9, fillColor: '#fff', fillOpacity: 1, strokeColor: '#087f74', strokeWeight: 2 };
  const glyphHandle = (Icon) => ({ url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(renderToStaticMarkup(<Icon size={28} color="#087f74" weight="fill" />))}`, scaledSize: new maps.Size(28, 28), anchor: new maps.Point(14, 14) });

  class PlanOverlay extends maps.OverlayView {
    constructor(plan) { super(); this.plan = plan; }
    onAdd() {
      this.node = createPlanImage(this.plan, (event) => { if (current.current.tool === 'select') { event.stopPropagation(); current.current.onSelect?.({ kind: 'plan' }); } });
      this.node.style.pointerEvents = 'none';
      this.getPanes().overlayLayer.appendChild(this.node);
    }
    draw() { const projection = this.getProjection(); if (this.node && projection) setPlanImage(this.node, this.plan, (p) => projection.fromLatLngToDivPixel(new maps.LatLng(p.lat, p.lng))); }
    onRemove() { this.node?.remove(); }
  }

  const clickListener = map.addListener('click', (event) => {
    if (!event.latLng) return;
    const props = current.current;
    const position = point(event.latLng);
    if (alignmentClick(props, position)) return;
    if (props.tool === 'route') { props.onRoutePoint?.(normalizedMapPoint(position)); return; }
    if (props.tool === 'coverage-area') { props.onCoverageAreaPoint?.(normalizedMapPoint(position)); return; }
    if (props.tool === 'zone') { event.stop?.(); props.onZonePoint?.(normalizedMapPoint(position)); return; }
    if (props.tool === 'survey') { event.stop?.(); props.onSurveyPoint?.(normalizedMapPoint(position)); return; }
    if (props.tool === 'wall' || props.tool === 'obstacle') { props.onBarrierPoint?.(normalizedMapPoint(position)); return; }
    if (Object.hasOwn(icons, props.tool)) props.onPlace?.(props.tool, position);
    if (props.tool !== 'ruler') return;
    if (measured) clearMeasure();
    measurement.push(new maps.Marker({ map, position, icon: { ...handleIcon, scale: 4 } }));
    if (!measureStart) { measureStart = position; return; }
    measurement.push(new maps.Polyline({ map, path: [measureStart, position], strokeColor: '#087f74', strokeWeight: 2 }));
    current.current.onMeasure?.(distanceBetween(measureStart, position));
    measured = true;
  });


  function renderAlignment(props) {
    const points = alignmentPoints(props);
    const preview = props.alignment.phase === 'preview';
    const addPoints = (items, tint, kind) => {
      if (items.length > 1) add(new maps.Polyline({ map, path: items, strokeColor: tint, strokeWeight: kind === 'target' ? 3 : 2, strokeOpacity: 0.85, clickable: false }));
      items.forEach((position, index) => {
        const ring = preview && kind === 'target';
        marker(position, {
          clickable: false, draggable: false, zIndex: ring ? 900 : 1000,
          title: (kind === 'target' ? 'Building point ' : 'Plan point ') + (index + 1),
          icon: { path: maps.SymbolPath.CIRCLE, scale: ring ? 19 : 14, fillColor: '#fff', fillOpacity: ring ? 0 : 1, strokeColor: tint, strokeWeight: 3 },
          label: ring ? undefined : { text: String(index + 1), color: tint, fontSize: '13px', fontWeight: '700' },
        });
      });
    };
    addPoints(points.target, '#bd7c16', 'target');
    addPoints(points.source, '#087f74', 'source');
  }


  function renderRoutes(props) {
    const draw = (route, draft = false) => {
      const path = routePoints(route, props.devices);
      if (path.length < 2) return;
      const selected = !draft && props.selected?.kind === 'route' && props.selected.id === route.id;
      const tint = CABLE_TYPES[route.cableType]?.color || CABLE_TYPES.cat6.color;
      const canSelect = !draft && props.tool === 'select';
      const halo = add(new maps.Polyline({ map, path, geodesic: true, strokeColor: '#fff', strokeWeight: selected || draft ? 9 : 6, strokeOpacity: 0.8, clickable: false, zIndex: 100 }));
      const line = add(new maps.Polyline({
        map, path, geodesic: true, strokeColor: tint, strokeWeight: selected || draft ? 5 : 3,
        strokeOpacity: draft ? 0.65 : 0.95, clickable: canSelect, zIndex: 110,
      }));
      if (canSelect) line.addListener('click', () => current.current.onSelect?.({ kind: 'route', id: route.id }));
      if (selected || draft) (route.via || []).forEach((position, index) => {
        const handle = marker(position, {
          title: 'Route bend ' + (index + 1), draggable: selected && props.tool === 'select', clickable: selected && props.tool === 'select', zIndex: 900,
          icon: { path: maps.SymbolPath.CIRCLE, scale: selected ? 13 : 11, fillColor: '#fff', fillOpacity: 1, strokeColor: tint, strokeWeight: 2 },
          label: { text: String(index + 1), color: tint, fontSize: '11px', fontWeight: '700' },
        });
        if (selected && props.tool === 'select') {
          handle.addListener('drag', (event) => {
            const via = route.via.map((item, i) => i === index ? normalizedMapPoint(point(event.latLng)) : item);
            const nextPath = routePoints({ ...route, via }, props.devices);
            line.setPath(nextPath); halo.setPath(nextPath);
          });
          handle.addListener('dragend', (event) => {
            const via = route.via.map((item, i) => i === index ? normalizedMapPoint(point(event.latLng)) : { ...item });
            current.current.onRouteChange?.(route.id, { via });
          });
        }
      });
    };
    (props.routes || []).forEach(route => draw(route));
    if (props.routeDraft) draw(props.routeDraft, true);
  }



  function addCoverageMultiPolygon(polygons, options) {
    const style = { clickable: false, zIndex: 15, ...options };
    const layer = add(new maps.Data({ map, style }));
    // Each sampled piece is a separate polygon with one exterior ring, never a hole.
    layer.add({ geometry: new maps.Data.MultiPolygon(polygons.map(polygon => [polygon])) });
    return { setVisible: visible => layer.setStyle({ ...style, visible }) };
  }

  function renderCoverage(props) {
    if (props.zoneDraft || props.suspendCoverage) return;
    if (props.activeZoneId) {
      if (!props.zoneResult) return;
      const layers = [];
      analysisLayers.set('__zone_coverage__', layers);
      drawZoneFill(props.zoneResult, (value, style) => {
        const polygons = coverageGeometry(value);
        if (polygons.length) layers.push(addCoverageMultiPolygon(polygons, style));
      }, { strokeOpacity: 0 });
      return;
    }
    if (props.showCoverage === false || props.visibleTypes?.camera === false || props.coverageAreaDraft) return;
    if (props.coverage?.mode === 'combined') {
      const result = props.coverage.combined;
      if (!result) return;
      const layers = [];
      analysisLayers.set('__combined_coverage__', layers);
      const addArea = (value, options) => {
        const polygons = coverageGeometry(value);
        if (polygons.length) layers.push(addCoverageMultiPolygon(polygons, options));
      };
      if (result.dori) drawDoriBands(result, addArea, { strokeOpacity: 0 });
      else {
        addArea(result.contours?.[0] ?? result.uncoveredPolygons, { strokeOpacity: 0, fillColor: '#d66e6a', fillOpacity: 0.32 });
        addArea(result.contours?.[1] ?? result.singlePolygons, { strokeOpacity: 0, fillColor: '#159779', fillOpacity: 0.3 });
        addArea(result.contours?.[2] ?? result.overlapPolygons, { strokeOpacity: 0, fillColor: '#6860c4', fillOpacity: 0.42 });
      }
      if (barrierGeometry(props.coverageArea).length < 3) addArea(result.boundaryPolygons, { strokeColor: '#6553b9', strokeWeight: 2, strokeOpacity: 0.9, fillOpacity: 0 });
      return;
    }
    for (const entry of cameraAnalyses(props)) {
      const layers = [];
      analysisLayers.set(entry.id, layers);
      const selected = props.coverage.selectedId === entry.id;
      const addArea = (value, options) => {
        const polygons = coverageGeometry(value);
        if (!polygons.length) return;
        layers.push(addCoverageMultiPolygon(polygons, options));
      };
      if (entry.result.dori) drawDoriBands(entry.result, addArea, { strokeOpacity: 0 });
      else addArea(entry.result.contours?.[1] ?? entry.result.visiblePolygons, { strokeOpacity: 0, fillColor: '#159779', fillOpacity: selected ? 0.3 : 0.18 });
      if (selected) {
        if (!entry.result.dori) addArea(entry.result.contours?.[0] ?? entry.result.blockedPolygons, { strokeOpacity: 0, fillColor: '#d46a67', fillOpacity: 0.3 });
        addArea(entry.result.nearBlindPolygons, { strokeColor: '#bb8b24', strokeWeight: 1, strokeOpacity: 0.55, fillColor: '#e3af47', fillOpacity: entry.result.dori ? 0 : 0.22 });
        addArea(entry.result.nominalPolygons, { strokeColor: '#117c6d', strokeWeight: 1.25, strokeOpacity: 0.7, fillOpacity: 0 });
      }
    }
  }

  function hideAnalysis(id) {
    analysisLayers.get('__combined_coverage__')?.forEach(layer => layer.setVisible(false));
    analysisLayers.get('__zone_coverage__')?.forEach(layer => layer.setVisible(false));
    if (id) analysisLayers.get(id)?.forEach(layer => layer.setVisible(false));
    else analysisLayers.forEach(layers => layers.forEach(layer => layer.setVisible(false)));
  }


  function renderArea(props, { area, label, selection, draft, selected, active }) {
    const points = barrierGeometry(area);
    if (!points.length || (!draft && points.length < 3)) return;
    const canEdit = selected && props.tool === 'select';
    const zone = selection.kind === 'zone';
    const tint = zone ? '#4d626a' : '#6553b9';
    const areaShape = points.length >= 3 ? add(new maps.Polygon({ map, paths: points, strokeOpacity: 0, fillColor: tint, fillOpacity: draft ? 0.08 : 0, clickable: false, zIndex: 45 })) : null;
    const boundary = points.length >= 3 ? [...points, points[0]] : points;
    const outline = points.length >= 2 ? add(new maps.Polyline({ map, path: boundary, strokeOpacity: 0, clickable: !draft && props.tool === 'select', zIndex: 46, icons: [{ icon: { path: 'M 0,-1 0,1', strokeColor: tint, strokeOpacity: 0.95, scale: selected || draft || active ? 2 : 1.5 }, offset: '0', repeat: '12px' }] })) : null;
    if (outline && !draft && props.tool === 'select') outline.addListener('click', () => current.current.onSelect?.(selection));
    if (selected || draft) points.forEach((position, index) => {
      const handle = marker(position, {
        title: label + ' corner ' + (index + 1), draggable: canEdit, clickable: canEdit, zIndex: 975,
        icon: { path: maps.SymbolPath.CIRCLE, scale: draft ? 11 : 13, fillColor: '#fff', fillOpacity: 1, strokeColor: tint, strokeWeight: 2 },
        label: { text: String(index + 1), color: tint, fontSize: '11px', fontWeight: '700' },
      });
      if (canEdit) {
        handle.addListener('dragstart', () => hideAnalysis());
        handle.addListener('drag', event => {
          const moved = area.points.map((item, i) => i === index ? normalizedMapPoint(point(event.latLng)) : item);
          areaShape?.setPath(moved);
          outline?.setPath([...moved, moved[0]]);
        });
        handle.addListener('dragend', event => {
          const moved = area.points.map((item, i) => i === index ? normalizedMapPoint(point(event.latLng)) : { ...item });
          if (zone) current.current.onZoneBoundaryChange?.(area.id, moved);
          else current.current.onCoverageAreaChange?.(moved);
        });
      }
    });
  }

  function renderBarriers(props) {
    const draw = (barrier, draft = false) => {
      const points = barrierGeometry(barrier);
      if (!points.length) return;
      const obstacle = barrier.kind === 'obstacle';
      const selected = !draft && props.selected?.kind === 'barrier' && props.selected.id === barrier.id;
      const canEdit = selected && props.tool === 'select';
      const enabled = barrier.enabled !== false;
      const tint = draft || selected ? '#c98224' : enabled ? (obstacle ? '#9a673b' : '#50656d') : '#9aa3a1';
      const options = { map, strokeColor: tint, strokeWeight: selected || draft ? 4 : obstacle ? 2 : 5, strokeOpacity: enabled || draft ? 0.95 : 0.55, fillColor: tint, fillOpacity: obstacle ? (enabled ? 0.18 : 0.06) : 0, clickable: !draft && props.tool === 'select', zIndex: 50 };
      const shape = points.length >= 2 ? add(obstacle && points.length >= 3 ? new maps.Polygon({ ...options, paths: points }) : new maps.Polyline({ ...options, path: points })) : null;
      if (draft && shape) {
        shape.setOptions({ strokeOpacity: 0 });
        const boundary = obstacle && points.length >= 3 ? [...points, points[0]] : points;
        add(new maps.Polyline({ map, path: boundary, strokeOpacity: 0, clickable: false, zIndex: 51, icons: [{ icon: { path: 'M 0,-1 0,1', strokeColor: tint, strokeOpacity: 0.95, scale: 2 }, offset: '0', repeat: '12px' }] }));
      }
      if (shape && !draft && props.tool === 'select') shape.addListener('click', () => current.current.onSelect?.({ kind: 'barrier', id: barrier.id }));
      if (selected || draft) points.forEach((position, index) => {
        const handle = marker(position, {
          title: (obstacle ? 'Obstacle vertex ' : 'Wall vertex ') + (index + 1), draggable: canEdit, clickable: canEdit, zIndex: 950,
          icon: { path: maps.SymbolPath.CIRCLE, scale: draft ? 11 : 13, fillColor: '#fff', fillOpacity: 1, strokeColor: tint, strokeWeight: 2 },
          label: { text: String(index + 1), color: tint, fontSize: '11px', fontWeight: '700' },
        });
        if (canEdit) {
          handle.addListener('dragstart', () => hideAnalysis());
          handle.addListener('drag', (event) => {
            const moved = barrier.points.map((item, i) => i === index ? normalizedMapPoint(point(event.latLng)) : item);
            shape?.setPath(moved);
          });
          handle.addListener('dragend', (event) => {
            const moved = barrier.points.map((item, i) => i === index ? normalizedMapPoint(point(event.latLng)) : { ...item });
            current.current.onBarrierChange?.(barrier.id, { points: moved });
          });
        }
      });
    };
    (props.barriers || []).forEach(barrier => draw(barrier));
    if (props.barrierDraft) draw(props.barrierDraft, true);
  }

  function render() {
    clearObjects(scene); scene = []; analysisLayers.clear();
    overlay?.setMap(null); overlay = null;
    const props = current.current;
    const plan = props.plan;
    map.setMapTypeId(props.mapStyle ? (props.mapStyle === 'satellite' ? 'satellite' : 'roadmap') : props.googleType || 'satellite');
    map.setOptions({ clickableIcons: !props.alignment && props.tool === 'select', draggableCursor: props.alignment ? (props.alignment.phase === 'preview' ? undefined : 'crosshair') : props.tool === 'select' ? undefined : 'crosshair' });
    if (plan.visible && plan.url) {
      overlay = new PlanOverlay(plan);
      overlay.setMap(map);
      const planHitArea = add(new maps.Polygon({ map, paths: planCorners(plan), fillOpacity: 0, strokeOpacity: 0, clickable: !props.alignment && props.tool === 'select', zIndex: -1 }));
      planHitArea.addListener('click', () => current.current.onSelect?.({ kind: 'plan' }));
      if (props.selected?.kind === 'plan') {
        const outline = add(new maps.Polygon({ map, paths: planCorners(plan), fillOpacity: 0, strokeColor: '#087f74', strokeWeight: 1.5, clickable: false }));
        if (!props.alignment && !plan.locked && props.tool === 'select') {
          const move = marker({ lat: plan.lat, lng: plan.lng }, { draggable: true, icon: glyphHandle(ArrowsOutCardinal), title: 'Move site plan', zIndex: 1000 });
          const resize = marker(planCorners(plan)[2], { draggable: true, icon: glyphHandle(ArrowsOutSimple), title: 'Resize site plan', zIndex: 1000 });
          move.addListener('drag', (event) => { overlay.plan = { ...plan, ...point(event.latLng) }; outline.setPath(planCorners(overlay.plan)); planHitArea.setPath(planCorners(overlay.plan)); resize.setPosition(planCorners(overlay.plan)[2]); overlay.draw(); });
          move.addListener('dragend', (event) => current.current.onPlanChange?.(point(event.latLng)));
          resize.addListener('drag', (event) => { overlay.plan = resizedPlan(plan, point(event.latLng)); outline.setPath(planCorners(overlay.plan)); planHitArea.setPath(planCorners(overlay.plan)); resize.setPosition(planCorners(overlay.plan)[2]); overlay.draw(); });
          resize.addListener('dragend', () => { resize.setPosition(planCorners(overlay.plan)[2]); current.current.onPlanChange?.({ width: overlay.plan.width, height: overlay.plan.height }); });
        }
      }
    }
    if (props.alignment) {
      renderAlignment(props);
      clearMeasure();
      return;
    }

    renderCoverage(props);
    polygonEditors(props).forEach(area => renderArea(props, area));
    renderBarriers(props);
    renderRoutes(props);
    for (const note of surveyPins(props)) {
      const { selected, title, clickable } = surveyPinStyle(props, note);
      const svg = renderToStaticMarkup(<NotePencil size={28} weight="duotone" color={selected ? '#734e25' : '#9b7745'}/>);
      const pin = marker(note.anchor, {
        title, clickable, zIndex: selected ? 850 : 600,
        icon: { url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg), scaledSize: new maps.Size(28, 28), anchor: new maps.Point(14, 14) },
      });
      if (clickable) pin.addListener('click', () => current.current.onSelect?.({ kind: 'survey', id: note.id }));
    }
    props.devices.forEach((device) => {
      if (props.visibleTypes?.[device.type] === false) return;
      const deviceSelected = props.selected?.kind === 'device' && props.selected.id === device.id;
      const selected = deviceSelected || props.surveyDeviceId === device.id;
      const tint = color[device.type] || color.camera;
      const item = marker({ lat: device.lat, lng: device.lng }, { draggable: props.tool === 'select', clickable: !['wall', 'obstacle', 'coverage-area', 'zone', 'survey'].includes(props.tool), title: `${device.id} — ${device.name}`, zIndex: selected ? 700 : 500, icon: { path: maps.SymbolPath.CIRCLE, scale: selected ? 17 : 15, fillColor: selected ? tint : '#fff', fillOpacity: 1, strokeColor: tint, strokeWeight: 2 }, label: { text: String(device.id), color: selected ? '#fff' : tint, fontSize: '10px', fontWeight: '600' } });
      item.addListener('click', () => current.current.onSelect?.({ kind: 'device', id: device.id }));
      item.addListener('dragstart', () => hideAnalysis(device.id));
      item.addListener('dragend', (event) => current.current.onDeviceChange?.(device.id, point(event.latLng)));
      if (deviceSelected && device.type === 'camera' && props.tool === 'select') {
        const aim = marker(destination(device, Number(device.bearing) || 0, Number(device.range) || 28), { icon: glyphHandle(Crosshair), draggable: true, title: 'Drag to aim camera', zIndex: 800 });
        aim.addListener('dragstart', () => hideAnalysis(device.id));
        aim.addListener('dragend', (event) => current.current.onDeviceChange?.(device.id, { bearing: Math.round(bearingBetween(device, point(event.latLng))) }));
      }
    });
    if (props.tool !== 'ruler') clearMeasure();
  }
  return {
    render, clearMeasure,
    zoomIn: () => map.setZoom(map.getZoom() + 1), zoomOut: () => map.setZoom(map.getZoom() - 1),
    fitPlan: () => { const plan = current.current.plan; if (!plan.url) { map.setCenter({ lat: plan.lat, lng: plan.lng }); map.setZoom(Math.min(map.getZoom(), 19)); return; } const bounds = new maps.LatLngBounds(); planCorners(plan).forEach((p) => bounds.extend(p)); map.fitBounds(bounds, 70); },
    fitArea: (points) => { const bounds = analysisAreaBounds(points); if (bounds) map.fitBounds({ south: bounds.south, north: bounds.north, west: normalizedMapPoint({ lat: 0, lng: bounds.west }).lng, east: normalizedMapPoint({ lat: 0, lng: bounds.east }).lng }, 30); },
    fitPlanForAlignment: () => { const bounds = new maps.LatLngBounds(); planCorners(current.current.alignment?.originalPlan || current.current.plan).forEach((p) => bounds.extend(p)); map.fitBounds(bounds, { top: 100, bottom: 260, left: 60, right: 60 }); },
    goTo: (lat, lng, zoom = 19) => { map.setCenter({ lat, lng }); map.setZoom(limit(zoom, 3, 22)); },
    getCenter: () => point(map.getCenter()),
    getView: () => ({ ...point(map.getCenter()), zoom: map.getZoom() }),
    destroy: () => { clearObjects(scene); clearMeasure(); overlay?.setMap(null); clickListener.remove(); maps.event.clearInstanceListeners(map); host.replaceChildren(); },
  };
}

export default function MapCanvas(props) {
  const host = useRef(null);
  const current = useRef(props);
  const engine = useRef(null);
  const viewport = useRef(null);
  const pendingArea = useRef(null);
  current.current = props;

  useEffect(() => {
    let disposed = false;
    const element = host.current;
    const loading = new AbortController();
    let googleFrame;
    const keydown = (event) => { if (event.key === 'Escape') { engine.current?.clearMeasure(); if (current.current.alignment && event.currentTarget !== window) current.current.onAlignmentCancel?.(); } };
    const pendingView = () => viewport.current ?? { lat: current.current.plan.lat, lng: current.current.plan.lng, zoom: 19 };
    current.current.onMapReady?.({
      zoomIn: () => { viewport.current = { ...pendingView(), zoom: limit(pendingView().zoom + 1, 3, 22) }; },
      zoomOut: () => { viewport.current = { ...pendingView(), zoom: limit(pendingView().zoom - 1, 3, 22) }; },
      fitArea: (points) => { const bounds = analysisAreaBounds(points); if (bounds) { pendingArea.current = bounds.path; viewport.current = { ...bounds.center, zoom: 19 }; } },
      fitPlan: () => { pendingArea.current = null; viewport.current = { lat: current.current.plan.lat, lng: current.current.plan.lng, zoom: 19 }; },
      fitPlanForAlignment: () => { pendingArea.current = null; const plan = current.current.alignment?.originalPlan || current.current.plan; viewport.current = { lat: plan.lat, lng: plan.lng, zoom: 19 }; },
      goTo: (lat, lng, zoom = 19) => { pendingArea.current = null; viewport.current = { lat, lng, zoom: limit(zoom, 3, 22) }; },
      getCenter: () => ({ lat: pendingView().lat, lng: pendingView().lng }),
    });
    const start = async () => {
      try {
        let instance;
        if (props.provider === 'google') {
          if (!props.googleKey?.trim()) throw new Error('Add a Google Maps API key to use Google Maps. OpenStreetMap is available without a key.');
          // A fresh owned frame makes key retries independent of a prior SDK/auth failure.
          googleFrame = document.createElement('iframe');
          googleFrame.title = 'Google Maps security site map';
          Object.assign(googleFrame.style, { position: 'absolute', inset: '0', width: '100%', height: '100%', border: '0' });
          element.appendChild(googleFrame);
          const frameDocument = googleFrame.contentDocument;
          frameDocument.open();
          frameDocument.write('<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body,#map{height:100%;width:100%;margin:0;padding:0;overflow:hidden}</style></head><body><div id="map"></div></body></html>');
          frameDocument.close();
          googleFrame.contentWindow.addEventListener('keydown', keydown);
          const maps = await loadGoogle(props.googleKey.trim(), googleFrame.contentWindow, loading.signal, (message) => current.current.onError?.(message));
          if (disposed) return;
          instance = makeGoogle(frameDocument.getElementById('map'), maps, current, viewport.current);
        } else instance = makeLeaflet(element, current, viewport.current);
        if (disposed) { instance.destroy(); return; }
        engine.current = instance;
        instance.render();
        if (pendingArea.current) { instance.fitArea(pendingArea.current); pendingArea.current = null; }
        current.current.onMapReady?.({ zoomIn: instance.zoomIn, zoomOut: instance.zoomOut, fitPlan: instance.fitPlan, fitArea: instance.fitArea, fitPlanForAlignment: instance.fitPlanForAlignment, goTo: instance.goTo, getCenter: instance.getCenter });
      } catch (error) { if (!disposed) current.current.onError?.(error.message || 'The map could not load.'); }
    };
    start();
    window.addEventListener('keydown', keydown);
    return () => {
      disposed = true;
      loading.abort();
      window.removeEventListener('keydown', keydown);
      if (engine.current) viewport.current = engine.current.getView();
      engine.current?.destroy(); engine.current = null;
      googleFrame?.remove();
    };
  }, [props.provider, props.googleKey]);

  useEffect(() => { engine.current?.render(); }, [props.plan, props.devices, props.visibleTypes, props.selected, props.tool, props.googleType, props.mapStyle, props.alignment, props.routes, props.routeDraft, props.barriers, props.barrierDraft, props.coverage, props.showCoverage, props.coverageArea, props.coverageAreaDraft, props.zones, props.zoneDraft, props.activeZoneId, props.zoneResult, props.surveyNotes, props.surveyDraft, props.surveyDeviceId, props.suspendCoverage]);

  return <div ref={host} className="physec-map-canvas" role="region" aria-label="Interactive security site map" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', background: '#e9ede5' }} />;
}
