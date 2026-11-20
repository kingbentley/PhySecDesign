import { useId } from 'react';

// The PhySec logo: a survey clipboard with a checklist and plan lines, and a dome camera
// in front of it. Generated from the files in ../design-references/logo/; change them
// together. `size` is the height. Below 48px it draws the simplified version (clipboard,
// one tick and the camera), because the plan lines, crosses and light rays blur.
export function BrandMark({ size = 32, className, title }) {
  const id = useId();
  const full = size >= 48;
  return (
    <svg
      className={className}
      viewBox={full ? '0 0 304 250' : '0 0 276 250'}
      width={(size * (full ? 304 : 276)) / 250}
      height={size}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      focusable="false"
    >
      {full ? (
        <>
          <defs>
          <linearGradient id={`${id}cg`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#5fb184"/>
          <stop offset="1" stopColor="#2f9461"/>
          </linearGradient>
          <radialGradient id={`${id}rg`} gradientUnits="userSpaceOnUse" cx="198" cy="148" r="104">
          <stop offset=".45" stopColor="#5fb184" stopOpacity=".5"/>
          <stop offset="1" stopColor="#5fb184" stopOpacity="0"/>
          </radialGradient>
          </defs>
          <circle cx="100" cy="24" r="14" fill="#0b6f72"/>
          <circle cx="100" cy="22" r="5" fill="#fff"/>
          <rect x="18" y="46" width="164" height="184" rx="16" fill="#fff" stroke="#0b6f72" strokeWidth="12"/>
          <path d="M64 30 H100 V62 H71 Q64 62 64 55 Z" fill="#0b6f72"/>
          <path d="M100 30 H136 V55 Q136 62 129 62 H100 Z" fill="#135560"/>
          <g fill="none" stroke="#0b6f72" strokeWidth="2.6" strokeLinecap="round">
          <path d="M40 92 H166 M60 78 V214 M40 204 H166 M112 78 V104 M52 122 H60 M52 152 H60 M52 182 H60 M86 198 V210 M112 198 V210 M138 198 V210"/>
          </g>
          <g fill="none" strokeWidth="7.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M77 109 L99 131 M99 109 L77 131" stroke="#17324d"/>
          <path d="M77 141 L99 163 M99 141 L77 163" stroke="#5d8f7c"/>
          <path d="M76 181 L85 191 L102 171" stroke="#2f9461"/>
          </g>
          <g fill={`url(#${id}rg)`}>
          <path d="M198 148 L299.33 171.39 A104 104 0 0 1 287.15 201.56 Z"/>
          <path d="M198 148 L268.93 224.06 A104 104 0 0 1 241.95 242.26 Z"/>
          <path d="M198 148 L214.27 250.72 A104 104 0 0 1 181.73 250.72 Z"/>
          <path d="M198 148 L154.05 242.26 A104 104 0 0 1 127.07 224.06 Z"/>
          <path d="M198 148 L108.85 201.56 A104 104 0 0 1 96.67 171.39 Z"/>
          </g>
          <g transform="rotate(5 198 140)">
          <g fill="#fff" stroke="#fff" strokeWidth="7" strokeLinejoin="round">
          <path d="M132 140 V116 A66 15 0 0 1 264 116 V140 A66 15 0 0 0 132 140 Z"/>
          <ellipse cx="198" cy="140" rx="66" ry="15"/>
          <path d="M148 143 A50 11 0 0 1 248 143 A50 55 0 0 1 148 143 Z"/>
          </g>
          <path d="M132 140 V116 A66 15 0 0 1 264 116 V140 A66 15 0 0 0 132 140 Z" fill={`url(#${id}cg)`}/>
          <path d="M132 123 V116 A66 15 0 0 1 264 116 V123 A66 15 0 0 0 132 123 Z" fill="#fff" opacity=".22"/>
          <ellipse cx="198" cy="140" rx="66" ry="15" fill="#17324d"/>
          <circle cx="154" cy="119" r="3" fill="#fff" opacity=".9"/>
          <circle cx="242" cy="119" r="3" fill="#fff" opacity=".9"/>
          <path d="M148 143 A50 11 0 0 1 248 143 A50 55 0 0 1 148 143 Z" fill="#135560"/>
          <path d="M204 132 A50 11 0 0 1 248 143 A50 55 0 0 1 204 198 Z" fill="#17324d" opacity=".5"/>
          <path d="M158 150 A44 48 0 0 0 168 178" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" opacity=".35"/>
          <circle cx="195" cy="169" r="20" fill="#17324d" stroke="#8fd0ad" strokeWidth="4"/>
          <circle cx="195" cy="169" r="11" fill="#0b6f72"/>
          <circle cx="195" cy="169" r="5.2" fill="#17324d"/>
          <circle cx="188" cy="162" r="3.5" fill="#fff"/>
          </g>
        </>
      ) : (
        <>
          <circle cx="100" cy="24" r="16" fill="#0b6f72"/>
          <rect x="22" y="50" width="156" height="176" rx="18" fill="#fff" stroke="#0b6f72" strokeWidth="20"/>
          <rect x="62" y="28" width="76" height="38" rx="8" fill="#0b6f72"/>
          <path d="M54 132 L74 154 L104 112" fill="none" stroke="#2f9461" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round"/>
          <g transform="rotate(5 198 140)">
          <g fill="#fff" stroke="#fff" strokeWidth="13" strokeLinejoin="round">
          <path d="M132 140 V116 A66 15 0 0 1 264 116 V140 A66 15 0 0 0 132 140 Z"/>
          <ellipse cx="198" cy="140" rx="66" ry="15"/>
          <path d="M148 143 A50 11 0 0 1 248 143 A50 55 0 0 1 148 143 Z"/>
          </g>
          <path d="M148 143 A50 11 0 0 1 248 143 A50 55 0 0 1 148 143 Z" fill="#17324d"/>
          <path d="M132 140 V116 A66 15 0 0 1 264 116 V140 A66 15 0 0 0 132 140 Z" fill="#2f9461"/>
          <ellipse cx="198" cy="140" rx="66" ry="15" fill="#2f9461"/>
          <path d="M152 145 A46 9 0 0 1 244 145 A46 12 0 0 1 152 145Z" fill="#17324d"/>
          <circle cx="195" cy="169" r="16" fill="#8fd0ad"/>
          <circle cx="195" cy="169" r="6.5" fill="#17324d"/>
          </g>
        </>
      )}
    </svg>
  );
}
