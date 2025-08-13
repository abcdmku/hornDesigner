# PRP: Horn Acoustic Analysis and Profile Enhancement

## Overview
Comprehensive enhancement of horn profile calculations with addition of acoustic analysis features including dispersion patterns, frequency response, and proper profile mathematics. This PRP addresses incorrect profile calculations and adds professional-grade acoustic analysis capabilities.

## Problem Statement
1. Several horn profiles (Le Cléac'h, JMLC, Tractrix) have mathematical inaccuracies
2. No dispersion angle calculation or visualization
3. No frequency response analysis
4. Missing acoustic performance metrics
5. Poor support for rectangular horns with varying dispersion
6. Code organization needs improvement for acoustic features

## Success Criteria
- All horn profiles calculate accurately according to their mathematical definitions
- Users can specify desired dispersion angles (horizontal/vertical)
- Real-time frequency response visualization
- Dispersion pattern polar plots
- Clean code organization in dedicated acoustic modules
- Validation of acoustic calculations against known standards

## Current State Analysis

### Files to Reference
```
src/profiles/
├── leCleach.ts          # Line 44: Oversimplified sine approximation
├── jmlc.ts              # Line 31: Hardcoded empirical constants
├── tractrix.ts          # Line 57-58: Incorrect linear interpolation
├── exponential.ts       # Good reference implementation
└── types.ts             # ProfileParameters interface

src/components/
├── Profile2DView.tsx    # Canvas-based 2D visualization
└── horn-geometry/
    └── HornProfileGenerator.ts  # Line 121-132: Inefficient profile lookup

src/lib/types.ts         # HornProfileParams interface
```

### Issues Found
1. **Le Cléac'h Profile**: Uses `sin(k*x)` instead of proper Bessel functions
2. **JMLC Profile**: Empirical constants (0.91, 0.09) without proper Waslo optimization
3. **Tractrix Profile**: Linear interpolation destroys mathematical properties
4. **HornProfileGenerator**: Linear search instead of binary search/interpolation

## Technical Requirements

### Mathematical Foundations

#### Webster's Horn Equation
```
∂²p/∂x² + (1/S(x))·(dS/dx)·∂p/∂x + k²·p = 0
where:
- p = pressure
- S(x) = cross-sectional area
- k = wave number (2πf/c)
- c = speed of sound (343 m/s at 20°C)
```

#### Directivity Index
```
DI = 10·log₁₀(Q)
Q = 4π / ∫∫ |p(θ,φ)|² sin(θ) dθ dφ
```

#### Beamwidth Calculation
```
f = K / (d × Θ)
where:
- K ≈ 29,000 (constant)
- d = mouth dimension (inches)
- Θ = beamwidth (degrees)
- f = frequency (Hz)
```

#### Spherical Wave Corrections (Le Cléac'h)
Use spherical Bessel functions:
```javascript
jₙ(x) = √(π/2x)·Jₙ₊₁/₂(x)
```

## Implementation Architecture

### New Folder Structure
```
src/acoustic/
├── analysis/
│   ├── FrequencyResponse.ts      # Frequency response calculations
│   ├── Dispersion.ts             # Dispersion pattern calculations
│   ├── DirectivityIndex.ts       # DI and Q factor calculations
│   └── AcousticImpedance.ts     # Impedance calculations
├── profiles/
│   ├── ProfileCorrections.ts     # Fixed profile implementations
│   ├── ProfileOptimizer.ts       # Profile optimization for dispersion
│   └── BesselFunctions.ts       # Mathematical utilities
├── visualization/
│   ├── PolarPlot.tsx             # Polar pattern visualization
│   ├── FrequencyPlot.tsx        # Frequency response plot
│   └── DispersionMap.tsx        # 2D dispersion heatmap
└── types.ts                      # Acoustic analysis types
```

## Implementation Blueprint

### Phase 1: Fix Profile Calculations

```typescript
// src/acoustic/profiles/BesselFunctions.ts
export class BesselFunctions {
  // Implement spherical Bessel functions for Le Cléac'h
  static sphericalBessel(n: number, x: number): number {
    // Use series expansion or recursive calculation
    // Reference: https://en.wikipedia.org/wiki/Bessel_function#Spherical_Bessel_functions
  }
  
  // Implement regular Bessel functions
  static besselJ(n: number, x: number): number {
    // Series expansion for small x, asymptotic for large x
  }
}

// src/acoustic/profiles/ProfileCorrections.ts
export class CorrectedProfiles {
  static leCleach(params: ProfileParameters): ProfilePoint[] {
    // Proper implementation with spherical wave corrections
    const k = 2 * Math.PI * params.cutoffFrequency / 343;
    // Use BesselFunctions.sphericalBessel() for corrections
  }
  
  static tractrix(params: ProfileParameters): ProfilePoint[] {
    // Proper tractrix curve without linear interpolation
    // y = a·[ln((a + √(a² - x²))/x) - √(a² - x²)/a]
  }
  
  static jmlc(params: ProfileParameters): ProfilePoint[] {
    // Implement proper Waslo optimization
    // Reference: Bill Waslo's JMLC theory
  }
}
```

### Phase 2: Dispersion Calculations

```typescript
// src/acoustic/types.ts
export interface DispersionParameters {
  horizontalAngle: number;  // degrees at -6dB
  verticalAngle: number;    // degrees at -6dB
  frequency: number;        // Hz
  mouthWidth: number;       // mm
  mouthHeight: number;      // mm
}

// src/acoustic/analysis/Dispersion.ts
export class DispersionAnalyzer {
  static calculateRequiredMouthSize(params: DispersionParameters): {
    width: number;
    height: number;
  } {
    // Use formula: f = K / (d × Θ)
    const K = 29000; // constant for inches/degrees
    const widthInches = K / (params.frequency * params.horizontalAngle);
    const heightInches = K / (params.frequency * params.verticalAngle);
    return {
      width: widthInches * 25.4, // convert to mm
      height: heightInches * 25.4
    };
  }
  
  static calculateDispersionPattern(
    profile: ProfilePoint[],
    frequency: number
  ): PolarData {
    // Calculate off-axis response using Webster equation
    // Return polar pattern data for visualization
  }
}
```

### Phase 3: Frequency Response Analysis

```typescript
// src/acoustic/analysis/FrequencyResponse.ts
export class FrequencyResponseAnalyzer {
  static calculateResponse(
    profile: ProfilePoint[],
    params: HornProfileParams
  ): FrequencyResponseData {
    // Calculate cutoff frequency
    const fc = this.calculateCutoffFrequency(profile[0].radius);
    
    // Calculate loading efficiency vs frequency
    const frequencies = this.generateLogFrequencies(20, 20000, 100);
    const response = frequencies.map(f => {
      const loading = this.calculateHornLoading(profile, f);
      const efficiency = this.calculateEfficiency(loading, f, fc);
      return { frequency: f, spl: efficiency };
    });
    
    return { cutoffFrequency: fc, response };
  }
  
  private static calculateHornLoading(
    profile: ProfilePoint[],
    frequency: number
  ): number {
    // Implement Webster equation solution
    const k = 2 * Math.PI * frequency / 343;
    // Calculate acoustic impedance at throat
    // Return loading factor
  }
}
```

### Phase 4: Visualization Components

```typescript
// src/acoustic/visualization/PolarPlot.tsx
export const PolarPlot: React.FC<{
  data: PolarData;
  frequency: number;
}> = ({ data, frequency }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    
    // Draw polar grid
    drawPolarGrid(ctx);
    
    // Plot directivity pattern
    data.angles.forEach((angle, i) => {
      const radius = data.magnitudes[i];
      const x = radius * Math.cos(angle);
      const y = radius * Math.sin(angle);
      // Draw point
    });
  }, [data, frequency]);
  
  return <canvas ref={canvasRef} />;
};

// src/acoustic/visualization/FrequencyPlot.tsx
export const FrequencyPlot: React.FC<{
  response: FrequencyResponseData;
}> = ({ response }) => {
  // Use Canvas or D3.js for logarithmic frequency axis
  // Plot SPL vs frequency
  // Mark cutoff frequency
};
```

### Phase 5: Integration with UI

```typescript
// Update src/components/ParameterSidebar.tsx
// Add dispersion angle inputs:
<div>
  <label>Horizontal Dispersion (-6dB)</label>
  <input
    type="number"
    value={hornParams.horizontalDispersion || 90}
    onChange={(e) => onHornParamsChange({
      ...hornParams,
      horizontalDispersion: Number(e.target.value)
    })}
    min="20"
    max="180"
    step="5"
  />°
</div>

// Update src/lib/types.ts
export interface HornProfileParams {
  // ... existing fields
  horizontalDispersion?: number;  // degrees
  verticalDispersion?: number;    // degrees
  targetFrequency?: number;       // Hz for dispersion control
}
```

## Validation & Testing

### Unit Tests
```typescript
// src/acoustic/__tests__/profiles.test.ts
describe('Profile Corrections', () => {
  test('Le Cléac\'h profile uses Bessel functions', () => {
    const profile = CorrectedProfiles.leCleach(params);
    // Verify spherical wave corrections applied
    // Check against known good values
  });
  
  test('Tractrix maintains constant directivity', () => {
    const profile = CorrectedProfiles.tractrix(params);
    // Verify tractrix properties preserved
  });
});

// src/acoustic/__tests__/dispersion.test.ts
describe('Dispersion Analysis', () => {
  test('Calculates correct mouth size for dispersion', () => {
    const size = DispersionAnalyzer.calculateRequiredMouthSize({
      horizontalAngle: 90,
      verticalAngle: 45,
      frequency: 1000
    });
    expect(size.width).toBeCloseTo(322.2, 1); // mm
    expect(size.height).toBeCloseTo(644.4, 1); // mm
  });
});
```

### Validation Commands
```bash
# Type checking
npx tsc --noEmit

# Run tests
npm test

# Build verification
npm run build

# Profile validation
npx tsx src/acoustic/__tests__/validate-profiles.ts
```

## Performance Considerations

1. **Profile Caching**: Cache calculated profiles with memoization
2. **Web Workers**: Use for heavy calculations (frequency response, polar patterns)
3. **Throttling**: Debounce parameter changes for visualization updates
4. **LOD**: Reduce calculation resolution for real-time preview

## External References

### Documentation
- Webster Horn Equation: https://euphonics.org/4-2-3-the-webster-horn-equation/
- Bessel Functions: https://en.wikipedia.org/wiki/Bessel_function
- Horn Theory Part 1: https://www.grc.com/acoustics/an-introduction-to-horn-theory.pdf
- Horn Theory Part 2: https://audioxpress.com/assets/upload/files/kolbrek2885.pdf
- Directivity Control: https://www.prosoundtraining.com/2010/05/24/understanding-horn-directivity-control/

### Code References
- Bessel.js library: https://github.com/SheetJS/bessel
- Audio analysis: https://github.com/hvianna/audioMotion-analyzer
- D3.js for visualization: https://d3js.org/

## Risk Mitigation

1. **Mathematical Complexity**: Use established libraries for Bessel functions
2. **Performance**: Implement progressive enhancement (basic first, advanced optional)
3. **Browser Compatibility**: Use polyfills for Web Audio API features
4. **Accuracy Validation**: Compare with Hornresp software results

## Task List (in order)

1. Set up acoustic module structure
2. Implement Bessel function utilities
3. Fix Le Cléac'h profile with proper spherical corrections
4. Fix JMLC profile with Waslo optimization
5. Fix Tractrix profile to preserve curve properties
6. Implement dispersion angle calculations
7. Add frequency response analyzer
8. Create polar plot visualization component
9. Create frequency response plot component
10. Integrate dispersion inputs into UI
11. Add visualization toggle to Profile2DView
12. Write comprehensive unit tests
13. Validate against known acoustic standards
14. Performance optimization with caching
15. Documentation and examples

## Notes

- Keep profiles agnostic to horn type (circular/rectangular)
- Support future variable dispersion by using profile segments
- Maintain backward compatibility with existing profile system
- Use TypeScript strict mode for all new modules
- Follow existing code conventions from exponential.ts

## Confidence Score: 8/10

High confidence due to:
- Clear mathematical foundations provided
- Existing visualization infrastructure (Profile2DView)
- Well-structured profile system to build upon
- Comprehensive research included

Minor uncertainty in:
- Complex Bessel function implementations
- Performance with real-time calculations
- Validation against professional software