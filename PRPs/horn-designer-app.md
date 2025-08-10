# Horn Designer 3D Web Application - PRP

## Goal
Build a complete client-side-only web application using **React 19, Tailwind CSS, and react-three-fiber (R3F)** that allows users to design and preview audio horns with various expansion profiles, mounting plates, and compression driver flanges. The app must provide real-time 3D preview, cost calculation, and STL export functionality.

## Critical Context & Documentation

### Core Technologies & Resources

#### React Three Fiber (R3F) - 2025 Best Practices
- **Documentation**: https://r3f.docs.pmnd.rs/getting-started/introduction
- **Examples**: https://r3f.docs.pmnd.rs/getting-started/examples
- **Key Point**: @react-three/fiber@9 pairs with react@19. Fiber is compatible with React v19
- **Ecosystem Libraries**:
  - `@react-three/drei` – useful helpers and utilities (OrbitControls, etc.)
  - `@react-three/gltfjsx` – converts GLTFs into JSX components
  - Performance: No overhead, components render outside React, outperforms vanilla Three.js due to React's scheduling

#### CSG Boolean Operations
- **Library**: `three-csg-ts` (TypeScript rewrite of THREE-CSGMesh)
- **NPM**: https://www.npmjs.com/package/three-csg-ts
- **GitHub**: https://github.com/samalexander/three-csg-ts
- **Operations**: `.subtract`, `.union`, `.intersect` using BSP (binary space partitioning) tree
- **Critical Pattern**:
```typescript
import { CSG } from 'three-csg-ts';

// ALWAYS call updateMatrix() before CSG operations
mesh1.updateMatrix();
mesh2.updateMatrix();

// Perform operations
const result = CSG.union(mesh1, mesh2);
```

#### STL Export
- **Primary Option**: Official Three.js `STLExporter` from 'three/addons/exporters/STLExporter.js'
- **Documentation**: https://threejs.org/docs/examples/en/exporters/STLExporter.html
- **Example**: https://threejs.org/examples/misc_exporter_stl.html
- **Critical Pattern**:
```typescript
import { STLExporter } from 'three/addons/exporters/STLExporter.js';

const exporter = new STLExporter();
const options = { binary: true }; // binary: true returns Buffer, false returns ASCII string
const result = exporter.parse(mesh, options);
```

#### Tailwind CSS Sidebar & Forms
- **Official Components**: https://tailwindcss.com/plus/ui-blocks/application-ui/application-shells/sidebar
- **Form Layouts**: https://tailwindcss.com/plus/ui-blocks/application-ui/forms/form-layouts
- **Sidebar Navigation**: https://tailwindcss.com/plus/ui-blocks/application-ui/navigation/sidebar-navigation

#### 3D Printing Cost Calculation
- **Formula**: Material cost = material unit price × usage weight
- **Volume to Mass**: mass = volume × density
- **Material Densities**:
  - PLA: 1.25 g/mm³, $0.05-$0.15 per gram
  - PETG: ~1.25 g/mm³, $0.06-$0.18 per gram  
  - ABS: ~1.04 g/mm³, $0.05-$0.15 per gram
  - Resin: ~1.1 g/mm³, $0.70-$3.00 per gram

### Existing Codebase Assets
- **Horn Library**: `examples/hornLib.ts` contains complete geometry generation functions
- **Functions Available**:
  - `buildHornAssembly(hornParams, plateParams, driverParams): THREE.Mesh`
  - `buildHorn(params): THREE.Mesh` 
  - `buildMountPlate(hornParams, plateParams): THREE.Mesh`
  - `buildDriverFlange(params): THREE.Mesh`
- **Interfaces**: `HornProfileParams`, `MountPlateParams`, `DriverMountParams`

## Validation Loop

### Level 1: Project Setup & Dependencies
```bash
# Initialize Vite + React + TypeScript project
npm create vite@latest . -- --template react-ts
npm install

# Install required dependencies
npm install three @types/three @react-three/fiber @react-three/drei
npm install three-csg-ts
npm install tailwindcss postcss autoprefixer
npm install file-saver @types/file-saver

# Setup Tailwind
npx tailwindcss init -p

# Expected: All packages install without conflicts, Tailwind config created
```

### Level 2: Type Checking & Linting
```bash
# Type checking - MUST pass before proceeding
npx tsc --noEmit

# If using ESLint
npx eslint src/ --ext .ts,.tsx --fix

# Expected: No type errors, clean linting
```

### Level 3: Functional Testing
```bash
# Start development server
npm run dev

# Manual testing checklist:
# - Form inputs update 3D preview in real-time ✓
# - All horn types render correctly ✓  
# - CSG operations create solid geometry ✓
# - Cost calculation updates live ✓
# - STL export downloads valid file ✓
```

## Implementation Blueprint

### Task 1: Project Setup & Basic Structure
**FOLLOW PATTERN**: Standard Vite + React + Tailwind setup
```typescript
// tailwind.config.js - CRITICAL: Include all content paths
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: { extend: {} },
  plugins: [],
}

// src/main.tsx - Standard React 19 setup
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

### Task 2: Horn Library Integration
**MIRROR PATTERN**: Copy `examples/hornLib.ts` to `src/lib/hornLib.ts`
**MODIFY**: Export interfaces and functions for use in React components
```typescript
// CRITICAL: Ensure all interfaces are exported
export { HornProfileParams, MountPlateParams, DriverMountParams };
export { buildHornAssembly, buildHorn, buildMountPlate, buildDriverFlange };
```

### Task 3: State Management Setup
**PATTERN**: Use React 19 useState with TypeScript interfaces
```typescript
// src/types/index.ts - Central type definitions
export interface AppState {
  hornParams: HornProfileParams;
  plateParams: MountPlateParams;  
  driverParams: DriverMountParams;
  selectedMaterial: MaterialType;
}

export interface MaterialType {
  name: string;
  density: number; // g/mm³
  costPerGram: number; // $/gram
}
```

### Task 4: Tailwind Sidebar Form Component
**FOLLOW PATTERN**: Official Tailwind sidebar navigation patterns
**REFERENCE**: https://tailwindcss.com/plus/ui-blocks/application-ui/navigation/sidebar-navigation
```typescript
// src/components/ParameterSidebar.tsx
// PATTERN: Fixed sidebar with form sections
// STRUCTURE: Header -> Horn Parameters -> Mounting -> Driver -> Material -> Cost Display
// STYLING: Use Tailwind utility classes, avoid custom CSS
```

### Task 5: R3F Canvas & 3D Scene Setup  
**FOLLOW PATTERN**: Standard R3F Canvas with drei OrbitControls
**REFERENCE**: https://r3f.docs.pmnd.rs/getting-started/your-first-scene
```typescript
// src/components/Scene3D.tsx
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'

// PATTERN: Canvas wrapper with scene, camera, lighting, controls
// GOTCHA: Set up proper lighting for material visualization
// PERFORMANCE: Use React.memo for geometry components
```

### Task 6: Geometry Rendering Component
**INTEGRATE**: hornLib functions with R3F mesh rendering
**CRITICAL**: Handle CSG operations and geometry updates properly
```typescript
// src/components/HornGeometry.tsx  
// PATTERN: useEffect to regenerate geometry when params change
// GOTCHA: Always call updateMatrix() before CSG operations
// PERFORMANCE: Dispose of old geometries to prevent memory leaks
```

### Task 7: Cost Calculation System
**IMPLEMENT**: Real-time volume-based cost calculation
```typescript
// src/utils/costCalculator.ts
// FORMULA: volume = geometry.boundingBox * fillRatio (assume 15% infill)
// FORMULA: mass = volume * material.density  
// FORMULA: cost = mass * material.costPerGram + laborCost + margin
```

### Task 8: STL Export Functionality
**USE**: Official Three.js STLExporter
**PATTERN**: Export merged geometry as binary STL
```typescript
// src/utils/stlExporter.ts
import { STLExporter } from 'three/addons/exporters/STLExporter.js';
import { saveAs } from 'file-saver';

// GOTCHA: Ensure geometry is merged and manifold before export
// PATTERN: Use binary format for smaller file size
```

### Task 9: Form Validation & Error Handling
**PATTERN**: TypeScript compile-time + runtime validation
```typescript
// Validate geometric constraints (throat < mouth, positive dimensions)
// Handle CSG operation failures gracefully
// Display user-friendly error messages
```

### Task 10: Performance Optimization
**IMPLEMENT**: React.memo, useMemo for expensive calculations
**PATTERN**: Debounce parameter updates to avoid excessive re-renders
```typescript
// Use React.useMemo for geometry generation
// Use React.useCallback for event handlers  
// Implement proper cleanup in useEffect
```

## Critical Gotchas & Anti-Patterns

### CSG Operations
- ❌ **DON'T** skip calling `updateMatrix()` before CSG operations
- ❌ **DON'T** perform CSG on every render - use memoization
- ✅ **DO** handle CSG failures gracefully (may fail on complex geometry)

### R3F Performance
- ❌ **DON'T** create new geometries on every render
- ❌ **DON'T** forget to dispose of old geometries
- ✅ **DO** use React.memo for expensive 3D components

### Three.js Integration  
- ❌ **DON'T** mix imperative Three.js code with R3F declarative patterns
- ✅ **DO** use R3F hooks and patterns consistently

### STL Export
- ❌ **DON'T** export before CSG operations are complete
- ✅ **DO** ensure geometry is manifold (watertight) before export

## Material Costs Reference Data
```typescript
export const MATERIALS: MaterialType[] = [
  { name: 'PLA', density: 1.25, costPerGram: 0.10 },
  { name: 'PETG', density: 1.25, costPerGram: 0.12 },  
  { name: 'ABS', density: 1.04, costPerGram: 0.10 },
  { name: 'Resin', density: 1.1, costPerGram: 1.50 }
];
```

## Horn Types Reference Data
```typescript
export const HORN_TYPES = [
  'exponential', 'tractrix', 'conical', 'le-cleach', 'jmlc', 'oblate-spheroid'
];
```

## Final Validation Checklist
- [ ] All dependencies installed correctly: `npm install` succeeds
- [ ] No TypeScript errors: `npx tsc --noEmit` passes  
- [ ] Development server starts: `npm run dev` works
- [ ] Form inputs trigger 3D preview updates in real-time
- [ ] All horn expansion types render valid geometry
- [ ] CSG operations produce solid merged geometry
- [ ] Cost calculation displays reasonable values ($1-500 range)
- [ ] STL export downloads valid binary file (>0KB, opens in 3D software)
- [ ] Responsive design works on different screen sizes
- [ ] No console errors in browser developer tools

## Quality Score: 9/10

**Confidence Level**: Very High - All necessary context provided including:
- ✅ Complete documentation links with specific URLs
- ✅ Working example code from existing hornLib.ts
- ✅ Specific library versions and compatibility info  
- ✅ Material cost data and calculation formulas
- ✅ Critical gotchas and anti-patterns documented
- ✅ Step-by-step validation gates with executable commands
- ✅ Performance optimization patterns included

**Deduction (-1)**: Complex 3D geometry operations may require iterative refinement of CSG parameters and geometry generation logic based on real-world testing.

The PRP provides comprehensive context for successful one-pass implementation of a production-ready horn designer application.