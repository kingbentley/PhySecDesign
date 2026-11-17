import React from 'react';
import { MapTrifold } from '@phosphor-icons/react';
import { routePoints } from './cables.js';
import './revisions.css';

export default function RevisionLayout({ entry, floor, frame, changes, overlay, svgProps }) {
  const { project, drawing, marker, viewBox } = frame;
  const plan = floor?.plan;
  const image = plan?.visible && plan.url ? drawing(plan) : null;
  const points = positions => positions.map(point => {
    const { x, y } = project(point);
    return `${x},${y}`;
  }).join(' ');
  return <figure className="revision-layout">
    <figcaption><strong>{entry.name}</strong><span>{floor
      ? `${floor.devices.length} ${floor.devices.length === 1 ? 'device' : 'devices'} · ${floor.routes.length} cable ${floor.routes.length === 1 ? 'route' : 'routes'}`
      : 'Floor absent in this design'}</span></figcaption>
    {floor ? <svg viewBox={viewBox} role="img" aria-label={`${entry.name} floor layout`} {...svgProps}>
      <title>{entry.name} floor layout</title>
      {image && <image href={plan.url} x={image.x - image.width / 2} y={image.y - image.height / 2}
        width={image.width} height={image.height} opacity={plan.opacity} preserveAspectRatio="none"
        transform={`rotate(${plan.rotation} ${image.x} ${image.y})`}/>}
      {floor.zones?.map(zone => <polygon key={zone.id} className="revision-zone-shape"
        points={points(zone.points)} vectorEffect="non-scaling-stroke"><title>{zone.name}</title></polygon>)}
      {floor.barriers?.map(barrier => {
        const Shape = barrier.kind === 'wall' ? 'polyline' : 'polygon';
        return <Shape key={barrier.id} className="revision-barrier-shape" points={points(barrier.points)}
          fill={barrier.kind === 'wall' ? 'none' : '#af5e3733'} opacity={barrier.enabled ? 1 : 0.55}
          vectorEffect="non-scaling-stroke"><title>{barrier.name}</title></Shape>;
      })}
      {floor.routes.map(route => <polyline key={route.id} className="revision-route-shape" points={points(routePoints(route, floor.devices))}
        vectorEffect="non-scaling-stroke"><title>{route.name}</title></polyline>)}
      {floor.devices.map(device => {
        const { x, y } = project(device);
        const change = changes?.get(device.id);
        const aim = device.type === 'camera';
        return <g key={device.id} className={`revision-device ${change?.toLowerCase() ?? ''}`} transform={`translate(${x} ${y})`}>
          <title>{device.id + ' — ' + device.name + (change ? ` · ${change}` : '')}</title>
          {aim && <path d={`M${-marker * 0.9},0 0,${-marker * 4} ${marker * 0.9},0Z`} transform={`rotate(${device.bearing})`}/>}
          <circle r={marker * (aim ? 1.25 : 1)} vectorEffect="non-scaling-stroke"/>
          <text x={marker * 1.7} y={marker} fontSize={marker * 2.6}>{device.id}</text>
        </g>;
      })}
      {overlay}
    </svg> : <div className="revision-layout-empty"><MapTrifold size={30}/>Floor absent</div>}
  </figure>;
}
