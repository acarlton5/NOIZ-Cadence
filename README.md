# Bootstrap Avatar Preview

A static avatar editor mock-up that mirrors the provided concept art while staying completely portable thanks to [Three.js](https://threejs.org/) and [Bootstrap 5](https://getbootstrap.com/).

## Highlights
- **Gradient shell:** A deep violet backdrop, blurred icon rail, and glowing viewer pane reproduce the two-panel hero layout from the reference.
- **Stylized library cards:** The outfit library is arranged as a soft, rounded grid with “SENSEI” watermarks and gradient swatches. Each entry still toggles the bundled `Teleporter Base.glb`, so the demo avoids introducing any new binary assets.
- **Responsive color tooling:** The avatar preview loads `Armature.glb` by default, keeps rotating inside the neon frame, and exposes a floating “Primary Color” control for quick palette tweaks.

Models remain Draco-compressed with the decoder fetched from the Three.js CDN at runtime, so everything continues to work in a simple static environment.

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
