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

Preview Mode v7 with six authored vector drawings; Tutor Mode remains a future milestone. 

## Design Library — Preview Mode v7

The gallery contains **31 individually selectable designs**. It separates two capabilities rather than simulating true drawing with a bitmap reveal:

- **6 Draw Mode designs (authored vector geometry)**: `a-01` Diya & Lotus, `a-06` Floral Mandala, `a-07` Footprints & Lotus, `a-09` Diamond Lotus, `a-14` Diya Garland, `a-16` Diya Floral Swirl.
- **25 Image Preview designs**: transparent WebP assets that retain an approximate image-derived contour and colour-reveal animation.
- In addition, the **Lotus Mandala** and **Geometric Lotus** original studio templates remain selectable outside the gallery.

The new `drawable-designs.js` contains data for each of the six true vector compositions: guide dots, ordered paths (with weights and semantic types), fill regions, fill colours, and anchors. The existing `studio.js` renderer builds actual Canvas strokes from those paths, slows around curves, pauses between strokes, then fills independent colour regions. New designs do **not** use the image-upload/wedge-reveal pipeline.

### Accuracy and teaching disclosure

The six new models are **artistically authored geometric reconstructions** of the reference motifs. They are not pixel-perfect vectorizations of the image assets, nor reviewed instructions on how to draw the same artwork by hand. The 25 image previews remain image-reveal animations. All asset rights require verification before distributing the collages' derivative artwork.

### Developer notes

- `drawable-designs.js`: 6 authored vector datasets, no third-party libraries
- `gallery-data.js`: each gallery item uses `mode: "vector_draw"` or `mode: "image_preview"`
- `gallery.js`: filter mode, select vector renderer or image preview, accessible status messages
- `gallery.css`: mode tabs and drawing capability labels
- `.github/workflows/validate.yml`: validates JavaScript syntax, all 31 image paths, six vector model shapes and the gallery/renderer contract, then packages the public site into artifact `digiops-release`

Run `python3 -m http.server 8080` for local previews so all 31 WebP assets can be fetched normally. No build command or database is required.

DigiOps is configured to deploy the release artifact to `public_html/rangolimotion/`. A successful GitHub Actions workflow and DigiOps deployment must be confirmed before calling the staging website updated.

See [Design Library documentation](docs/DESIGN_LIBRARY.md) for rights, accuracy and deployment notes.
