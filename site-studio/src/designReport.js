import { normalizeProject } from './projectModel.js';
import { CABLE_TYPES, routeBillableMeters, routeLengthMeters } from './cables.js';
import { DEVICE_TYPES } from './catalog.js';
import { ZONE_TYPES, formatZonePercent } from './securityZones.js';
import { packPdfPages } from './rasterPdf.js';
import { drawReportPlan, refId } from './reportPlan.js';
import {
  containedImage, createPaper, encodePaper, fitText, REPORT_LINE, REPORT_MUTED,
  REPORT_PAPERS, REPORT_TEAL, rule, textStyle, wrapText,
} from './reportPaper.js';

const MAX_REPORT_BYTES = 80 * 1024 * 1024;
const LINE_HEIGHT = 13;
const metres = value => Number(value).toFixed(1) + ' m';

function reportBook(paper, project, signal, onProgress) {
  const stamp = new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date());
  const pages = [];
  const warnings = [];
  let page, bytes = 0;

  async function finishPage() {
    if (!page) return;
    signal?.throwIfAborted();
    const encoded = await encodePaper(page);
    signal?.throwIfAborted();
    page = null;
    bytes += encoded.jpeg.byteLength;
    if (bytes > MAX_REPORT_BYTES) throw new Error('This report is too large. Export one floor at a time or omit survey photos.');
    pages.push(encoded);
    onProgress?.(pages.length);
    // Allow the browser to paint and handle cancellation between pages.
    await new Promise(resolve => setTimeout(resolve, 0));
  }

  return {
    warnings,
    async start(title, floorLabel) {
      await finishPage();
      signal?.throwIfAborted();
      page = createPaper(paper, project.name, floorLabel, title, pages.length + 1, stamp);
      return page;
    },
    async image(url, label) {
      try {
        signal?.throwIfAborted();
        const response = await fetch(url, { signal });
        if (!response.ok) throw new Error('Image could not be read.');
        return await createImageBitmap(await response.blob());
      } catch (error) {
        if (signal?.aborted) throw error;
        warnings.push(label + ' could not be rendered.');
        return null;
      }
    },
    async export() {
      await finishPage();
      signal?.throwIfAborted();
      return { blob: packPdfPages(pages, paper.width, paper.height), pages, warnings };
    },
  };
}

function floorTitle(project, floor) {
  return (project.buildings.find(building => building.id === floor.buildingId)?.name ?? 'Building') + ' / ' + floor.name;
}

function columnsFor(page, columns) {
  let x = page.x;
  return columns.map(([label, fraction]) => {
    const width = page.width * fraction;
    const column = { label, x, width };
    x += width;
    return column;
  });
}

async function drawTable(book, layout, floorLabel, title, columns, rows) {
  let { page, y } = layout;
  let resolved = columnsFor(page, columns);

  function heading(continued) {
    textStyle(page.context, 12, 700, REPORT_TEAL);
    page.context.fillText(title + (continued ? ' (continued)' : ''), page.x, y);
    y += 19;
    if (!rows.length) {
      textStyle(page.context, 9, 400, REPORT_MUTED);
      page.context.fillText('No entries on this floor.', page.x, y);
      y += 22;
      return;
    }
    page.context.fillStyle = '#edf5f1';
    page.context.fillRect(page.x, y, page.width, 21);
    textStyle(page.context, 8.5, 700, REPORT_TEAL);
    resolved.forEach(column => page.context.fillText(column.label, column.x + 6, y + 6));
    y += 21;
  }

  async function nextPage() {
    page = await book.start('Equipment & cable schedules', floorLabel);
    resolved = columnsFor(page, columns);
    y = page.top;
  }

  if (y + 64 > page.bottom) await nextPage();
  heading(false);
  for (const [index, row] of rows.entries()) {
    textStyle(page.context, 9);
    const cells = row.map((value, column) => wrapText(page.context, value, resolved[column].width - 12));
    const height = Math.max(...cells.map(cell => cell.length));
    let line = 0;
    while (line < height) {
      const available = Math.floor((page.bottom - y - 10) / LINE_HEIGHT);
      if (available < 1 || (line === 0 && height > available && height <= 8)) {
        await nextPage();
        heading(true);
        continue;
      }
      const count = Math.min(available, height - line);
      const rowHeight = 10 + count * LINE_HEIGHT;
      if (index % 2 === 1) {
        page.context.fillStyle = '#f7faf8';
        page.context.fillRect(page.x, y, page.width, rowHeight);
      }
      cells.forEach((cell, column) => {
        textStyle(page.context, 9, column === 0 ? 700 : 400);
        const lines = cell.slice(line, line + count);
        if (column === 0 && line > 0 && !lines.length) lines.push(fitText(page.context, row[0] + ' (cont.)', resolved[0].width - 12));
        lines.forEach((value, offset) => page.context.fillText(value, resolved[column].x + 6, y + 6 + offset * LINE_HEIGHT));
      });
      y += rowHeight;
      rule(page.context, page.x, y, page.x + page.width);
      line += count;
    }
  }
  layout.page = page;
  layout.y = y + 18;
}

async function drawSchedules(book, floor, label) {
  const page = await book.start('Equipment & cable schedules', label);
  const layout = { page, y: page.top };
  await drawTable(book, layout, label, 'Equipment', [
    ['ID', 0.10], ['Type', 0.15], ['Name / model', 0.28], ['Mounting / installation notes', 0.35], ['Status', 0.12],
  ], floor.devices.map(device => [
    device.id, DEVICE_TYPES[device.type].singular,
    [device.name, device.model].filter(Boolean).join('\n'),
    [[device.mounting, device.type === 'camera' ? metres(device.height) + ' high' : ''].filter(Boolean).join(' · '), device.notes].filter(Boolean).join('\n'),
    device.status === 'existing' ? 'Existing' : 'Proposed',
  ]));
  await drawTable(book, layout, label, 'Cable routes', [
    ['Ref', 0.075], ['Route', 0.23], ['Endpoints', 0.23], ['Cable', 0.16],
    ['Drawn', 0.10], ['Slack', 0.085], ['Planned', 0.12],
  ], floor.routes.map((route, index) => [
    refId('R', index), route.name, route.fromDeviceId + ' → ' + route.toDeviceId,
    CABLE_TYPES[route.cableType]?.label ?? route.cableType,
    metres(routeLengthMeters(route, floor.devices)), route.slackPercent + '%',
    metres(routeBillableMeters(route, floor.devices)),
  ]));
  if (floor.routes.length) {
    if (layout.y + 18 > layout.page.bottom) {
      layout.page = await book.start('Equipment & cable schedules', label);
      layout.y = layout.page.top;
    }
    textStyle(layout.page.context, 8, 400, REPORT_MUTED);
    layout.page.context.fillText('Cable lengths use the drawn horizontal path. Planned length includes the entered slack.', layout.page.x, layout.y - 8);
    layout.y += 13;
  }
  if (floor.zones.length) await drawTable(book, layout, label, 'Security zones', [
    ['Ref', 0.12], ['Zone', 0.39], ['Type', 0.22], ['Coverage requirement', 0.27],
  ], floor.zones.map((zone, index) => [
    refId('Z', index), zone.name, ZONE_TYPES[zone.type],
    zone.targetLevel ? zone.targetLevel[0].toUpperCase() + zone.targetLevel.slice(1) + ' across ' + formatZonePercent(zone.targetPercent) : 'No requirement',
  ]));
}

async function drawSurvey(book, floor, floorLabel, includePhotos) {
  if (!floor.surveyNotes.length) return;
  let page = await book.start('Site survey notes', floorLabel);
  let y = page.top;
  for (const [index, note] of floor.surveyNotes.entries()) {
    const reference = refId('S', index);
    const title = reference + '  ' + note.title;
    const device = note.anchor.kind === 'device'
      ? floor.devices.find(item => item.id === note.anchor.deviceId)
      : null;
    const anchor = device ? device.id + ' · ' + device.name
      : 'Map pin · ' + note.anchor.lat.toFixed(6) + ', ' + note.anchor.lng.toFixed(6);

    function drawHeading(continued) {
      textStyle(page.context, 13, 700, REPORT_TEAL);
      page.context.fillText(fitText(page.context, title + (continued ? ' (continued)' : ''), page.width), page.x, y);
      y += 18;
      textStyle(page.context, 9, 400, REPORT_MUTED);
      page.context.fillText(fitText(page.context, anchor, page.width), page.x, y);
      y += 18;
    }

    async function nextPage(continued) {
      page = await book.start('Site survey notes', floorLabel);
      y = page.top;
      drawHeading(continued);
    }

    async function paragraph(value, size = 10, weight = 400) {
      textStyle(page.context, size, weight);
      const lines = wrapText(page.context, value, page.width);
      for (const line of lines) {
        if (y + LINE_HEIGHT > page.bottom) await nextPage(true);
        textStyle(page.context, size, weight);
        page.context.fillText(line, page.x, y);
        y += LINE_HEIGHT;
      }
      y += 4;
    }

    if (y + 72 > page.bottom) await nextPage(false);
    else drawHeading(false);
    if (note.notes) await paragraph(note.notes);
    if (note.measurements.length) {
      if (y + 2 * LINE_HEIGHT > page.bottom) await nextPage(true);
      await paragraph('Measurements', 9, 700);
      for (const measurement of note.measurements) await paragraph(measurement.label + ': ' + measurement.value + ' ' + measurement.unit, 9);
    }
    if (note.photos.length && !includePhotos) await paragraph(note.photos.length + ' photo(s) omitted from this export.', 9);
    if (includePhotos) {
      const perRow = 3, gap = 12;
      const width = (page.width - gap * (perRow - 1)) / perRow;
      const height = 145, rowHeight = height + 22;
      for (let start = 0; start < note.photos.length; start += perRow) {
        if (y + rowHeight > page.bottom) await nextPage(true);
        for (const [column, photo] of note.photos.slice(start, start + perRow).entries()) {
          const x = page.x + column * (width + gap);
          const image = await book.image(photo.dataUrl, photo.name);
          page.context.fillStyle = '#f1f5f3';
          page.context.fillRect(x, y, width, height);
          if (image) {
            try { containedImage(page.context, image, x + 3, y + 3, width - 6, height - 6); }
            finally { image.close(); }
          } else {
            textStyle(page.context, 9, 400, REPORT_MUTED);
            page.context.fillText('Photo unavailable', x + 8, y + 8);
          }
          textStyle(page.context, 8, 400, REPORT_MUTED);
          page.context.fillText(fitText(page.context, photo.name, width), x, y + height + 6);
        }
        y += rowHeight;
      }
    }
    if (y + 8 < page.bottom && index < floor.surveyNotes.length - 1) rule(page.context, page.x, y + 3, page.x + page.width, REPORT_LINE);
    y += 17;
  }
}

export async function buildDesignReport(input, options, { signal, onProgress } = {}) {
  const project = normalizeProject(input, { allowLocalAssets: true });
  const paper = REPORT_PAPERS[options.paper] ?? REPORT_PAPERS.letter;
  const floorIds = new Set(options.floorIds);
  const floors = project.floors.filter(floor => floorIds.has(floor.id));
  if (!floors.length) throw new Error('Select at least one floor to export.');
  const book = reportBook(paper, project, signal, onProgress);
  for (const floor of floors) {
    const label = floorTitle(project, floor);
    const page = await book.start('Labeled floor plan', label);
    const image = floor.plan.url ? await book.image(floor.plan.url, label + ' drawing') : null;
    try {
      drawReportPlan(page, floor, image, options.coverage);
    } finally {
      image?.close();
    }
    await drawSchedules(book, floor, label);
    await drawSurvey(book, floor, label, options.includePhotos);
  }
  return book.export();
}
