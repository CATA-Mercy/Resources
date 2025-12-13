# CATA Hub Site Skeleton

This is a starter file/folder structure for the CATA Studio & Media Hub GitHub Pages site.

- `public/` — all files served by GitHub Pages
  - `index.html`, `policies.html`, `resources.html`, `how-to.html` — page shells
  - `styles.css` — global styles placeholder
  - `partials/` — shared header & footer HTML
  - `branding/` — JSON files controlling fixed text/copy
  - `data/` — JSON content files (policies, resources, how-to, home highlights)
  - `scripts/` — JavaScript for shell + per-page logic

Electron-local editors and any other tools will point at `public/` to read/write JSON.
