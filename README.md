# Bootstrap Avatar Preview

A static avatar editor mock-up that mirrors the provided concept art while staying completely portable thanks to [Three.js](https://threejs.org/) and [Bootstrap 5](https://getbootstrap.com/).

## Highlights
- **Gradient shell:** A deep violet backdrop, blurred icon rail, and glowing viewer pane reproduce the two-panel hero layout from the reference.
- **Wardrobe lineup:** The grid now opens with a pinned "Hero Body Suit" card that streams the existing `Assets/NakedFullBody.glb` model directly from `Assets.zip`, alongside wardrobe categories (cape, gauntlets, boots, pose pack) that reuse the bundled Teleporter Base and Poses assets—no new binaries required.
- **Responsive color tooling:** The viewer keeps the hero rig in frame while extras toggle around it, and the floating “Primary Color” control recolors the avatar in real time.

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
