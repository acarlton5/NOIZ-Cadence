# NOIZ Cadence Avatar Configurator

A React + Three.js experience for browsing and equipping avatar assets sourced from PocketBase.

## Features
- Real-time character preview rendered with React Three Fiber, reusing the shared armature and pose clips in `public/models`.
- Customization UI driven by live PocketBase records, including layer exclusivity and locked bundle handling.
- Responsive panel layout with pose presets, randomization, and screenshot tooling.

## Development
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the Vite dev server:
   ```bash
   npm run dev
   ```
3. Open the printed local URL in your browser.

## Production build
Create an optimized build with:
```bash
npm run build
```
