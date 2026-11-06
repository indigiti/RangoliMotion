# RangoliMotion

Interactive browser-based rangoli animation studio.

## Features

- Select **Lotus Mandala** or **Geometric Lotus** (traced from an uploaded reference).
- Animated dot placement, stroke-by-stroke outlines, color filling, and final flourish.
- Organic drawing timing: outline speed, curvature slowdown, and pauses between strokes.
- Full-screen preview, timeline scrubber, play/pause, looping, background themes.
- Upload PNG, JPG, WebP, SVG, or AVIF for an artistic approximation.
- Export PNG snapshots and WebM recordings (supported browsers).
- Static site: no database, authentication, API key, or build step.

## Run locally

Open `index.html` directly in Chrome or Edge. All JavaScript, CSS, and image assets are included in this repository.

For browsers that restrict local file behavior, use a static server:

```sh
python3 -m http.server 8080
```

Then visit `http://localhost:8080`.

## Project structure

- `index.html` — static UI and design picker
- `styles.css` — user interface styling
- `geometric-design.js` — traced outline dataset and optional color regions
- `studio.js` — HTML Canvas animation, upload and export logic
- `standalone.html` — completely self-contained offline version

## Accuracy note

The provided Geometric Lotus is traced into vector strokes but its stroke order is an **artistic inference**, not a verified tutorial. Uploaded raster images use stylized approximations. True step-by-step teaching requires reviewed path order.

## License and artwork

No license is granted for redistribution of original third-party reference imagery. Do not upload or publish reference photos without the appropriate rights. The geometric tracing included here was derived from the image supplied during development; verify artwork rights before public distribution.

## Status

Preview Mode v5. Tutor Mode is not implemented. 
