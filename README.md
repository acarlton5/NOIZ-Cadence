# Cadence 2D – README

A high-fidelity, web-based **2D avatar system** for NOIZ. Cadence provides a paper-doll style wardrobe (Gaia-like) with modern VTuber aesthetics. It uses **layered PNG assets** and a **license-free runtime** (PixiJS/Canvas). Optional motion can be added later via a custom lightweight rig or Spine/DragonBones—**no Live2D SDK at runtime**.

---

## Goals
- Ship a **fast, cheap, scalable** avatar system (thousands of items).  
- Keep **one-per-slot** semantics (no stack spam), support conflict tags.  
- Reuse the existing Bootstrap 5 wardrobe UI and entitlement flow.  
- Be **license-safe** (no Live2D SDK or GLB requirement at runtime).  

## Non-Goals (for now)
- No 3D rendering.  
- No Live2D `.model3.json` at runtime.  
- No user uploads of arbitrary art (marketplace will convert via pipeline).  

---

## Tech Stack
- **UI**: Bootstrap 5 (existing prototype)
- **Renderer**: PixiJS (WebGL, with Canvas fallback)  
- **State**: slot→item mapping, persisted via Constellation entitlements  
- **Asset delivery**: CDN (PNG + JSON)  

Optional later: DragonBones/Spine runtime for skeletal motion of select parts.

---

## Folder Layout (runtime)
```
/cadence
  /public
    /assets
      /base
        base_unisex.png
        eyes_default.png
        mouth_default.png
        hair_00.png
      /items
        /torso
          hoodie_blue.png
          hoodie_black.png
          hoodie.manifest.json
        /bottoms
          jeans_dark.png
        /hat
          horns_red.png
        /prop_scene
          dbd_hook.png
      /meta
        slots.schema.json
        layer_order.json
  /src
    ui/        # bootstrap catalogue & preview panel
    renderer/  # pixi stage, loader, layer manager
    state/     # equip logic, conflicts, save
```

---

## Slots (locked)
```
body_base, skin, hair, eyes, mouth,
face_accessory, hat, hair_accessory, neck,
torso, jacket, bottoms, shoes,
left_wrist, right_wrist, left_hand, right_hand,
back_upper, back_lower,
vfx, emote,
prop_companion_a, prop_companion_b,
prop_scene_a, prop_scene_b
```
**Rule**: one item per slot. Equipping a new item in a used slot **swaps** the old one.

---

## Layer Order (2D draw stack)
Lower renders first. Keep small and stable:
```
0100 background (scene/sky – optional)
0300 prop_scene_* (back)
0400 back_upper (wings), 0450 back_lower (tail)
0500 body_base + skin overlay
0600 bottoms, 0620 shoes
0640 torso, 0700 jacket
0740 left/right_wrist, 0760 left/right_hand (behind torso variants if needed)
0920 hair_back
0960 mouth (if visible), 0980 face_accessory under, 1000 eyes, 1020 hair_front
1040 hat, 1060 hair_accessory
1200 vfx_front (sparks/overlays)
1400 prop_companion_* (front when intended)
```
Runtime can nudge order with an optional `renderLayer` hint on items.

---

## Item Manifest (runtime) – **`*.manifest.json`**
```json
{
  "id": "hoodie_blue",
  "name": "Hoodie – Blue",
  "slot": "torso",
  "image": "hoodie_blue.png",
  "z": 640,
  "mount": { "anchor": [0.5, 0.0], "offset": [0, 0], "scale": 1 },
  "variants": [
    { "id": "hoodie_black", "image": "hoodie_black.png", "name": "Hoodie – Black" }
  ],
  "tags": ["apparel", "hoodie"],
  "ipTags": [],
  "conflicts": { "ip": [], "safety": [] },
  "locks": { "exclusive_with": [] },
  "entitlementId": "itm_hoodie_blue_v1"
}
```
Notes:
- `slot` drives equip logic.  
- `z` is a convenience; renderer will map to canonical order by slot (and adjust with `renderLayer` if supplied).  
- `mount` is for positional tweaks; 2D uses `anchor|offset|scale`.  
- `variants` are colorways shipped as separate images.

---

## Base Manifest (runtime) – **`/assets/base/base.manifest.json`**
```json
{
  "id": "base_unisex",
  "layers": [
    { "id": "body_base", "image": "base_unisex.png", "z": 500 },
    { "id": "eyes", "image": "eyes_default.png", "z": 1000 },
    { "id": "mouth", "image": "mouth_default.png", "z": 960 },
    { "id": "hair", "image": "hair_00.png", "z": 920 }
  ]
}
```

---

## Equip Flow (renderer/state)
1. User clicks item in catalogue → `{slot, itemId}`.  
2. Resolve conflicts (brand/safety/IP).  
3. Swap item in slot; update preview (Pixi layers).  
4. Enable Save; on Save → emit `{slot→entitlementId}` to Constellation.  
5. Persist/load on profile display.

---

## Conflict System
- Items may declare `ipTags` and `conflicts` arrays.  
- On equip, check: (a) **explicit** `exclusive_with`, (b) **IP beef** (e.g., `dc` vs `marvel`), (c) **safety** (e.g., `minor_prop` with `violence`).  
- If violation → modal explains: *“Due to brand/safety constraints, this combo is not allowed.”* Offer **Replace** or **Cancel**.

---

## Marketplace Upload → Conversion (license-safe)
**Inputs allowed**: PSD, PNGs, optional Live2D previews.  
**Forbidden at runtime**: Live2D `.model3.json/.cmo3` files.  
**Pipeline**:
1) Validate creator account + terms.
2) Parse PSD → export layered PNGs to destination folders.
3) Ask creator to map each layer to a **slot** (dropdown), define `z` hints.
4) Generate Cadence `*.manifest.json` per item + thumbnail.
5) Virus scan + store on CDN.  
6) Discard any Live2D files; keep only PNG + manifest.

---

## Performance Budget
- Target **≤10 MB per item** (PNG-8/WebP where acceptable).  
- On profile: load base + equipped items only.  
- In editor: lazy-load thumbnails; preload hovered slot items.  

---

## Security
- No raw source download endpoints.  
- Signed CDN URLs; referer checks for hotlinking.  
- Metadata whitelist for mount/transform; sanitize all strings.  

---

## Roadmap (phased)
1) **MVP (static)**: slots, equip/swap, save, conflicts, profile render (no animation).  
2) **Motion Lite**: idle blink/breathe via tiny tween scripts; VFX sprites.  
3) **Rigged Selects**: adopt DragonBones/Spine for premium animated items.  
4) **Creator Portal**: self-serve upload + conversion, QA workflows, revenue splits.  

---

# AGENT_SPEC.md (for Codex)

## Mission
Implement Cadence 2D runtime and integrate with existing Bootstrap wardrobe UI. Do **not** use Live2D SDK at runtime. Use PixiJS to composite PNG layers based on slot→item selection. Persist via Constellation entitlements.

## Acceptance Criteria
- Load base manifest and equipped items; render on a Pixi stage within the preview panel.
- One-per-slot swapping; Save emits `{slot→entitlementId}`.
- Conflict checks fire before swap; modal with Replace/Cancel.
- Thumbnails filterable by search; slots have tooltips and active state (already in UI).

## APIs (internal)
```ts
// state/equip.ts
export type SlotId =
  | 'body_base'|'skin'|'hair'|'eyes'|'mouth'
  | 'face_accessory'|'hat'|'hair_accessory'|'neck'
  | 'torso'|'jacket'|'bottoms'|'shoes'
  | 'left_wrist'|'right_wrist'|'left_hand'|'right_hand'
  | 'back_upper'|'back_lower'
  | 'vfx'|'emote'
  | 'prop_companion_a'|'prop_companion_b'|'prop_scene_a'|'prop_scene_b';

export interface ItemManifest {
  id: string; name: string; slot: SlotId;
  image: string; z?: number;
  mount?: { anchor?: [number,number]; offset?: [number,number]; scale?: number; renderLayer?: 'behind'|'mid'|'front' };
  variants?: { id: string; image: string; name?: string }[];
  tags?: string[]; ipTags?: string[];
  conflicts?: { ip?: string[]; safety?: string[] };
  locks?: { exclusive_with?: string[] };
  entitlementId: string;
}

export interface EquipState { equipped: Partial<Record<SlotId, ItemManifest>> }

export function loadProfileEntitlements(userId: string): Promise<EquipState>;
export function saveProfileEntitlements(state: EquipState): Promise<void>;
export function checkConflicts(next: ItemManifest, state: EquipState): { ok: boolean; reasons?: string[] };
export function equip(next: ItemManifest, state: EquipState): EquipState; // swap same-slot item
```

## Renderer (PixiJS)
```ts
// renderer/stage.ts
export function initStage(canvasEl: HTMLCanvasElement): Application;
export function loadBase(baseManifestUrl: string): Promise<void>;
export function applyItem(item: ItemManifest): void;   // adds or replaces slot layer
export function removeSlot(slot: SlotId): void;
export function setVariant(slot: SlotId, variantId: string): void;
```

- Keep one **Container per slot**; each holds a single `Sprite` (or variant).  
- Z-ordering: map slot→base Z from `layer_order.json`; add `renderLayer` offset if present.  

## UI Contracts
- `postMessage` from catalogue → `{ type:'equip', itemId }`  
- Preview replies with `{ type:'equipped', slot, itemId }` or `{ type:'blocked', reasons }`.  
- Save button enabled when `dirty === true`.

## Conflicts
- Maintain a small `ip_matrix.json` (pairs that cannot co-exist).  
- Safety rules live in `safety_rules.json` (e.g., `minor_prop` vs `violence`).  

## Creator Conversion (outline)
- Accept PSD/PNG; reject `.model3.json` at storage.  
- Map layers→slots via admin UI; emit manifests + thumbnails.  
- Optimize images (PNG-8/WebP), cap width/height per spec (e.g., 3000×3000 max).  

## Performance Targets
- Editor: ≤ 12 textures resident; Profile: ≤ 8.  
- Average item PNG ≤ 2 MB; total payload ≤ 15 MB per profile render.  

## Testing
- Snapshot tests for layer order by slot.  
- Conflict matrix unit tests.  
- Golden images for 5 canonical outfits.  

## Telemetry
- Events: `avatar_equip`, `equip_blocked`, `save_loadout`, `profile_render`.  
- Measure load time, texture memory, and save success rate.  

---

## Legal & Licensing
- Do **not** ship or store Live2D `.model3.json/.cmo3` or SDK artifacts.  
- Only PNG + Cadence manifests are delivered at runtime.  
- Marketplace TOS must state creators grant platform distribution rights for converted assets.

