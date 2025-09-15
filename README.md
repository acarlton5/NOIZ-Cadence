# Bootstrap Avatar Preview

A static avatar editor mock-up that mirrors the provided concept art while staying completely portable thanks to [Three.js](https://threejs.org/) and [Bootstrap 5](https://getbootstrap.com/).

## Highlights
- **Gradient shell:** A deep violet backdrop, blurred icon rail, and glowing viewer pane reproduce the two-panel hero layout from the reference.
- **Wardrobe lineup:** The selector now boots from `assets-manifest.json`, keeping the pinned "Hero Body Suit" card while automatically listing every GLB inside `Assets.zip` alongside the Teleporter Base so the previewer exposes the real wardrobe set instead of repeated placeholders.
- **Thumbnail fidelity:** Card art is streamed straight out of `Assets.zip` (hair.jpg, shoes.jpg, thumbnail_wawadress.png, thumbnail_crown.png, etc.), giving each selector tile an accurate snapshot of the asset it toggles.
- **Manifest driven:** Cards, source paths, and lock states are read from `assets-manifest.json`, so exposing new wardrobe pieces only requires editing data instead of hand-writing HTML tiles.
- **Relaxed poses:** Selecting the "Relaxed Idle" pose card loads `public/models/Poses.glb` once and applies the Idle animation clip to the assembled body and clothing, delivering the chilled stance requested while keeping everything on the existing skeleton.
- **Steady color tooling:** The viewer stays static, reframes automatically as items change, and the floating “Primary Color” control still tints the assembled body pieces together in real time.

## Asset manifest
The wardrobe selector fetches `assets-manifest.json` at startup and builds cards from its entries:

```json
{
  "id": "wardrobe-hair",
  "type": "extra",
  "title": "Layered Hair 10",
  "source": { "zip": "Assets.zip", "entry": "Assets/Hair.010.glb" },
  "thumbnail": { "zip": "Assets.zip", "entry": "Assets/hair.jpg" },
  "labels": { "active": "Equipped", "inactive": "Tap to equip" }
}
```

- Entries describing core attachments are flagged with `"type": "attachment"` and `"locked": true` so they surface in the UI but stay pinned to the hero mesh that already loads them.
- Append new objects to the array to expose more GLBs from `Assets.zip`; the viewer will generate cards, hook up toggles, and stream the geometry without touching `index.html`.

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
