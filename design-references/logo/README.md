# PhySec logo

The logo chosen on 2026-11-20: a survey clipboard with a checklist and plan lines, and a dome camera in front of it casting light, with the line "Site Survey Design". The drafts it came from, and the two earlier logos, are in `../logo-concepts/`; `../logo-concepts/round-4-clipboard/preview.html` shows it at every size.

| File | Use |
| --- | --- |
| `physec-mark.svg` | The full mark, for 48 pixels tall and up. |
| `physec-mark-small.svg` | Simplified mark (clipboard, one tick and the camera), for below 48 pixels. |
| `physec-lockup.svg`, `physec-lockup-dark.svg` | Mark with the name and "Site Survey Design", for light and dark backgrounds. The lettering is DM Sans converted to shapes. |
| `physec-app-icon.svg`, `icon-192.png`, `icon-512.png` | App icon on a light tile. |
| `apple-touch-icon.png` | 180-pixel square icon; iOS rounds the corners. |
| `favicon.svg`, `favicon.ico` | Browser tab icon: the camera alone, because the whole mark is unreadable at 16 pixels. The `.ico` holds 16, 32 and 48 pixels. |

Colours: teal `#0b6f72`, deep teal `#135560`, navy `#17324d`, green `#5fb184` to `#2f9461`, mint `#8fd0ad` and sage `#5d8f7c`. "Phy" is teal and "Sec" is green `#2f9461`. These are the logo's own colours; the app's interface teal is still `#007e73`.

Keep at least a quarter of the mark's height clear around the logo.

The app draws the mark with `site-studio/src/BrandMark.jsx`, and the icons in `site-studio/public/` are copies of the files here. Change them together.
