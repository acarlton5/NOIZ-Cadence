# Bootstrap Avatar Preview

A static avatar editor mock-up inspired by modern hero-customizer UIs, powered by [Three.js](https://threejs.org/) and [Bootstrap 5](https://getbootstrap.com/).

The page loads the bundled `Armature.glb` avatar beside a glossy asset browser. A blurred icon rail anchors the layout, while the left panel presents outfit cards that toggle optional models — for now every card reuses the existing `Teleporter Base.glb` so no extra binaries are needed. A floating color chip lets you tint the avatar, and the scene lighting/gradient backdrop match the polished concept art reference.

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
