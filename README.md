# Bootstrap Avatar Preview

A minimal avatar editor using [Three.js](https://threejs.org/) and [Bootstrap 5](https://getbootstrap.com/).

The page loads the `Armature.glb` avatar and shows a grid of asset cards. Each card toggles an extra model; for now they all reuse the bundled `Teleporter Base.glb` so no additional binaries are required. A narrow sidebar holds category icons, and clicking a card loads or removes the asset. A simple color picker changes the avatar's material color. Models are compressed with [Draco](https://google.github.io/draco/), and the decoder is fetched from the Three.js CDN at runtime so no build step is required.

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
