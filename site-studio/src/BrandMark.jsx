// The PhySec mark: a room outline with a camera in its corner and its field of view.
// Source files and usage notes are in ../design-references/logo/. It draws in
// currentColor, so set the colour with CSS. At 32px and below it uses the heavier
// small version, whose frame lines up with whole pixels.
export function BrandMark({ size = 30, className, title }) {
  const small = size <= 32;
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      width={size}
      height={size}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      focusable="false"
    >
      {small ? (
        <>
          <rect x="8" y="8" width="48" height="48" rx="12" fill="none" stroke="currentColor" strokeWidth="8" />
          <path d="M20 20 L47.88 27.99 A29 29 0 0 1 27.99 47.88 Z" fill="currentColor" opacity=".47" />
          <circle cx="20" cy="20" r="5.5" fill="currentColor" />
        </>
      ) : (
        <>
          <rect x="7" y="7" width="50" height="50" rx="11" fill="none" stroke="currentColor" strokeWidth="5.5" />
          <path d="M18 18 L48.43 27.89 A32 32 0 0 1 27.89 48.43 Z" fill="currentColor" opacity=".35" />
          <circle cx="18" cy="18" r="5.2" fill="currentColor" />
        </>
      )}
    </svg>
  );
}
