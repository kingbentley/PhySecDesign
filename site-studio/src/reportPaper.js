export const REPORT_PAPERS = {
  letter: { width: 792, height: 612, label: 'US Letter' },
  a4: { width: 842, height: 595, label: 'A4' },
};

const PRINT_SCALE = 3;
const MARGIN = 32;
export const REPORT_INK = '#18352f';
export const REPORT_MUTED = '#526760';
export const REPORT_LINE = '#d9e3de';
export const REPORT_TEAL = '#086e62';

export function textStyle(context, size = 10, weight = 400, color = REPORT_INK) {
  context.font = weight + ' ' + size + 'px Arial, sans-serif';
  context.fillStyle = color;
  context.textAlign = 'left';
  context.textBaseline = 'top';
}

export function fitText(context, label, width) {
  const text = String(label);
  if (context.measureText(text).width <= width) return text;
  const characters = Array.from(text);
  let low = 0, high = characters.length;
  while (low < high) {
    const middle = Math.ceil((low + high) / 2);
    if (context.measureText(characters.slice(0, middle).join('') + '…').width <= width) low = middle;
    else high = middle - 1;
  }
  return characters.slice(0, low).join('') + '…';
}

export function wrapText(context, content, maxWidth) {
  const lines = [];
  for (const paragraph of String(content ?? '').split(/\r?\n/)) {
    let line = '';
    for (let word of paragraph.trim().split(/\s+/u).filter(Boolean)) {
      if (line && context.measureText(line + ' ' + word).width <= maxWidth) {
        line += ' ' + word;
        continue;
      }
      if (line) lines.push(line);
      while (context.measureText(word).width > maxWidth && word.length > 1) {
        const characters = Array.from(word);
        let length = 1;
        while (length < characters.length && context.measureText(characters.slice(0, length + 1).join('')).width <= maxWidth) length++;
        lines.push(characters.slice(0, length).join(''));
        word = characters.slice(length).join('');
      }
      line = word;
    }
    lines.push(line);
  }
  return lines;
}

export function rule(context, x1, y, x2, color = REPORT_LINE) {
  context.fillStyle = color;
  context.fillRect(x1, y, x2 - x1, 0.75);
}

export function containedImage(context, image, x, y, width, height) {
  const scale = Math.min(width / image.width, height / image.height);
  const w = image.width * scale, h = image.height * scale;
  context.drawImage(image, x + (width - w) / 2, y + (height - h) / 2, w, h);
}

export function createPaper(paper, projectName, floorLabel, title, number, stamp) {
  const canvas = document.createElement('canvas');
  canvas.width = paper.width * PRINT_SCALE;
  canvas.height = paper.height * PRINT_SCALE;
  const context = canvas.getContext('2d', { alpha: false });
  if (!context) throw new Error('The browser could not prepare a print page.');
  context.scale(PRINT_SCALE, PRINT_SCALE);
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, paper.width, paper.height);
  context.fillStyle = REPORT_TEAL;
  context.fillRect(MARGIN, 25, 18, 2);
  textStyle(context, 9, 700, REPORT_TEAL);
  context.fillText('PHYSEC SITE STUDIO', MARGIN + 25, 21);
  textStyle(context, 9, 400, REPORT_MUTED);
  const printedProject = fitText(context, projectName, paper.width - 235);
  context.fillText(printedProject, paper.width - MARGIN - context.measureText(printedProject).width, 21);
  textStyle(context, 21, 700);
  context.fillText(fitText(context, title, paper.width - 2 * MARGIN), MARGIN, 38);
  textStyle(context, 10, 400, REPORT_MUTED);
  context.fillText(fitText(context, floorLabel, paper.width - 2 * MARGIN), MARGIN, 65);
  rule(context, MARGIN, 83, paper.width - MARGIN);

  const footer = paper.height - 29;
  rule(context, MARGIN, footer - 7, paper.width - MARGIN);
  textStyle(context, 8, 400, REPORT_MUTED);
  context.fillText('Concept design  /  ' + stamp, MARGIN, footer);
  const pageText = 'Page ' + number;
  context.fillText(pageText, paper.width - MARGIN - context.measureText(pageText).width, footer);
  return {
    canvas, context, title, floorLabel, x: MARGIN, width: paper.width - 2 * MARGIN,
    top: 99, bottom: footer - 15,
  };
}

export async function encodePaper(page) {
  const { canvas } = page;
  const pixelWidth = canvas.width, pixelHeight = canvas.height;
  try {
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.94));
    if (!blob || blob.type !== 'image/jpeg') throw new Error('A report page could not be converted to PDF.');
    return { jpeg: new Uint8Array(await blob.arrayBuffer()), pixelWidth, pixelHeight, title: page.title, floorLabel: page.floorLabel };
  } finally {
    canvas.width = 1;
    canvas.height = 1;
  }
}
