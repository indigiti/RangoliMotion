# RangoliMotion — Design Library (v10)

31 separately addressable transparent WebP images (16 decorative + 15 festive), plus two built-in templates.

## Modes

- 7 `vector_draw` gallery entries: six existing authored templates plus `b-06` Bhaubeej Footprints (`bhaubeej-model.js`), built from recognizable semantic shapes. See [benchmark criteria](BHAUBEEJ_BENCHMARK.md).
- 24 `image_preview` gallery entries: source assets remain reference-only when selected. An explicit **Try experimental automatic tracing** action can invoke the upload-processing engine, but the result is never considered tutorial-ready.
- Original Lotus Mandala and Geometric Lotus remain selected from the studio's design picker.

## Mandatory pipeline

Every playable template and successfully processed image follows:
**place guide dots → trace outlines sequentially → show completed outline before colour → fill each bounded colour region separately → final details**.

The pipeline runs from `drawing-contract.js` and cannot be replaced with a whole-bitmap fade or wedge effect. See [normative rules](RANGOLI_DRAWING_RULES.md) and root [AGENTS.md](../AGENTS.md).

## How automatic tracing works

When a user explicitly requests experimental tracing, `gallery.js` retrieves that design image and dispatches the studio's upload event. `studio.js` uses `image-processor.js` to downsample pixel data, group adjacent colours, extract contour loops and geometry-based guide anchors, and build individual region masks. The stage engine renders timed **Canvas paths**, then draws a solid, grain-textured colour approximation inside each region mask. The original photograph is **not** painted onto the animation Canvas.

This is a local browser approximation. It cannot know the artist's actual dot grid, preferred stroke order, hand movement or fill process from a raster image alone. The displayed guide dots are estimated, not verified historical drawing directions. Do not label it a tutorial.

## Assets, rights and quality

The 31 artworks are AI-cleaned recreations derived from supplied collage images, not faithful vector restorations. Some Marathi text, religious symbols and detailed motifs may require expert review. Check reuse rights before distribution. For a reliable how-to lesson, manually refine and approve the vector construction.

## Deployment and validation

Run `node tests/drawing-contract.test.js`, check the browser phases with actual uploads, and require a successful GitHub Actions workflow. The `digiops-release` artifact must contain `drawing-contract.js`, `image-processor.js`, `studio.js`, `drawable-designs.js`, `gallery*.js/css`, and all 31 WebP files under `assets/designs/`.

The gallery's opt-in experimental tracing uses `fetch()`, so serve over HTTP(S) rather than `file://`.
