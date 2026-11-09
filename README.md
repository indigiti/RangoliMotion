# RangoliMotion

Interactive browser-based rangoli animation studio.

> **Mandatory engine rule:** Every playable design, including uploaded and gallery images, follows **guide dots → stroke-by-stroke outline → finished outline hold → region-by-region colour fill → final details**. See [drawing rules](docs/RANGOLI_DRAWING_RULES.md), [agent instructions](AGENTS.md) and [contributing](CONTRIBUTING.md). Automated image traces are **estimates, not verified lessons**.

## Features

- Select **Lotus Mandala** or **Geometric Lotus** (traced from an uploaded reference).
- Animated dot placement, stroke-by-stroke outlines, color filling, and final flourish.
- Organic drawing timing: outline speed, curvature slowdown, and pauses between strokes.
- Full-screen preview, timeline scrubber, play/pause, looping, background themes.
- Upload PNG, JPG, WebP, SVG, or AVIF for an artistic approximation.
- Export PNG snapshots and WebM recordings (supported browsers).
- Static site: no database, authentication, API key, or build step.

## Run locally

Serve `index.html` through a local HTTP server. The source includes all scripts and image assets, but browsers may block gallery operations under `file://`.

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
- `bhaubeej-model.js` — benchmark: semantic footprint/diya vector paths and final Marathi label
- `gallery-data.js`, `gallery.js`, `gallery.css` — 31-design gallery and capability filters

## Accuracy note

The provided Geometric Lotus is traced into vector strokes but its stroke order is an **artistic inference**, not a verified tutorial. Uploaded raster images use stylized approximations. True step-by-step teaching requires reviewed path order.

## License and artwork

No license is granted for redistribution of original third-party reference imagery. Do not upload or publish reference photos without the appropriate rights. The geometric tracing included here was derived from the image supplied during development; verify artwork rights before public distribution.

## Status

Preview Mode v10: mandatory five-stage drawing pipeline, seven authored gallery designs (including the Bhaubeej benchmark), two built-in templates, and experimental auto-tracing for user uploads. Tutor Mode remains a future milestone. 

## Design Library — Draw Mode and Auto-Trace Preview

The gallery contains **31 individually selectable designs**. It separates two capabilities rather than simulating true drawing with a bitmap reveal:

- **7 Draw Mode designs (authored vector geometry)**: `a-01` Diya & Lotus, `a-06` Floral Mandala, `a-07` Footprints & Lotus, `a-09` Diamond Lotus, `a-14` Diya Garland, `a-16` Diya Floral Swirl, **`b-06` Bhaubeej Footprints** (semantic benchmark).
- **24 reference-only images**: selecting a gallery card shows the image and its status without pretending it is drawable. A separate **experimental auto-trace** action is optional and explicitly unverified.
- In addition, the **Lotus Mandala** and **Geometric Lotus** original studio templates remain selectable outside the gallery.

The `drawing-contract.js` enforces all five positive-duration stages; `powder-trace.js` extracts bright rangoli-powder centerlines, while `image-processor.js` builds contour and region geometry for uploaded and gallery raster assets. Processed art now paints simulated powder colours, not source photographs. The `drawable-designs.js` and `bhaubeej-model.js` contain data for the seven authored vector compositions: guide dots, ordered paths (with weights and semantic types), fill regions, fill colours, and anchors. The existing `studio.js` renderer builds actual Canvas strokes from those paths, slows around curves, pauses between strokes, then fills independent colour regions. New designs do **not** use the image-upload/wedge-reveal pipeline.

### Accuracy and teaching disclosure

The seven models are **artistically authored geometric reconstructions** of the reference motifs. They are not pixel-perfect vectorizations of the image assets, nor reviewed instructions on how to draw the same artwork by hand. The remaining 24 images stay reference-only by default. Explicit experimental auto-tracing does not count as a verified lesson and can fail closed. All asset rights require verification before distributing the collages' derivative artwork.

### Developer notes

- `drawable-designs.js`: 6 existing authored vector datasets
- `bhaubeej-model.js`: seventh authored design with 2 footprints, 10 toes, 78 beads, diya, flowers, leaves and a Marathi final label
- `docs/BHAUBEEJ_BENCHMARK.md`: geometric/visual acceptance criteria for this reference design
- `gallery-data.js`: each gallery item uses `mode: "vector_draw"` or `mode: "image_preview"`
- `gallery.js`: filter mode, select authored vectors or display reference-only imagery, and opt into experimental tracing
- `drawing-contract.js`: mandatory stage timings, stage classification, model validation
- `powder-trace.js`: centreline tracing of light powder and decorative outlines
- `image-processor.js`: browser-only raster-to-contour and colour-region extraction with fail-closed behavior
- `tests/drawing-contract.test.js`: cross-input tests for mandatory stage sequencing and honesty gates
- `gallery.css`: mode tabs and drawing capability labels
- `.github/workflows/validate.yml`: validates JavaScript syntax, all 31 image paths, seven vector model shapes and the gallery/renderer contract, then packages the public site into artifact `digiops-release`

Run `python3 -m http.server 8080` for local previews so all 31 WebP assets can be fetched normally. No build command or database is required.

DigiOps is configured to deploy the release artifact to `public_html/rangolimotion/`. A successful GitHub Actions workflow and DigiOps deployment must be confirmed before calling the staging website updated.

See [Design Library documentation](docs/DESIGN_LIBRARY.md) for rights, accuracy and deployment notes.

**Bhaubeej visual benchmark:** [BHAUBEEJ_BENCHMARK.md](docs/BHAUBEEJ_BENCHMARK.md) documents the first reference reconstruction. Visual similarity and authentic human drawing order are still subject to editorial review.

### Processing accuracy warning

Automatic processing creates estimated guide points, not necessarily the original rangoli dot grid. The contours and filling regions are derived from raster colours/alpha, and the resulting stroke order is an algorithmic approximation. A reviewed editing/approval process is required before any auto-generated output can be labelled an authentic step-by-step tutorial.
