**Prompt for Claude Code:**

 I am building a **client-side-only web app** using **React 19, Tailwind CSS, and react-three-fiber (R3F)** to let users design and preview audio horns (round or rectangular) with various expansion profiles, mounting plates, and compression driver flanges.

 I already have a horn modeling library with these functions:

 ```ts
 import { generateHornProfile, generateMountingFlangeGeometry, generateDriverMountGeometry } from "./hornLib";
 ```

 * `generateHornProfile(params)` → Returns `THREE.BufferGeometry` for the horn body based on user params (mouth/throat size, length, expansion type, round/rectangular cross-section).
 * `generateMountingFlangeGeometry(params)` → Returns `THREE.BufferGeometry` for the mounting plate, with bolt holes.
 * `generateDriverMountGeometry(params)` → Returns `THREE.BufferGeometry` for the compression driver flange/mount, with bolt holes.

 I need you to create a **full UI** that:

 1. **Has a sidebar form** for:

    * Horn type dropdown (Exponential, Tractrix, Conical, Le Cléac’h, JMLC, Oblate Spheroid, etc.)
    * Mouth shape dropdown (Round or Rectangular)
    * Mouth width/height (mm)
    * Throat width/height (mm)
    * Horn length (mm)
    * Number of segments for profile smoothness
    * Mounting plate options: width, height, bolt hole diameter, number of holes, bolt circle radius.
    * Driver mount options: flange diameter, bolt circle diameter, number of holes, bolt hole diameter.
    * Material selection for printing (PLA, PETG, ABS, Resin).
 2. **Has a 3D preview** using R3F and drei OrbitControls, showing:

    * The horn body (from `generateHornProfile`)
    * The mounting flange (from `generateMountingFlangeGeometry`)
    * The driver flange (from `generateDriverMountGeometry`)
    * All parts merged into one object for STL export (use `three-csg-ts`).
 3. **Calculates print cost**:

    * Estimate volume from geometry → mass using material density.
    * Multiply by \$/gram for selected material + flat labor fee + margin.
    * Display live cost estimate.
 4. **Exports STL**:

    * Button to generate merged STL of horn + flanges.
    * Trigger download with filename `horn_assembly.stl`.
 5. **All calculations run client-side** — no backend calls.

 Please produce:

 * A complete `App.tsx` with the UI layout.
 * Tailwind-based styling for the sidebar.
 * The R3F canvas setup with camera + OrbitControls.
 * State handling for the form → geometry → preview updates.
 * STL export logic using `threejs-stl-exporter`.
 * Cost calculation function with placeholder material prices and densities.

 Make sure the generated code is ready to paste into a new Vite + React + Tailwind project, assuming the hornLib.ts file exists in the `src` folder.
