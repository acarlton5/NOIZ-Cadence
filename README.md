# Bootstrap Avatar Preview

A minimal avatar viewer using [Three.js](https://threejs.org/) and [Bootstrap 5](https://getbootstrap.com/).

It loads the existing `Armature.glb` asset and exposes a simple color picker to tweak the body material.

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

The page uses vanilla ES modules from CDNs, so no build step is required.
