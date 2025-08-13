I want to create a **TypeScript horn profile math library** for loudspeaker horn design.
Requirements:
**1. Profiles to implement** (all return an array of `[x, radius]` points along the horn length):
* **Conical**
* **Exponential** (classic and modified exponential)
* **Tractrix**
* **Le Cléac’h**
* **JMLC**
* **Oblate Spheroid**
* **Parabolic**
* **Hyperbolic-Exponential**
* **Spherical wave**
Each profile function should plug in to our utils

**2. Decouple profile from cross-section shape**
* Do not assume circular cross-sections.
* This library only handles the *1D profile* along the horn axis (distance vs. radius).
* Later, a separate geometry function will apply circular, rectangular, elliptical, or custom cross-sections to this profile to create the 3D horn geometry. Make sure our Util functions support this.
**3. Organization**
* Place each profile function in its own file in `src/profiles/`.
* Export them from an `index.ts` in `src/profiles/`.
* Also export a `ProfileType` enum with all supported profiles.
**4. Extensibility**
* Write the code so adding a new profile is as simple as adding a new function file and updating the enum.
