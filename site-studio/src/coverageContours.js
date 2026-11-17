// Display mesh. The original samples still supply the analysis totals.
// Adjacent triangles share the same edge crossings, so their fills meet.
const midpoint = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

export function coverageContours({ bounds, columns, rows, cellSize, samples, classify, write, refinementBudget }) {
  const stride = columns + 1;
  const cornerCount = stride * (rows + 1);
  const nodeCount = cornerCount + columns * rows;
  const xAt = column => column === columns ? bounds.right : bounds.left + column * cellSize;
  const yAt = row => row === rows ? bounds.top : bounds.bottom + row * cellSize;
  const corners = Array.from({ length: cornerCount }, (_, id) => {
    const point = { x: xAt(id % stride), y: yAt(Math.floor(id / stride)) };
    return { id, point, band: classify(point) };
  });
  const crossings = new Map();
  let remaining = refinementBudget;

  function crossing(a, b) {
    const key = Math.min(a.id, b.id) * nodeCount + Math.max(a.id, b.id);
    if (crossings.has(key)) return crossings.get(key);
    let start = a.point;
    let end = b.point;
    // Localize the transition without assuming sample labels form a scalar.
    // At a third band or at the budget limit, interpolate within the bracket.
    for (let step = 0; step < 6 && remaining > 0; step++) {
      const point = midpoint(start, end);
      remaining--;
      const band = classify(point);
      if (band === a.band) start = point;
      else if (band === b.band) end = point;
      else break;
    }
    const point = midpoint(start, end);
    crossings.set(key, point);
    return point;
  }

  function splitTriangle(vertices) {
    const bands = new Set(vertices.map(vertex => vertex.band));
    if (bands.size === 1) {
      write(vertices[0].band, vertices.map(vertex => vertex.point));
      return;
    }
    const edges = vertices.map((a, index) => {
      const b = vertices[(index + 1) % 3];
      return a.band === b.band ? null : crossing(a, b);
    });
    if (bands.size === 3) {
      // Use a single junction shared by all three regions at a mixed vertex.
      const junction = {
        x: (edges[0].x + edges[1].x + edges[2].x) / 3,
        y: (edges[0].y + edges[1].y + edges[2].y) / 3,
      };
      vertices.forEach((vertex, index) => write(vertex.band, [
        vertex.point, edges[index], junction, edges[(index + 2) % 3],
      ]));
      return;
    }
    for (const band of bands) {
      const polygon = [];
      vertices.forEach((vertex, index) => {
        if (vertex.band === band) polygon.push(vertex.point);
        if (edges[index]) polygon.push(edges[index]);
      });
      write(band, polygon);
    }
  }

  for (let row = 0; row < rows; row++) {
    let run = null;
    const finishRun = column => {
      if (!run) return;
      write(run.band, [
        { x: xAt(run.start), y: yAt(row) }, { x: xAt(column), y: yAt(row) },
        { x: xAt(column), y: yAt(row + 1) }, { x: xAt(run.start), y: yAt(row + 1) },
      ]);
      run = null;
    };
    for (let column = 0; column < columns; column++) {
      const id = row * stride + column;
      const cell = row * columns + column;
      const vertices = [corners[id], corners[id + 1], corners[id + stride + 1], corners[id + stride]];
      const point = midpoint(vertices[0].point, vertices[2].point);
      const band = samples[cell] >= 0 ? samples[cell] : classify(point);
      if (vertices.every(vertex => vertex.band === band)) {
        if (run?.band !== band) {
          finishRun(column);
          run = { band, start: column };
        }
        continue;
      }
      finishRun(column);
      const center = { id: cornerCount + cell, point, band };
      vertices.forEach((vertex, index) => splitTriangle([vertex, vertices[(index + 1) % 4], center]));
    }
    finishRun(columns);
  }
}
