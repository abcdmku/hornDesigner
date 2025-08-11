name: "Bolt Hole Rendering Performance Optimization"
description: |

## Goal
Optimize 3D rendering performance when models contain many bolt holes, reducing render time from seconds to milliseconds through advanced Three.js optimization techniques including geometry merging, instancing, LOD systems, and CSG alternatives.

## Problem Analysis
Current implementation creates performance bottlenecks when rendering models with many bolt holes:
- Each bolt hole requires individual CSG subtract operations (lines 141-143 in HornGeometryAdvanced.tsx:104-150)
- No geometry reuse - new cylinder geometry created for each hole (lines 25-36 in GeometryUtils.ts:12-40)
- No LOD system - complex models render at full detail regardless of camera distance
- CSG operations use traditional BSP trees which are computationally expensive

## Research Findings

### Current Implementation Analysis
Located in `src/components/SimpleHornGeometry.tsx` and `src/components/GeometryUtils.ts`:
- CSG operations handled by `three-csg-ts` library (line 2 in HornGeometryAdvanced.tsx)
- Performance monitoring already implemented (lines 63-65 in SimpleHornGeometry.tsx:34-75)
- Geometry cleanup on unmount (lines 20-32 in SimpleHornGeometry.tsx:15-32)
- Fallback geometries for CSG failures (lines 501-503 in SimpleHornGeometry.tsx:366-504)

### Performance Optimization Research
Based on 2025 Three.js optimization best practices:

**1. three-bvh-csg Library (100x Performance Improvement)**
- https://www.npmjs.com/package/three-bvh-csg
- Uses BVH (Bounding Volume Hierarchy) instead of BSP trees
- "More than 100 times faster than other BSP-based three.js CSG libraries in complex cases"
- Installation: `npm i three-bvh-csg`

**2. Geometry Merging with BufferGeometryUtils**
- https://threejs.org/docs/#examples/en/utils/BufferGeometryUtils.mergeBufferGeometries
- Merge multiple bolt hole geometries into single BufferGeometry
- Reduces draw calls significantly

**3. InstancedMesh for Repeated Geometries**
- https://threejs.org/docs/api/en/objects/InstancedMesh.html
- "Hundreds of thousands of objects in a single draw call"
- Perfect for bolt holes with same geometry, different positions

**4. LOD System with React Three Drei**
- https://r3f.docs.pmnd.rs/advanced/scaling-performance
- `<Detailed distances={[0, 10, 20]}>` component for automatic LOD
- Different detail levels based on camera distance

## Implementation Blueprint

### Strategy 1: Geometry Merging + Instancing (Recommended)
```typescript
// Instead of individual CSG operations, create merged hole geometries
function createOptimizedBoltHoles(positions: Vector3[], holeParams: HoleParams): THREE.BufferGeometry {
  // Create single cylinder geometry
  const baseHoleGeom = new THREE.CylinderGeometry(
    holeParams.diameter / 2,
    holeParams.diameter / 2,
    holeParams.thickness * 1.1,
    8 // Reduced segments for performance
  );
  
  // Create array of positioned geometries
  const holeGeometries = positions.map(pos => {
    const geom = baseHoleGeom.clone();
    geom.translate(pos.x, pos.y, pos.z);
    return geom;
  });
  
  // Merge all holes into single geometry
  return BufferGeometryUtils.mergeBufferGeometries(holeGeometries);
}
```

### Strategy 2: three-bvh-csg Integration
```typescript
import * as THREE from 'three';
import { Brush, Evaluator } from 'three-bvh-csg';

function createFastCSGHoles(baseMesh: THREE.Mesh, holePositions: Vector3[]): THREE.BufferGeometry {
  const evaluator = new Evaluator();
  const baseBrush = new Brush(baseMesh.geometry);
  
  // Create merged hole brush
  const mergedHoleGeometry = createOptimizedBoltHoles(holePositions, holeParams);
  const holeBrush = new Brush(mergedHoleGeometry);
  
  // Single CSG operation instead of multiple
  const result = evaluator.evaluate(baseBrush, holeBrush, 'subtract');
  return result.geometry;
}
```

### Strategy 3: LOD Implementation
```typescript
import { Detailed } from '@react-three/drei';

function OptimizedHornWithLOD({ distance }: { distance: number }) {
  const highDetailHoles = useMemo(() => createDetailedHoles(32), []);
  const midDetailHoles = useMemo(() => createDetailedHoles(16), []);
  const lowDetailHoles = useMemo(() => createDetailedHoles(8), []);
  
  return (
    <Detailed distances={[0, 200, 500]}>
      <mesh geometry={highDetailHoles} />
      <mesh geometry={midDetailHoles} />
      <mesh geometry={lowDetailHoles} />
    </Detailed>
  );
}
```

## Task Breakdown

### Task 1: Install and Setup Performance Libraries
```bash
npm install three-bvh-csg BufferGeometryUtils
npm install @react-three/drei # Already installed, verify version
```

### Task 2: Create Performance Optimization Utils
MODIFY src/components/GeometryUtils.ts:
- ADD: `createMergedBoltHoles()` function using BufferGeometryUtils
- ADD: `createInstancedBoltHoles()` function using InstancedMesh
- ADD: `createFastCSGHoles()` function using three-bvh-csg
- PRESERVE: Existing calculateRadii and other utility functions

### Task 3: Implement LOD System
CREATE src/components/OptimizedHornGeometry.tsx:
- PATTERN: Follow SimpleHornGeometry.tsx structure (line 14-143)
- ADD: `<Detailed />` component for LOD
- ADD: Performance monitoring similar to lines 63-65 in SimpleHornGeometry.tsx
- INCLUDE: Multiple detail levels for bolt holes

### Task 4: Add Performance Monitoring Component
CREATE src/components/PerformanceMonitor.tsx:
- PATTERN: Follow Scene3D.tsx structure for R3F components
- ADD: r3f-perf integration for real-time performance monitoring
- ADD: Dynamic quality adjustment based on FPS

### Task 5: Implement Geometry Caching System
MODIFY src/components/SimpleHornGeometry.tsx:
- ADD: Geometry cache using Map<string, THREE.BufferGeometry>
- PATTERN: Use useMemo pattern from lines 35-75
- ADD: Cache invalidation based on parameter hash

### Task 6: Create Performance Settings
MODIFY src/components/ParameterSidebar.tsx:
- ADD: Performance mode selector (High/Medium/Low quality)
- ADD: CSG operation toggle (Enable/Disable holes)
- PATTERN: Follow existing parameter input patterns

### Task 7: Optimize Existing CSG Operations
MODIFY src/components/HornGeometryAdvanced.tsx:
- REPLACE: traditional CSG with three-bvh-csg on lines 104-150
- ADD: Batch hole creation instead of individual operations
- PRESERVE: Error handling and fallback patterns (lines 145-149)

## Integration Points

### Dependencies
```json
// package.json additions
"dependencies": {
  "three-bvh-csg": "^0.0.17",
  "r3f-perf": "^7.2.1"
}
```

### Import Patterns
```typescript
// Follow existing import pattern from HornGeometryAdvanced.tsx:1-4
import { BufferGeometryUtils } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { Brush, Evaluator } from 'three-bvh-csg';
import { Detailed, PerformanceMonitor } from '@react-three/drei';
```

### Configuration
```typescript
// Add to src/constants/index.ts
export const PERFORMANCE_SETTINGS = {
  HIGH: { holeSegments: 16, hornSteps: 30, enableCSG: true },
  MEDIUM: { holeSegments: 12, hornSteps: 20, enableCSG: true },
  LOW: { holeSegments: 8, hornSteps: 15, enableCSG: false }
};
```

## Validation Loop

### Level 1: Syntax & Style
```bash
# Run these FIRST - fix any errors before proceeding
npx eslint src/ --fix
npx tsc --noEmit
# Expected: No errors. If errors, READ the error and fix.
```

### Level 2: Performance Benchmarking
```typescript
// CREATE test/performance.test.ts for benchmarking
import { performance } from 'perf_hooks';

describe('Bolt Hole Rendering Performance', () => {
  test('renders 50 bolt holes under 100ms', async () => {
    const start = performance.now();
    const geometry = createOptimizedBoltHoles(generate50HolePositions(), holeParams);
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(100);
  });
  
  test('CSG operations complete under 200ms', async () => {
    const start = performance.now();
    const result = createFastCSGHoles(baseMesh, holePositions);
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(200);
  });
});
```

```bash
# Run performance tests
npx vitest run test/performance.test.ts
# Expected: All performance tests pass under time limits
```

### Level 3: Visual Quality Validation
```bash
# Start development server
npm run dev

# Test in browser with many bolt holes:
# 1. Set bolt count to 50+ in UI
# 2. Monitor FPS with browser dev tools
# 3. Verify holes render correctly at different distances
# Expected: Smooth 60 FPS with 50+ bolt holes
```

## Final Validation Checklist
- [ ] All tests pass: `npx vitest run`
- [ ] No linting errors: `npx eslint src/`
- [ ] No type errors: `npx tsc --noEmit`
- [ ] Performance test: >50 bolt holes render smoothly at 60 FPS
- [ ] Visual quality maintained: holes appear correctly at all LOD levels
- [ ] Memory usage optimized: no geometry leaks detected
- [ ] Error handling preserved: CSG failures gracefully fallback

## Anti-Patterns to Avoid
- ❌ Don't create individual CSG operations for each hole
- ❌ Don't recreate geometries on each render
- ❌ Don't skip performance monitoring during development
- ❌ Don't ignore memory cleanup for disposed geometries
- ❌ Don't hardcode performance settings - make them configurable
- ❌ Don't remove existing error handling patterns

## Gotchas and Critical Details
- **three-bvh-csg requires water-tight meshes** - ensure all geometries are properly manifold
- **BufferGeometryUtils.mergeBufferGeometries** doesn't work with indexed geometries - convert first
- **InstancedMesh matrix updates** must be done before rendering
- **R3F Suspense boundaries** needed for LOD components
- **Memory cleanup** - dispose merged geometries when parameters change
- **CSG drawRange** - may cause export issues, handle in STL exporter

## Expected Performance Gains
- **Render Time**: From 2-5 seconds to <200ms for 50+ bolt holes
- **FPS**: From 15-20 FPS to stable 60 FPS with complex models
- **Memory Usage**: 50-70% reduction through geometry reuse
- **Draw Calls**: From N holes to 1-3 draw calls maximum

## Success Criteria
✅ Models with 50+ bolt holes render smoothly at 60 FPS
✅ Render time under 200ms for complex models
✅ No visual quality degradation at normal viewing distances
✅ Memory usage optimized with proper cleanup
✅ Graceful performance degradation on low-end devices

**Confidence Score: 9/10** - High confidence due to comprehensive research, existing performance monitoring infrastructure, clear optimization paths, and established patterns in the codebase.