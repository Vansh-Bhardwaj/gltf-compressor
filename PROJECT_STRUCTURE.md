# Project structure — gltf-compressor (DETAILED)

This document gives a deeper, developer-focused map of the repository so you can find where to make changes, how the main flows work, and how to run and debug locally (PowerShell-ready).

## Quick start (PowerShell)

Open PowerShell in the repository root and run:

```powershell
npm install
npm run dev
```

- Dev server: Vite (default port 5173). Visit http://localhost:5173.
- Build for production: `npm run build` (runs `tsc -b` then `vite build`).
- Preview the production build locally: `npm run preview`.
- Run tests: `npm run test` (Vitest).

Notes:
- Uses TypeScript + Vite. The `@` alias maps to `./src` (see `vite.config.ts` and `tsconfig.json`).
- Most heavy work (texture compression) runs client-side in a Web Worker using OffscreenCanvas.

## High-level architecture (one-paragraph)

Single-page React (TypeScript) app. A user drops a glTF/GLB file; the app creates two glTF-Transform Documents (original + modified), renders both (react-three-fiber), allows interactive texture compression (worker) and mesh/scene transforms at export (glTF-Transform functions). Small zustand stores hold model and viewport state.

## Important top-level files

- `package.json` — dependencies and scripts (dev/build/preview/lint/test).
- `vite.config.ts` — Vite configuration (React + GLSL plugin) and `@` → `src` alias.
- `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json` — TypeScript configs and project references.

## Where to start editing (short guide)

- UI: `src/components/*` — simple UI changes, layout and panels.
- 3D / rendering: `src/components/ModelView.tsx`, `src/components/CameraControls.tsx`, `src/components/Hologram.tsx`.
- glTF I/O and transforms: `src/utils/fileIO.ts` — importing, creating Documents, and `exportDocument`.
- Texture compression flow: `src/utils/textureCompression.ts` and `src/utils/textureCompressionWorker.ts`.
- Texture preview: `src/utils/textureLoading.ts` and `src/components/TextureView.tsx`.

## Key modules & flows (deep dive)

1) Importing files (entry path):
  - `src/components/Dropzone.tsx` uses `react-dropzone` and calls `importFiles(acceptedFiles)` from `src/utils/fileIO.ts`.
  - `importFiles` supports either a single `.glb` or a `.gltf` with external resources. It creates WebIO with extensions and runtime dependencies (Draco/meshopt) and loads the Document(s) either from a blob URL or by embedding external buffers/images as data URIs.
  - After load, it clones the Document to create a `modifiedDocument` and builds a Map<Texture, TextureCompressionSettings> for reactive compression state.

2) State containers (stores):
  - `src/stores/useModelStore.ts` — primary model state
    - Fields: `fileName`, `originalDocument`, `modifiedDocument`, `originalDocumentView`, `modifiedDocumentView`, `originalScene`, `modifiedScene`, `textureCompressionSettingsMap`, `selectedMaterial`, `selectedTextureSlot`, `selectedTexture`, `textureBounds`, `modelStats`.
    - Methods: `updateTextureCompressionSettings(texture, partialSettings)`, `setInitialModelStats()`, `updateModelStats()`.
    - `modelStats` is computed via `inspect(originalDocument)` from `@gltf-transform/functions` and maintained vs. modified document textures.

  - `src/stores/useViewportStore.ts` — UI/viewport state
    - Fields: `loadingFiles`, `revealScene`, `lightingPreset`, `environmentPreset`, `lightIntensity`, `showContactShadows`, `showGrid`, `autoRotateCamera`, `modelDimensions`, `modelViewPanelSize`, `showModifiedDocument`, `confettiCounter`.
    - `triggerConfetti()` is a counter increment used to trigger the confetti effect.

3) Texture preview & loading:
  - `src/components/TextureView.tsx` subscribes to selected texture and uses `loadTexture` (utils) to draw the correct image to a visible canvas.
  - `src/utils/textureLoading.ts` handles:
    - Regular images (jpeg/png/webp): create Blob -> URL -> Image -> draw to offscreen canvas -> copy to visible canvas.
    - KTX2 textures: creates a temporary WebGLRenderer + `KTX2Loader` (transcoder path set to a CDN), renders the KTX2 into a canvas, extracts an image, and draws it to the offscreen canvas.
  - The code uses a load-id pattern (currentLoadId/activeLoadId) to avoid races when multiple load requests overlap.

4) Texture compression flow (worker + API):
  - `src/utils/textureCompression.ts` exposes `compressTexture(originalTexture, settings)` which:
    - Uses `originalTexture.getImage()` to get a Uint8Array image buffer.
    - Posts the image to an inline worker `textureCompressionWorker?worker&inline`.
    - The worker performs resizing via OffscreenCanvas, encodes via `canvas.convertToBlob({type: mimeType, quality})`, and returns a Uint8Array.
    - The main thread receives the compressed bytes and writes them into `compressionSettings.compressedTexture.setImage(...)` and updates the mime type.
  - Worker lifecycle: `getOrCreateWorker()` creates the worker lazily and tracks pending requests via a Map keyed by `req_<num>`.
  - Notes: the worker is imported with `?worker&inline` (bundled inline). For easier debugging you can remove `&inline` or build a separate worker file.

5) Exporting / glTF transforms:
  - `src/components/ExportPanel.tsx` builds UI toggles for draco compression and transforms.
  - `src/utils/fileIO.ts::exportDocument(...)` clones the modified document and conditionally applies transforms using `@gltf-transform/functions`:
    - `dedup()`, `flatten()`, `join()`, `weld()`, `resample()`, `prune()` depending on UI switches.
    - If Draco is enabled, it adds the `KHRDracoMeshCompression` extension and sets encoder options.
    - It also inspects textures and adds or removes `EXT_texture_webp` if WebP textures are present.
  - Writes the final binary via `io.writeBinary(finalDocument)` and triggers a client-side download.
  - Note: `WebIO().registerDependencies(...)` expects runtime decoder/encoder modules. The project references `DracoEncoderModule`, `DracoDecoderModule`, and `MeshoptDecoder/Encoder` from `meshoptimizer`. When editing or adding encoders, maintain these dependencies and their loading.

6) Material highlighting & keyboard interactions:
  - `src/components/MaterialHighlighter.tsx` listens for `KeyX` to highlight all meshes that use the currently selected material in both original and modified scenes and animates a glow via shader uniforms.
  - `ModelView` listens for `C` key toggles (via viewport store subscription) to hide/show original vs modified scenes.

## Implementation notes / gotchas

- KTX2 handling: `textureLoading` uses a Three.js `KTX2Loader` that sets a transcoder path to a CDN. If offline, KTX2 loading will fail. You can change the transcoder path to a locally hosted copy for offline dev.
- Worker bundling: `textureCompressionWorker` is imported with `?worker&inline`. Inline workers are easy to bundle but harder to debug. To make the worker a separate file (easier to debug in browser devtools), import without `&inline` and adjust the build if needed.
- WASM / Draco: in `fileIO.ts`, `WebIO().registerDependencies` calls out to global `DracoEncoderModule`/`DracoDecoderModule` — check where those are provided in the runtime (the browser environment or a script loader). If you see runtime errors about Draco, check these module imports.
- Race conditions: `loadTexture` uses a loadId to avoid showing stale images. When changing texture loading, re-use that pattern to avoid flicker.

## Quick debugging checklist

- Dev server fails to start: verify Node LTS (>=18), remove `node_modules` and reinstall.
- Type errors: run `npm run build` to surface `tsc` type errors.
- Worker errors: open browser devtools (Sources) and inspect the worker (if not inlined). If inlined, console logs will still surface in the main console errors dispatched from the worker.
- glTF/Document problems: add `console.log(inspect(document))` (from `@gltf-transform/functions`) or call `document.listTextures()` to inspect textures and MIME types.

## Useful commands (PowerShell)

```powershell
# Install deps
npm install

# Run dev server
npm run dev

# Build production bundle + types
npm run build

# Preview production build
npm run preview

# Lint
npm run lint

# Test (Vitest)
npm run test
```

## Where to change common behaviors (developer shortcuts)

- To change how a texture is compressed (add support for PNG lossless or different encoders): edit `src/utils/textureCompression.ts` and the worker implementation in `src/utils/textureCompressionWorker.ts`.
- To change how Documents are loaded (e.g., to add support for additional buffer URI rules): edit `src/utils/fileIO.ts::createDocumentsAndSceneFromBuffers`.
- To change keyboard controls (C/X): search for `KeyC` and `KeyX` handlers in `src/components/ModelView.tsx` and `src/components/MaterialHighlighter.tsx`.

## Small suggested improvements (low-risk)

- Add a `DEVELOPMENT.md` in `src/` summarizing the 3D vs UI edit points and common tasks (run dev, rebuild types).
- Add a small Vitest smoke test that mounts `App` (JS DOM) to ensure the app bootstraps without throwing (helpful for CI).
- Provide a non-inlined worker for easier debugging during development.

---

If you'd like, I can now:
- Add a `src/DEVELOPMENT.md` with a concise editing checklist and common code pointers.
- Add a minimal Vitest smoke test and run it.
# Project structure — gltf-compressor

This file maps the repository's main files and folders to their purpose and gives concise instructions to run and modify the site locally.

## Quick start (PowerShell)

Open PowerShell in the repository root and run:

```powershell
npm install
npm run dev
```

- The app runs using Vite (default port 5173). Visit http://localhost:5173.
- Build for production: `npm run build` (runs `tsc -b` then `vite build`).
- Preview the production build locally: `npm run preview`.
- Run tests: `npm run test` (uses Vitest).

Notes:
- This repository uses TypeScript and Vite. Types are built with `tsc -b` as part of `npm run build`.
- The `@` alias maps to `./src` (see `vite.config.ts` and `tsconfig.json`).

## Top-level files

- `package.json` — scripts and dependencies. Key scripts:
  - `dev`: starts Vite dev server
  - `build`: runs TypeScript build and Vite build
  - `preview`: serves the built app
  - `lint`: runs ESLint
  - `test`: runs Vitest
- `vite.config.ts` — Vite configuration (React plugin + glsl loader). Also defines the `@` alias to `src`.
- `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json` — TypeScript configuration and project references.
- `postcss.config.js`, `tailwind` deps — styling flow uses Tailwind CSS (see postcss and tailwind configs).
- `README.md` — project overview and quick run instructions.

## src/

This is the application source. Major subfolders and files:

- `main.tsx` — application entry-point (React root). Renders `App` into `#root`.
- `App.tsx` — top-level app layout and routing of main views. Uses `react-resizable-panels` to split the UI into model view and texture/settings panels.

### src/components/
Contains UI and 3D view components. Notable files:
- `ModelView.tsx` — the Three.js/react-three-fiber canvas, scene rendering, camera controls, gizmo, and render logic for original/modified scenes. This is where most 3D rendering behavior lives.
- `TextureView.tsx` — canvas-based texture preview and logic to load/paint textures (uses `loadTexture` from `utils/textureLoading`).
- `Dropzone.tsx` — drag-and-drop area for loading glTF/glb files and resources.
- `ExportPanel.tsx` — UI for exporting compressed glTF/GLB.
- `SettingsView.tsx` — right-side panel with global settings for compression and model export.
- `StatsView.tsx` — displays size/stats for original vs compressed.
- `MaterialEditingPanel.tsx`, `MaterialHighlighter.tsx` — editing and highlighting materials.
- `CameraControls.tsx` — input handling and camera controls for the 3D view.
- `ThemeProvider.tsx` — theme (dark/light) wrapper.
- `TextureViewStatus.tsx` — shows texture compression status UI.
- `drei/` — small reexports / helpers built from `@react-three/drei` (e.g., `Stage`, `Grid`, `Center`).
- `ui/` — small UI primitives (button, input, slider, tooltip, etc.).

Files under `src/components` are the main edits you'll make when changing UI or 3D behavior.

### src/stores/
- `useModelStore.ts` — zustand store that holds the loaded glTF Document(s), selected texture, compression settings, scenes, and related getters/setters.
- `useViewportStore.ts` — zustand store with viewport and UI state (panel sizes, toggles like `showModifiedDocument`, `revealScene`, etc.).

### src/utils/
Utility logic used across the app:
- `fileIO.ts` — functions to import and export glTF/glb files, convert buffers, and create live Document views (uses `@gltf-transform` and its extensions). Important functions: `importFiles`, `exportDocument`.
- `textureLoading.ts` — loads textures for preview and uses KTX2 loader when needed.
- `textureCompression.ts`, `textureCompressionWorker.ts` — logic and worker for compressing textures (off-main-thread compression flow).
- `textureUtils.ts` — helpers to update canvas bounds and compute texture display sizes.
- `displayUtils.ts` — small display helpers.
- `materialHighlighting.ts` — helper logic for material highlight overlays.

### src/lib/
- `utils.ts` — small helper (`cn` for clsx + tailwind merge). Keep stable utilities here.

### src/shaders/
GLSL shader files grouped by feature (confetti, grid, hologram). These are loaded with `vite-plugin-glsl` so you can import them from components.

### src/types/
- Type definitions and glsl declarations.

### public/
- Static assets that will be served as-is. Demo images and other static resources live here.

## How files interact (high-level flow)

1. User drops a file into `Dropzone`.
2. `importFiles` in `src/utils/fileIO.ts` parses files (via `@gltf-transform` WebIO), produces two Documents (original + modified), and builds a `textureCompressionSettingsMap`.
3. The `useModelStore` is populated with the documents and scenes; `ModelView` and `TextureView` subscribe to the store and render the original/modified scenes and texture canvases.
4. When the user updates compression settings, `textureCompression.ts` (and its worker) perform operations, update the `useModelStore` map, and views update reactively.
5. When the user exports, `exportDocument` in `fileIO.ts` runs final transforms (draco, dedup, resample, etc.) and triggers a download.

## Editing & development tips

- Entry point for UI changes: edit components under `src/components/`.
- Entry point for 3D/render behavior: `src/components/ModelView.tsx`, `src/components/CameraControls.tsx`, `src/components/Hologram.tsx`.
- For utility logic, edit files under `src/utils/` and tests under `src/__tests__` (if present).
- If you add new imports using `@/path`, remember the `@` alias is configured in `vite.config.ts` and `tsconfig.json`.
- GLSL files live in `src/shaders/`; the project uses `vite-plugin-glsl` so import them as modules in components.

## Troubleshooting

- If the dev server fails to start:
  - Ensure Node.js LTS (>= 18) is installed.
  - Remove `node_modules` and reinstall: `rm -r node_modules package-lock.json` (or use PowerShell `Remove-Item -Recurse node_modules,package-lock.json`) and `npm install`.
  - If TypeScript errors block the build, run `npm run build` to see `tsc` output.
- Vite default port is 5173. If another process uses it, run `npm run dev -- --port 3000` or set `PORT` environment variable.
- If editing shader files or adding new wasm deps, restart the dev server.

## Useful commands

```powershell
# Install deps
npm install

# Run dev server
npm run dev

# Build production bundle
npm run build

# Preview the production build
npm run preview

# Lint
npm run lint

# Test (Vitest)
npm run test
```

## Next steps / suggested improvements

- Add a CONTRIBUTING guide describing common code patterns and how to run tests locally.
- Add a brief developer README inside `src/components/` describing where to look for 3D vs UI code.
- Add a simple smoke test that mounts `App` in JSDOM and verifies render (Vitest + React Testing Library).

---

If you'd like, I can:
- Add a small developer README under `src/` with edit pointers.
- Add a quick automated smoke test and run it.

