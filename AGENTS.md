# RangoliMotion — Agent / Developer Instructions

These rules apply to every implementation or generated file under this repository.

**READ FIRST:** [docs/RANGOLI_DRAWING_RULES.md](docs/RANGOLI_DRAWING_RULES.md).

Mandatory workflow for every playable rangoli, including uploaded and processed images:
**dots → outline (stroke-by-stroke) → outline_complete (no colour) → fill (one region at a time) → final**.

The stages are non-negotiable. Never substitute whole-image fade, clockwise sectors, wipes, opacity masks, or copied source-photo pixels for contour stroke playback. Extract white powder centerlines in `powder-trace.js` and draw bounded colours as synthetic powder. Use `drawing-contract.js` for stage scheduling, `powder-trace.js` + `image-processor.js` for automatic traces, `studio.js` for playback, and CI tests for regression gates.

**Semantic fidelity requirement:** For illustrated designs, count meaningful components (footprints, toes, beads, flowers, leaves, symbols) and inspect an outline-only browser frame. Pixel-contour counts do not establish design fidelity. Use [Bhaubeej benchmark](docs/BHAUBEEJ_BENCHMARK.md) as a regression reference. Never promote a gallery reference to Draw Mode merely because an automatic trace has many paths.

**Honesty requirement:** Automatically processed images generate **estimated** guide anchors, paths and region masks; they are *not verified tutorial instructions*. Preserve `tutorialCapable:false` until a human checks path topology and drawing order. Gallery assets lacking a reviewed semantic reconstruction remain reference-only; optional automatic tracing is experimental and cannot be advertised as Draw Mode. Images without usable geometry must fail closed; do not fake the pipeline.

Update the contract/test/documentation together whenever modifying processing, rendering, gallery import, animation controls, speed settings or release packaging. Run `node tests/drawing-contract.test.js` and `node tests/runtime-smoke.test.js` before merging. Never remove this gate to make CI green.
