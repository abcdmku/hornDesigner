# **Prompt — Unified Horn Generator v2 (Profiles + Cross-Sections + R3F + Acoustics)**

**Goal:** Implement a **client-side TypeScript horn designer** with:

* 1D horn **profiles** (`r(z)` vs `z`) for 11+ horn types (conical, exponential, hypex, tractrix, JMLC, oblateSpheroid, spherical, parabolic, hyperbolicSpiral, WN/ALO, PETF).
* **Cross-section shaping**: circle, ellipse, superellipse, rectangular, stereographic.
* **3D geometry** pipeline: rings → indexed BufferGeometry with normals.
* **R3F components** (`HornMesh`, `Controls`, `AppV2`) with Leva UI.
* **Acoustic simulation**: TL solver (1D Webster), on-axis SPL, phase, throat impedance.
* **Directivity simulation**: polar plots, azimuth/elevation, FFT-based for arbitrary mouths.
* **Exports**: STL/OBJ, Hornresp input, CSV/JSON (profiles, H\_horn, Z\_throat, directivity).
* Fully modular, tree-shakeable, typed, browser-runnable (WebWorker/WASM allowed).
* **Tests**: profiles, area consistency, Newton convergence, TL solver vs Hornresp, analytic piston directivity.

---

## **Folder Structure (`v2/`)**

```
v2/
├─ profiles/
│  ├─ conical.ts
│  ├─ exponential.ts
│  ├─ hypex.ts
│  ├─ tractrix.ts
│  ├─ jmlc.ts
│  ├─ oblateSpheroid.ts
│  ├─ spherical.ts
│  ├─ parabolic.ts
│  ├─ hyperbolicSpiral.ts
│  ├─ wnAlo.ts
│  ├─ petf.ts
│  └─ index.ts            # exports all profiles + ProfileType enum
├─ math/
│  ├─ hornMath.ts         # flare solvers, Gamma, areaSuperellipse, scheduleN, stereographic
│  ├─ protoDirectivity.ts # Rayleigh/Hankel/FFT far-field integrators
│  ├─ tlSolver.ts         # 1D TL/Webster solver (complex H_horn, Z_throat)
│  └─ numericUtils.ts     # Newton/Bisection, FFT, Lanczos gamma
├─ geometry/
│  ├─ hornGeometry.ts     # rings → BufferGeometry builder, stereographic mapper
│  ├─ csgHelpers.ts       # optional CSG mounting/flanges
│  └─ exporters.ts        # STL/OBJ + Hornresp exporter
├─ ui/
│  ├─ HornMesh.tsx        # R3F component
│  ├─ Controls.tsx        # Leva param panel
│  └─ AppV2.tsx           # Demo + presets
├─ tests/
│  ├─ hornMath.spec.ts
│  ├─ protoDirectivity.spec.ts
│  └─ tlSolver.spec.ts
└─ README.md              # usage + references
```

---

## **1) Profiles (`v2/profiles`)**

* Pure 1D: return `ProfilePoint[]` `{ z: number; r: number }`.
* Input:

```ts
interface ProfileParams {
  throatRadius: number;
  mouthRadius: number;
  length: number;
  segments: number;
  [key: string]: any; // optional profile-specific params
}
```

* Implement: conical, exponential, hypex, tractrix (true-expansion), JMLC, oblateSpheroid, spherical, parabolic, hyperbolicSpiral, WN/ALO, PETF.
* Decoupled from cross-section.
* Export enum `ProfileType` and all profile functions in `index.ts`.

---

## **2) Cross-Section Modes (`hornMath.ts`)**

```ts
type CrossSectionMode = "circle" | "ellipse" | "superellipse" | "rectangular" | "stereographic";

interface CrossSectionSpec {
  mode: CrossSectionMode;
  aspect?: number;
  n_schedule?: { start:number; end:number; easing:"linear"|"cubic" };
  stereographic?: { fp?: number; normalize?: boolean };
  rectangular?: RectangularSpec;
}
```

* Area-matched and dimension-matched rectangular/superellipse computation.
* H/V different flare laws via `hv_diff`.
* `scheduleN(z)` for superellipse exponents with linear/cubic easing.
* Area computations: `areaRound(z)`, `areaSuperellipse(a,b,n)`.
* Newton–Raphson + bisection fallback for implicit solves.

---

## **3) Geometry (`hornGeometry.ts`)**

* `profileToRings(profile, cross, thetaDivs) → Float32Array[]`
* `ringsToGeometry(rings, thetaDivs) → BufferGeometry`
* Supports stereographic, superellipse, seam wrapping, indexed triangles, normals, `DoubleSide`.
* WebWorker path for >50k vertices.

---

## **4) R3F Components**

* **HornMesh.tsx**: memoized geometry + mesh, optional pressure coloring.
* **Controls.tsx**: Leva UI for profile, cross-section, H/V flare, thetaDivs, dz, frequency sampling.
* **AppV2.tsx**: 3 presets (baseline circular exponential, PETF H/V rectangular, stereographic spherical), compute/export buttons.

---

## **5) Acoustic Core**

* **TL Solver (`tlSolver.ts`)**: 1D Webster solver, complex `H_horn(f)` and `Z_throat(f)`.
* **Directivity (`protoDirectivity.ts`)**: Rayleigh/Hankel/FFT for circular, superellipse, rectangular mouths.
* Frequency response, on-axis SPL, phase, group delay, polar plots (azimuth/elevation).
* Driver integration: `Sys(f) = D(f) * H_horn(f)`.

---

## **6) Exports**

* STL/OBJ (`exporters.ts`)
* Hornresp input file
* CSV/JSON: `{z,r}`, `H_horn(f)`, `Z_throat(f)`, polar directivity slices.

---

## **7) Tests**

* **hornMath.spec.ts**: Gamma/Lanczos, areaSuperellipse, scheduleN, profile throat→mouth match.
* **tlSolver.spec.ts**: compare TL solver vs Hornresp for canonical horns.
* **protoDirectivity.spec.ts**: analytic piston checks for circular/elliptical apertures.
* Area drift, convergence, n(z) schedules.

---

## **8) References (inline comments)**

* Stereographic: [link](https://sphericalhorns.net/2019/08/02/a-normalized-stereographic-projection-for-spherical-horns/)
* Superellipse/ellipsoidal: [link](https://sphericalhorns.net/2019/08/05/ellipsoidal-wave-fronts-in-horns/)
* PETF: [link](https://sphericalhorns.net/2020/12/14/progressive-expansion-t-factor-horns/)
* JMLC: [link](https://sphericalhorns.net/2020/12/21/jmlc-inspired-horn-calculator/)
* True-Expansion Tractrix: [link](https://sphericalhorns.net/2019/08/30/a-true-expansion-tractrix-horn/)
* Hyperbolic Spiral: [link](https://sphericalhorns.net/2020/04/06/spiral-functions-for-horns1/)
* William Neile/ALO: [link](https://sphericalhorns.net/2022/09/20/acoustic-loading-optimized-william-neile-horns-part-2)

---

## **9) Acceptance Criteria**

1. All 5 cross-section modes selectable at runtime and render in R3F.
2. Rectangular mode supports `match_area` & `match_dimensions`, reports mouth area drift.
3. TL solver outputs `H_horn(f)`, `Z_throat(f)`, SPL/phase for sample driver; exportable.
4. Directivity polar plots (azimuth/elevation) with CSV export.
5. Tests pass: profiles, area consistency, TL solver vs Hornresp, analytic piston directivity.
6. Performance: ≤100k vertices interactive; worker used if heavy.
7. Fully typed, modular, documented.
