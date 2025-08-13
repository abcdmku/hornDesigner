# PRP: TypeScript Horn Profile Math Library

## Objective
Create a comprehensive TypeScript library for calculating horn profiles for loudspeaker horn design. The library will support multiple profile types (Conical, Exponential, Tractrix, Le Cléac'h, JMLC, Oblate Spheroid, Parabolic, Hyperbolic-Exponential, Spherical Wave) and be designed for extensibility.

## Critical Context

### Existing Codebase Patterns

#### Current Profile Implementation
The codebase currently has limited profile support in `src/components/horn-geometry/HornProfileGenerator.ts`:

```typescript
// Current simple implementation - lines 93-104
function calculateInteriorRadius(
  throatRadius: number,
  mouthRadius: number,
  t: number,
  flareType: string
): number {
  if (flareType === "exponential") {
    return throatRadius * Math.pow(mouthRadius / throatRadius, t);
  } else {
    return throatRadius + t * (mouthRadius - throatRadius);
  }
}
```

#### Type System
Current horn params in `src/lib/types.ts`:
```typescript
export interface HornProfileParams {
  throatDiameter: number;       // mm
  mouthWidth: number;           // mm
  mouthHeight?: number;         // mm (for rectangular horns)
  length: number;               // mm
  flareType: 'exponential' | 'conical';  // LIMITED - we'll expand this
  roundMouth: boolean;
  segments: number;
  wallThickness: number;
}
```

#### Module Organization Pattern
The codebase follows this pattern (see `src/components/geometry/`):
- Individual utility files for specific functions
- `index.ts` for barrel exports
- Constants in separate `constants.ts` files
- Strong TypeScript typing throughout

### Mathematical Formulas Reference

#### Horn Profile Mathematics
Based on acoustics research and horn design theory:

**Resources:**
- https://www.diyaudio.com/community/threads/horn-theory-and-the-wave-equation.136228/
- https://education.lenardaudio.com/en/05_horns_3.html
- Jean-Michel Le Cléac'h papers on horn profiles
- Bill Waslo's JMLC horn theory

**Profile Formulas:**

1. **Conical**: Linear expansion
   ```
   radius(x) = throatRadius + (mouthRadius - throatRadius) * (x / length)
   ```

2. **Exponential**: Classic exponential flare
   ```
   radius(x) = throatRadius * exp(m * x)
   where m = ln(mouthRadius/throatRadius) / length
   ```

3. **Tractrix**: Constant directivity horn
   ```
   x = throatRadius * (ln(tan(θ/2 + π/4)) - cos(θ))
   radius = throatRadius * sin(θ)
   where θ varies from θ_throat to θ_mouth
   ```

4. **Le Cléac'h**: Spherical wave horn (uses spherical wave equation)
   ```
   Complex calculation based on spherical wave propagation
   Requires cutoff frequency: fc = c / (2π * throatRadius)
   ```

5. **JMLC (Jean-Michel Le Cléac'h Modified)**: Optimized Le Cléac'h
   ```
   Similar to Le Cléac'h but with modified expansion rate
   ```

6. **Oblate Spheroid**: Based on oblate spheroid geometry
   ```
   Uses parametric equations of oblate spheroid surface
   ```

7. **Parabolic**: Parabolic expansion
   ```
   radius(x) = throatRadius + k * sqrt(x)
   where k = (mouthRadius - throatRadius) / sqrt(length)
   ```

8. **Hyperbolic-Exponential**: Hybrid profile
   ```
   Combines hyperbolic and exponential characteristics
   ```

9. **Spherical Wave**: Based on spherical wave propagation
   ```
   Accounts for spherical wave front expansion
   ```

## Implementation Blueprint

### Directory Structure
```
src/
├── profiles/
│   ├── index.ts                    # Barrel exports and ProfileType enum
│   ├── types.ts                    # Shared types and interfaces
│   ├── conical.ts                  # Conical profile
│   ├── exponential.ts              # Exponential profiles (classic & modified)
│   ├── tractrix.ts                 # Tractrix profile
│   ├── leCleach.ts                 # Le Cléac'h profile
│   ├── jmlc.ts                     # JMLC profile
│   ├── oblateSpheroid.ts           # Oblate Spheroid profile
│   ├── parabolic.ts                # Parabolic profile
│   ├── hyperbolicExponential.ts    # Hyperbolic-Exponential profile
│   └── sphericalWave.ts            # Spherical Wave profile
```

### Core Types (`src/profiles/types.ts`)
```typescript
export enum ProfileType {
  CONICAL = 'conical',
  EXPONENTIAL = 'exponential',
  MODIFIED_EXPONENTIAL = 'modifiedExponential',
  TRACTRIX = 'tractrix',
  LE_CLEACH = 'leCleach',
  JMLC = 'jmlc',
  OBLATE_SPHEROID = 'oblateSpheroid',
  PARABOLIC = 'parabolic',
  HYPERBOLIC_EXPONENTIAL = 'hyperbolicExponential',
  SPHERICAL_WAVE = 'sphericalWave'
}

export interface ProfilePoint {
  x: number;      // Distance from throat (mm)
  radius: number; // Radius at this point (mm)
}

export interface ProfileParameters {
  throatRadius: number;    // mm
  mouthRadius: number;     // mm
  length: number;          // mm
  segments?: number;       // Number of points to generate (default: 100)
  cutoffFrequency?: number; // Hz (for certain profiles)
}

export type ProfileFunction = (params: ProfileParameters) => ProfilePoint[];
```

### Example Implementation (`src/profiles/exponential.ts`)
```typescript
import { ProfileParameters, ProfilePoint } from './types';

/**
 * Calculates classic exponential horn profile
 * Formula: radius(x) = throatRadius * exp(m * x)
 * where m = ln(mouthRadius/throatRadius) / length
 */
export function exponentialProfile(params: ProfileParameters): ProfilePoint[] {
  const { throatRadius, mouthRadius, length, segments = 100 } = params;
  const points: ProfilePoint[] = [];
  
  // Calculate expansion coefficient
  const m = Math.log(mouthRadius / throatRadius) / length;
  
  for (let i = 0; i <= segments; i++) {
    const x = (i / segments) * length;
    const radius = throatRadius * Math.exp(m * x);
    points.push({ x, radius });
  }
  
  return points;
}

/**
 * Modified exponential profile with adjustable T-factor
 * Provides smoother transition at throat
 */
export function modifiedExponentialProfile(
  params: ProfileParameters & { tFactor?: number }
): ProfilePoint[] {
  const { throatRadius, mouthRadius, length, segments = 100, tFactor = 0.5 } = params;
  const points: ProfilePoint[] = [];
  
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const x = t * length;
    
    // Modified exponential with T-factor for smoother transition
    const radius = throatRadius + (mouthRadius - throatRadius) * 
                   (Math.exp(tFactor * t) - 1) / (Math.exp(tFactor) - 1);
    
    points.push({ x, radius });
  }
  
  return points;
}
```

### Integration with Existing Code

Update `src/lib/types.ts`:
```typescript
import { ProfileType } from '../profiles/types';

export interface HornProfileParams {
  throatDiameter: number;
  mouthWidth: number;
  mouthHeight?: number;
  length: number;
  flareType: ProfileType;  // Changed from 'exponential' | 'conical'
  cutoffFrequency?: number; // Added for certain profiles
  roundMouth: boolean;
  segments: number;
  wallThickness: number;
}
```

Update `src/components/horn-geometry/HornProfileGenerator.ts`:
```typescript
import { getProfile } from '../../profiles';

function calculateInteriorRadius(
  throatRadius: number,
  mouthRadius: number,
  t: number,
  flareType: ProfileType,
  length: number,
  cutoffFrequency?: number
): number {
  const profile = getProfile(flareType, {
    throatRadius,
    mouthRadius,
    length,
    segments: 100,
    cutoffFrequency
  });
  
  // Find the radius at position t * length
  const targetX = t * length;
  const point = profile.find(p => p.x >= targetX) || profile[profile.length - 1];
  return point.radius;
}
```

## Task Implementation Order

1. **Create base types and structure** (`src/profiles/types.ts`)
   - Define ProfileType enum
   - Define ProfilePoint and ProfileParameters interfaces
   - Define ProfileFunction type

2. **Implement simple profiles first**
   - `conical.ts` - Linear expansion (simplest)
   - `exponential.ts` - Classic and modified exponential
   - `parabolic.ts` - Parabolic expansion

3. **Implement intermediate profiles**
   - `tractrix.ts` - Constant directivity horn
   - `hyperbolicExponential.ts` - Hybrid profile

4. **Implement complex profiles**
   - `leCleach.ts` - Spherical wave horn
   - `jmlc.ts` - Modified Le Cléac'h
   - `oblateSpheroid.ts` - Oblate spheroid geometry
   - `sphericalWave.ts` - Spherical wave propagation

5. **Create barrel exports and factory** (`src/profiles/index.ts`)
   - Export all profile functions
   - Export ProfileType enum
   - Create getProfile factory function

6. **Update existing types**
   - Update `src/lib/types.ts` to use ProfileType
   - Update any TypeScript interfaces

7. **Integrate with existing code**
   - Update `HornProfileGenerator.ts` to use new profiles
   - Ensure backward compatibility where possible

8. **Add tests for each profile**
   - Verify mathematical correctness
   - Check edge cases
   - Validate point generation

## Validation Gates

```bash
# 1. Type checking - Must pass
npx tsc --noEmit

# 2. Linting - Must have no errors
npx eslint src/profiles --ext ts --max-warnings 0

# 3. Build - Must succeed
npm run build

# 4. Manual validation script (create as src/profiles/validate.ts)
npx tsx src/profiles/validate.ts
```

### Validation Script (`src/profiles/validate.ts`)
```typescript
import { ProfileType, getProfile } from './index';

// Test all profiles generate valid points
Object.values(ProfileType).forEach(type => {
  const profile = getProfile(type, {
    throatRadius: 25,
    mouthRadius: 150,
    length: 300,
    segments: 50
  });
  
  console.log(`${type}: ${profile.length} points`);
  
  // Validate constraints
  if (profile.length !== 51) throw new Error(`${type}: Wrong point count`);
  if (profile[0].radius !== 25) throw new Error(`${type}: Wrong throat radius`);
  if (Math.abs(profile[profile.length-1].radius - 150) > 0.1) {
    throw new Error(`${type}: Wrong mouth radius`);
  }
});

console.log('✅ All profiles validated successfully');
```

## Error Handling Strategy

1. **Parameter Validation**
   - Check throatRadius > 0
   - Check mouthRadius > throatRadius
   - Check length > 0
   - Check segments > 0

2. **Mathematical Edge Cases**
   - Handle division by zero
   - Handle logarithm of negative numbers
   - Handle NaN/Infinity results

3. **Graceful Fallbacks**
   - If complex profile fails, fall back to exponential
   - Log warnings for calculation issues
   - Always return valid ProfilePoint array

## Code Quality Patterns

Following existing patterns from `src/components/geometry/`:
- Pure functions (no side effects)
- Clear JSDoc comments
- Strong TypeScript typing
- Descriptive variable names
- Constants extracted
- Single responsibility per function

## Testing Approach

Since the project doesn't have a test framework set up yet, create standalone validation:

1. **Mathematical Validation**
   - Verify known profile characteristics
   - Check continuity (no gaps in profile)
   - Verify monotonic increase in radius

2. **Integration Testing**
   - Test with existing HornProfileGenerator
   - Verify 3D geometry generation works

3. **Performance Testing**
   - Profile generation should be < 10ms for 100 points
   - Memory usage should be minimal

## Extensibility Design

Adding a new profile requires only:
1. Create new file in `src/profiles/`
2. Implement ProfileFunction interface
3. Add to ProfileType enum
4. Add export to `index.ts`
5. Add case to getProfile factory

No changes needed in consuming code!

## References and Documentation

### External Resources
- **Acoustics Theory**: https://www.diyaudio.com/community/forums/multi-way.50/
- **Horn Calculator**: https://www.hornresp.net/
- **Le Cléac'h Theory**: Search "Jean-Michel Le Cléac'h horn theory PDF"
- **Tractrix Mathematics**: https://mathworld.wolfram.com/Tractrix.html

### Implementation Examples
- **Python Horn Library**: https://github.com/search?q=horn+profile+tractrix+python
- **OpenSCAD Horns**: https://www.thingiverse.com/search?q=horn+speaker+openscad

## Success Metrics

✅ All 9+ profile types implemented  
✅ TypeScript compilation passes  
✅ Each profile generates correct point arrays  
✅ Integration with existing code works  
✅ No performance regressions  
✅ Code follows existing patterns  

---

## Confidence Score: 9/10

**Rationale:**
- Clear mathematical formulas provided
- Existing code patterns well understood
- Strong type system design
- Comprehensive error handling
- Detailed implementation order
- Validation gates are executable

**Minor Risk (-1 point):**
- Complex profiles (Le Cléac'h, JMLC) may require additional research for exact formulas
- No existing test framework means validation is manual

This PRP provides all necessary context for successful one-pass implementation.