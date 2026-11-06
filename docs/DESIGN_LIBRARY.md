# RangoliMotion — Design Library (v6)

31 individually addressable transparent WebP images (16 decorative, 15 festival-themed), in addition to the existing two vector designs.

## Integration

The existing `studio.js` mounts `gallery-data.js`, `gallery.js`, and `gallery.css`. Gallery cards use lazy-loaded images under `assets/designs/`. Clicking an item fetches only that WebP, passes it into the existing uploader, and scrolls to the Canvas preview.

## Copyright and accuracy

These are **AI-cleaned recreations** generated from user-provided collages. They are not perfectly faithful restorations of the source images. Some Marathi text and decorative symbols may require review. Ensure reuse rights are cleared before public distribution.

The two original vector templates still support path-based drawing. The new WebP assets use the artistic raster preview; their stroke order is **not** a tutorial.

## Deployment

The GitHub Actions workflow must package the full `assets/designs/` folder alongside the four JavaScript/CSS gallery files. `gallery.js` requires an HTTP(S) origin for gallery selection (`fetch`), so use the live Cloudways website or a local static server rather than opening `file://` directly.
