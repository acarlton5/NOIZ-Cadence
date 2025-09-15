# Bootstrap Avatar Preview

A static avatar editor mock-up that mirrors the provided concept art while staying completely portable thanks to [Three.js](https://threejs.org/) and [Bootstrap 5](https://getbootstrap.com/).

## Highlights
- **Gradient shell:** A deep violet backdrop, blurred icon rail, and glowing viewer pane reproduce the two-panel hero layout from the reference.
- **Wardrobe lineup:** The grid now opens with a pinned "Hero Body Suit" card that composites the existing `Assets/NakedFullBody.glb` body with the head, face, eyes, brow, and nose pieces stored in `Assets.zip`, while every optional item swaps in its own GLB—Hair.010, WawaDress, Hat.001 for the crown, Hat.007 for bunny ears, Shoes.002, and the Teleporter Base—so the previewer shows the real wardrobe set instead of repeated placeholders.
- **Thumbnail fidelity:** Card art is streamed straight out of `Assets.zip` (hair.jpg, shoes.jpg, thumbnail_wawadress.png, thumbnail_crown.png, etc.), giving each selector tile an accurate snapshot of the asset it toggles.
- **Relaxed poses:** Selecting the "Relaxed Idle" pose card loads `public/models/Poses.glb` once and applies the Idle animation clip to the assembled body and clothing, delivering the chilled stance requested while keeping everything on the existing skeleton.
- **Steady color tooling:** The viewer stays static, reframes automatically as items change, and the floating “Primary Color” control still tints the assembled body pieces together in real time.

Models remain Draco-compressed with the decoder fetched from the Three.js CDN at runtime, and the hero mesh is unpacked in-browser with JSZip so everything continues to work in a simple static environment.

## Run locally
1. Install a static server such as [`live-server`](https://www.npmjs.com/package/live-server).
   ```bash
   npm install -g live-server
   ```
2. From the repository root, start the server:
   ```bash
   live-server
   ```
3. Navigate to the address printed by the server (usually http://127.0.0.1:8080).

The page uses vanilla ES modules resolved via an import map to CDNs, so no build step is required.
