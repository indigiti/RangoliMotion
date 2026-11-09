# RangoliMotion — Design Library (v8)

31 separately addressable transparent WebP images (16 decorative + 15 festive), plus two built-in templates.

## Modes

- 6 `vector_draw` gallery entries: author-defined dots, ordered strokes and fill polygons (`drawable-designs.js`).
- 25 `image_preview` gallery entries: source assets only. When clicked, they pass through the **same automatic image tracing engine** used for manual uploads. A successful trace is played as `image_auto_trace`, not promoted to `vector_draw`. An unsuccessful trace stays a non-playable image preview with a clear error. The gallery retains its count as 25 unreviewed image assets.
- Original Lotus Mandala and Geometric Lotus remain selected from the studio's design picker.

## Mandatory pipeline

Every playable template and successfully processed image follows:
**place guide dots → trace outlines sequentially → show completed outline before colour → fill each bounded colour region separately → final details**.

The pipeline runs from `drawing-contract.js` and cannot be replaced with a whole-bitmap fade or wedge effect. See [normative rules](RANGOLI_DRAWING_RULES.md) and root [AGENTS.md](../AGENTS.md).

## How automatic tracing works

`gallery.js` retrieves a single design image and dispatches the studio's upload event. `studio.js` uses `image-processor.js` to downsample pixel data, group adjacent colours, extract contour loops and geometry-based guide anchors, and build individual region masks. The stage engine renders timed **Canvas paths**, then reveals only the image pixels falling inside each region mask.

This is a local browser approximation. It cannot know the artist's actual dot grid, preferred stroke order, hand movement or fill process from a raster image alone. The displayed guide dots are estimated, not verified historical drawing directions. Do not label it a tutorial.

## Assets, rights and quality

The 31 artworks are AI-cleaned recreations derived from supplied collage images, not faithful vector restorations. Some Marathi text, religious symbols and detailed motifs may require expert review. Check reuse rights before distribution. For a reliable how-to lesson, manually refine and approve the vector construction.

## Deployment and validation

Run `node tests/drawing-contract.test.js`, check the browser phases with actual uploads, and require a successful GitHub Actions workflow. The `digiops-release` artifact must contain `drawing-contract.js`, `image-processor.js`, `studio.js`, `drawable-designs.js`, `gallery*.js/css`, and all 31 WebP files under `assets/designs/`.

The gallery uses `fetch()`, so serve over HTTP(S) rather than `file://`.
