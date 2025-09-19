# Cadence 2D Runtime

A high-fidelity, web-based **2D avatar system** for NOIZ. Cadence provides a paper-doll wardrobe with VTuber aesthetics rendered with PixiJS. The runtime composites layers defined in JSON manifests; this prototype draws colour-blocked vector stand-ins so no binary art assets are required in-repo.

## Goals
- Ship a **fast, cheap, scalable** avatar system that can host thousands of cosmetics.
- Maintain strict **one-item-per-slot** semantics with conflict tags for brand and safety governance.
- Reuse the existing Bootstrap wardrobe editor UI and entitlement flow.
- Keep runtime delivery **license-safe** (no Live2D SDK or GLB requirement).

## Tech Stack
- **UI**: Bootstrap 5, vanilla JavaScript
- **Renderer**: PixiJS (WebGL with Canvas fallback)
- **State**: slot→item mapping persisted through Constellation entitlements (localStorage shim in this prototype)
- **Assets**: JSON manifests describing either raster layers (CDN-hosted PNG/WebP) or procedural colour blocks (used in this repo)

## Runtime Flow
1. Load the base manifest (`/assets/base/base.manifest.json`) to populate default layers.
2. Fetch equipped entitlements and hydrate the Pixi stage.
3. When the user taps a catalogue tile the runtime resolves conflicts, swaps the item for the relevant slot, and posts telemetry events (`equipped`, `blocked`).
4. Save emits a `{ slot → entitlementId }` payload.

## Conflict Rules
- Items can declare `exclusive_with`, `ipTags`, and safety constraints. The runtime prevents illegal combinations and offers a replace/cancel modal when conflicts arise.
- IP combinations are enforced through `assets/ip_matrix.json`.
- Safety checks originate from `assets/safety_rules.json`.

## Asset Manifests
Item manifests (`*.manifest.json`) describe the slot, visual styling, z-order hints, optional mount metadata, variants, tags, and entitlement id. Example:

```json
{
  "id": "hoodie_blue",
  "slot": "torso",
  "fill": "#4a60ff",
  "size": [380, 420],
  "mount": { "anchor": [0.5, 0.5], "offset": [0, 120], "scale": 1 },
  "variants": [
    { "id": "hoodie_black", "fill": "#242638" }
  ],
  "entitlementId": "itm_hoodie_blue_v1"
}
```

Base manifests define immutable layers (body, default hair, etc.) and live in `/assets/base`. They follow the same schema, allowing either `image` references for CDN art or simple `fill` + `size` pairs for placeholder geometry.

## Development
Open `index.html` in a modern browser. The prototype uses localStorage to persist a demo profile. Items, layer order, and conflict matrices live under the `/assets` folder and can be extended to add more cosmetics.
