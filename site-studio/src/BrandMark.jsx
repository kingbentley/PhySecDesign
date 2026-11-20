import { useId } from 'react';

// The PhySec shield: the site's map on the left, coverage rings on the right, and a
// map pin holding a camera lens. Source files are in ../design-references/logo/.
// `size` is the height; the mark is 5:6. Below 48px it draws the simplified version
// (two-tone shield, pin and lens), because the grid, rings and lens blades blur.
const SHIELD = 'M100 8 C78 28 44 40 12 44 C8 110 22 180 100 232 C178 180 192 110 188 44 C156 40 122 28 100 8 Z';
const INSET = 'translate(100 120) scale(.82) translate(-100 -120)';

export function BrandMark({ size = 30, className, title }) {
  const id = useId();
  const full = size >= 48;
  const ref = name => `url(#${id}${name})`;
  return (
    <svg
      className={className}
      viewBox="0 0 200 240"
      width={(size * 5) / 6}
      height={size}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      focusable="false"
    >
      {full ? (
        <>
          <defs>
            <linearGradient id={`${id}g`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#4a9d6a" />
              <stop offset="1" stopColor="#1f6f5c" />
            </linearGradient>
            <clipPath id={`${id}s`}><path d={SHIELD} /></clipPath>
            <clipPath id={`${id}i`}><path d={SHIELD} transform={INSET} /></clipPath>
            <clipPath id={`${id}l`}><rect x="0" y="0" width="100" height="240" /></clipPath>
            <clipPath id={`${id}r`}><rect x="100" y="0" width="100" height="240" /></clipPath>
          </defs>
          <g clipPath={ref('s')}>
            <rect x="0" y="0" width="100" height="240" fill="#0b6f72" />
            <rect x="100" y="0" width="100" height="240" fill="#1d3557" />
          </g>
          <g clipPath={ref('r')}><path d={SHIELD} transform={INSET} fill={ref('g')} /></g>
          <g clipPath={ref('l')}>
            <g clipPath={ref('i')}>
              <path d="M46 0 V240 M72 0 V240 M0 74 H110 M0 100 H110 M0 162 H110 M0 190 H110" fill="none" stroke="#fff" strokeWidth="3.2" transform="rotate(-7 100 120)" />
            </g>
            <path d={SHIELD} transform={INSET} fill="none" stroke="#fff" strokeWidth="5" />
          </g>
          <path d="M100 0 V240 M0 126 H200" stroke="#fff" strokeWidth="5" clipPath={ref('s')} />
          <g clipPath={ref('r')}>
            <g clipPath={ref('i')} fill="none" stroke="#fff" strokeWidth="3.6">
              <circle cx="100" cy="118" r="54" opacity=".95" />
              <circle cx="100" cy="118" r="70" opacity=".6" />
              <circle cx="100" cy="118" r="86" opacity=".32" />
            </g>
          </g>
          <path d="M100 184 C87 166 62 148 62 118 A38 38 0 0 1 138 118 C138 148 113 166 100 184 Z" fill="#0b6f72" stroke="#fff" strokeWidth="6" strokeLinejoin="round" />
          <circle cx="100" cy="118" r="25" fill="#17324d" stroke="#4a9d6a" strokeWidth="3.5" />
          <path d="M109 118 L112.8 135.9 M104.5 125.79 L90.9 138.03 M95.5 125.79 L78.1 120.13 M91 118 L87.2 100.1 M95.5 110.21 L109.1 97.97 M104.5 110.21 L121.9 115.87" stroke="#4a9d6a" strokeWidth="2.6" strokeLinecap="round" />
          <circle cx="100" cy="118" r="8.5" fill="#fff" />
        </>
      ) : (
        <>
          <path d={SHIELD} fill="#1f6f5c" />
          <path d="M100 8 C78 28 44 40 12 44 C8 110 22 180 100 232 Z" fill="#0b6f72" />
          <path d="M100 192 C84 170 54 150 54 114 A46 46 0 0 1 146 114 C146 150 116 170 100 192 Z" fill="#fff" />
          <circle cx="100" cy="114" r="22" fill="#17324d" />
        </>
      )}
    </svg>
  );
}
