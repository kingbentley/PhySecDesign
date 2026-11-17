import React from 'react';
import { detectableArea, DORI_BANDS } from './dori.js';
import './dori.css';

const areaFormat = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 });
const percentFormat = new Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: 1 });
const bandLabel = (band, combined) => band.minimum === null && !combined ? 'Blocked' : band.label;

export function CoverageStyleControl({ dori, onChange }) {
  return <div className="coverage-style-control" role="group" aria-label="Coverage overlay">
    <button type="button" aria-pressed={!dori} onClick={() => onChange(false)}>Visibility</button>
    <button type="button" aria-pressed={dori} onClick={() => onChange(true)}>DORI</button>
  </div>;
}

export function DoriLegend({ combined }) {
  return <div className="coverage-map-legend dori-map-legend">
    {DORI_BANDS.slice().reverse().map(band => <span key={band.label}>
      <i style={{ backgroundColor: band.color }}/>{bandLabel(band, combined)}
    </span>)}
    {!combined && <span><i className="dori-near-key"/>Near blind (approx.)</span>}
  </div>;
}

export function DoriBreakdown({ bands, area, combined = false }) {
  if (!bands || !(area > 0)) return null;
  return <section className="dori-breakdown" aria-label="DORI area breakdown">
    <div className="dori-summary">
      <span>Detect or better</span>
      <strong>{percentFormat.format(detectableArea(bands) / area)}</strong>
    </div>
    <p>{combined ? 'Best level from any one camera at each point in the analysis area.' : 'Best level at each point in this camera’s footprint.'}</p>
    <table aria-label="Area by highest DORI level">
      <thead><tr><th scope="col">Highest level</th><th scope="col">m²</th><th scope="col">Area</th></tr></thead>
      <tbody>{bands.slice().reverse().map(band => <tr key={band.label}>
        <th scope="row">
          <span className="dori-swatch" style={{ backgroundColor: band.color }}/>
          <span>{bandLabel(band, combined)}{band.minimum > 0 && <small>≥ {band.minimum} px/m</small>}</span>
        </th>
        <td>{areaFormat.format(band.area)}</td>
        <td>{percentFormat.format(band.area / area)}</td>
      </tr>)}</tbody>
    </table>
    <p className="dori-footnote">
      Pixel density estimates at the target height use the <a href="https://whitepapers.axis.com/en-us/pixel-density-based-on-iec-62676-4-2014" target="_blank" rel="noreferrer">IEC 62676-4:2014 DORI thresholds</a>.
      Verify detail in live footage, where face angle, lighting and compression affect results.
    </p>
  </section>;
}
