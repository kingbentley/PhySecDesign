# PhySec logo

The shield chosen on 2026-11-20: the site's map on the left, coverage rings on the right, and a map pin holding a camera lens in the centre. The drafts it came from are in `../logo-concepts/`, and `../logo-concepts/round-3-shield/preview.html` shows it at every size.

| File | Use |
| --- | --- |
| `physec-mark.svg` | The full shield, for 48 pixels tall and up. |
| `physec-mark-small.svg` | Simplified shield (two-tone shield, pin and lens), for below 48 pixels. |
| `physec-lockup.svg`, `physec-lockup-dark.svg` | Shield with the name and "Site Security Design", for light and dark backgrounds. The lettering is DM Sans converted to shapes. |
| `physec-app-icon.svg`, `icon-192.png`, `icon-512.png` | App icon on a light tile. |
| `apple-touch-icon.png` | 180-pixel square icon; iOS rounds the corners. |
| `favicon.svg`, `favicon.ico` | Browser tab icon (the simplified shield); the `.ico` holds 16, 32 and 48 pixels. |

Colours: teal `#0b6f72`, navy `#1d3557`, green `#4a9d6a` to `#1f6f5c`, lens `#17324d`, and sage `#4f7f6a` for "Sec". These are the logo's own colours; the app's interface teal is still `#007e73`.

Keep at least a quarter of the shield's height clear around the logo.

The app draws the shield with `site-studio/src/BrandMark.jsx`, and the icons in `site-studio/public/` are copies of the files here. Change them together.
