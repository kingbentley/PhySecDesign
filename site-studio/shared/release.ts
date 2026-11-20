// The release this build belongs to and the data format it reads and writes.
//
// The release version comes from package.json through a Vite `define` (see vite.config.mjs and
// server-tests/vitest.config.mjs). A build without the define reports a development release, so
// it can never be mistaken for a published one.

declare const __SITE_STUDIO_RELEASE__: string | undefined;

export const RELEASE: string =
  typeof __SITE_STUDIO_RELEASE__ === "string" && __SITE_STUDIO_RELEASE__ ? __SITE_STUDIO_RELEASE__ : "0.0.0-dev";

/** The data-format version this build writes. Raised only together with a conversion (AD-20). */
export const DATA_FORMAT_VERSION = 1;

/** The header that carries the caller's release on every call to an object (AD-20). */
export const RELEASE_HEADER = "x-site-studio-release";
