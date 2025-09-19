# Cadence Live2D Wardrobe Prototype

This prototype renders existing NOIZ Live2D avatars inside the Bootstrap wardrobe shell. It uses
[`pixi-live2d-display`](https://github.com/guansss/pixi-live2d-display) on top of PixiJS to load the
bundled Cubism models and lets you swap expressions, toggle attachments, and persist selections to
`localStorage`.

## Features
- Pick between the bundled **Crimson Kitsune** and **Shadow Variant** models (both included under
  `items/`).
- Preview idle animation, physics, and cloth/ear motion directly inside the right-hand preview pane.
- Swap facial expressions from the **Appearance** tab. The runtime applies the matching `.exp3.json`
  files and blends the parameters with the model’s defaults.
- Toggle accessories (tails, jewellery, FX props) from the **Outfit** tab. Multiple attachments can be
  active at once and the inspector shows the current stack.
- Save and restore the last used model/expression/attachments across reloads (via `localStorage`).

## Project Layout
```
index.html           # Bootstrap UI + Pixi/Live2D runtime
items/RedFox/        # Crimson Kitsune Live2D model + expressions
items/BlackFox/      # Shadow Variant Live2D model + expressions/accessories
```

All assets are pre-packaged Live2D exports (`.model3.json`, `.moc3`, `.exp3.json`, textures, physics).
No pipeline conversion is required to run the demo.

## Running the Demo
Serve the folder from a local web server (for example `python -m http.server 8080` from the project
root) and open `http://localhost:8080/index.html`. The runtime streams `.model3.json`, `.moc3`, and
`.exp3.json` files via `fetch`, so browsers will block direct `file://` access. No additional build
step is required beyond running a static file server.

## Customising Models and Attachments
Model definitions live inside `index.html` under the `MODEL_CONFIGS` constant. Each entry declares:
- `model`: path to the `.model3.json`
- `expressions`: array with `id`, `name`, `icon`, and `files` (a list of `.exp3.json` files to apply)
- `toggles`: array of attachment definitions with the same structure

To add a new avatar, drop its exported Live2D folder under `items/`, then extend `MODEL_CONFIGS` with
the proper relative paths. The runtime will automatically surface the expressions/attachments in the
catalogue UI.

## Persistence Format
The save payload stored in `localStorage` looks like:
```json
{
  "modelId": "redfox",
  "expressionId": "love",
  "toggles": ["sparkleEyes", "necklace"]
}
```
This mirrors the runtime state and can be wired to Constellation entitlements or a backend API in a
full implementation.
