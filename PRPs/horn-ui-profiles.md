# PRP: Horn Profile UI Integration

## Overview
Integrate all 10 horn profile types into the UI with proper parameter inputs and ensure 3D generation and flange attachment work correctly for all profiles.

## Current State Analysis
- **Problem**: UI only shows 2 profiles (exponential, conical) but 10 are implemented
- **Assets Available**: 
  - All 10 profiles fully implemented in `src/profiles/`
  - ProfileType enum with all types
  - HornProfileGenerator already supports ProfileType enum
  - Flange/mounting system is profile-agnostic
  - Validation system exists

## Files to Modify
1. `src/components/ParameterSidebar.tsx` - Add profile selector and cutoff frequency input
2. `src/constants/index.ts` - Update DEFAULT_HORN_PARAMS to use ProfileType
3. `src/components/horn-geometry/HornProfileGenerator.ts` - Update calculateScaleFactors for all profiles
4. `src/lib/types.ts` - Ensure flareType uses ProfileType correctly

## Implementation Blueprint

### Step 1: Update ParameterSidebar.tsx
```typescript
// Import ProfileType and getProfileDisplayName at top
import { ProfileType, getProfileDisplayName } from '../profiles';

// In the Horn Type select dropdown (lines 71-81), replace with:
<select
  value={hornParams.flareType}
  onChange={(e) => onHornParamsChange({ 
    ...hornParams, 
    flareType: e.target.value as ProfileType 
  })}
  className="w-full px-4 py-2.5 glass-input rounded-lg text-white outline-none placeholder-gray-400"
>
  {Object.values(ProfileType).map(type => (
    <option key={type} value={type} className="bg-gray-800 text-white">
      {getProfileDisplayName(type)}
    </option>
  ))}
</select>

// Add cutoff frequency input after flareType select (if needed for certain profiles):
{(hornParams.flareType === ProfileType.LE_CLEACH || 
  hornParams.flareType === ProfileType.JMLC || 
  hornParams.flareType === ProfileType.SPHERICAL_WAVE) && (
  <div>
    <label className="block text-sm font-medium text-gray-300 mb-2">
      Cutoff Frequency (Hz)
    </label>
    <input
      type="number"
      value={hornParams.cutoffFrequency || 500}
      onChange={(e) => onHornParamsChange({ 
        ...hornParams, 
        cutoffFrequency: parseFloat(e.target.value) || 500
      })}
      min="100"
      max="5000"
      step="50"
      className="w-full px-4 py-2.5 glass-input rounded-lg text-white outline-none placeholder-gray-400"
    />
  </div>
)}
```

### Step 2: Update constants/index.ts
```typescript
import { ProfileType } from '../profiles/types';

// Update DEFAULT_HORN_PARAMS:
export const DEFAULT_HORN_PARAMS = {
  throatDiameter: 25.4, // 1 inch in mm
  mouthWidth: 400,
  mouthHeight: 200,
  length: 300,
  flareType: ProfileType.EXPONENTIAL, // Use enum instead of string
  cutoffFrequency: 500, // Add default cutoff frequency
  roundMouth: false,
  segments: 32,
  wallThickness: 2 // mm - default wall thickness for hollow horns
};
```

### Step 3: Update HornProfileGenerator calculateScaleFactors
```typescript
// Update calculateScaleFactors function (lines 135-153) to handle all profile types:
function calculateScaleFactors(
  throatDiameter: number,
  mouthWidth: number,
  mouthHeight: number,
  t: number,
  flareType: string | ProfileType
) {
  // Convert legacy strings to ProfileType
  if (typeof flareType === 'string') {
    if (flareType === 'exponential') {
      flareType = ProfileType.EXPONENTIAL;
    } else if (flareType === 'conical') {
      flareType = ProfileType.CONICAL;
    }
  }
  
  // Use the profile library to get the radius at position t
  const throatRadius = throatDiameter / 2;
  const mouthWidthRadius = mouthWidth / 2;
  const mouthHeightRadius = mouthHeight / 2;
  
  // For rectangular horns, we need to calculate width and height scales
  // based on the profile curve
  switch (flareType) {
    case ProfileType.CONICAL:
      return {
        widthScale: 1 + t * ((mouthWidth / throatDiameter) - 1),
        heightScale: 1 + t * ((mouthHeight / throatDiameter) - 1),
      };
    
    case ProfileType.EXPONENTIAL:
    case ProfileType.MODIFIED_EXPONENTIAL:
      return {
        widthScale: Math.pow(mouthWidth / throatDiameter, t),
        heightScale: Math.pow(mouthHeight / throatDiameter, t),
      };
    
    case ProfileType.TRACTRIX:
    case ProfileType.LE_CLEACH:
    case ProfileType.JMLC:
      // These profiles use more complex curves
      // We'll calculate based on the profile's radius at position t
      const profile = getProfile(flareType, {
        throatRadius,
        mouthRadius: mouthWidthRadius,
        length: 1, // Normalized length
        segments: 100
      });
      const pointIndex = Math.floor(t * (profile.length - 1));
      const radiusAtT = profile[pointIndex].radius;
      const scale = radiusAtT / throatRadius;
      
      return {
        widthScale: scale * (mouthWidth / throatDiameter) / (mouthWidthRadius / throatRadius),
        heightScale: scale * (mouthHeight / throatDiameter) / (mouthHeightRadius / throatRadius),
      };
    
    default:
      // For other profiles, use a smooth interpolation
      const smoothT = t * t * (3 - 2 * t); // Smoothstep function
      return {
        widthScale: 1 + smoothT * ((mouthWidth / throatDiameter) - 1),
        heightScale: 1 + smoothT * ((mouthHeight / throatDiameter) - 1),
      };
  }
}
```

### Step 4: Update lib/types.ts (optional cleanup)
```typescript
// Update HornProfileParams interface to use ProfileType only:
export interface HornProfileParams {
  throatDiameter: number;       // mm
  mouthWidth: number;           // mm
  mouthHeight?: number;         // mm (for rectangular horns)
  length: number;               // mm
  flareType: ProfileType;       // Use ProfileType enum only
  cutoffFrequency?: number;     // Hz (for certain profiles)
  roundMouth: boolean;          // true = circular horn
  segments: number;             // radial segments
  wallThickness: number;        // mm - wall thickness
}
```

## Validation Gates

```bash
# Type checking
npx tsc --noEmit

# Linting
npx eslint . --fix

# Run profile validation
npx tsx src/profiles/validate.ts

# Build test
npm run build
```

## Testing Checklist

### Manual Testing
1. [ ] Each profile type appears in dropdown with proper display name
2. [ ] Cutoff frequency input appears only for relevant profiles (Le Cléac'h, JMLC, Spherical Wave)
3. [ ] 3D geometry generates correctly for all profiles
4. [ ] Circular and rectangular horns work for all profiles
5. [ ] Mounting plates attach correctly for all profiles
6. [ ] Driver mounts attach correctly for all profiles
7. [ ] Wall thickness applies correctly for all profiles
8. [ ] No console errors when switching between profiles

### Profile-Specific Testing
- [ ] Conical: Linear expansion visible
- [ ] Exponential: Smooth exponential curve
- [ ] Modified Exponential: Variation of exponential
- [ ] Parabolic: Parabolic curve shape
- [ ] Tractrix: Constant directivity shape
- [ ] Hyperbolic-Exponential: Combined curve
- [ ] Le Cléac'h: Spherical wave propagation shape
- [ ] JMLC: Modified Le Cléac'h shape
- [ ] Oblate Spheroid: Elliptical expansion
- [ ] Spherical Wave: Spherical expansion

## Potential Issues & Solutions

### Issue 1: ProfileType Import Errors
**Solution**: Ensure ProfileType is imported from '../profiles/types' or '../profiles'

### Issue 2: Rectangular Horn Scaling
**Solution**: The calculateScaleFactors function handles rectangular scaling differently per profile

### Issue 3: Legacy String Compatibility
**Solution**: Keep backward compatibility by checking for string types and converting to ProfileType

### Issue 4: Performance with Complex Profiles
**Solution**: Profiles are pre-calculated and cached, performance should be acceptable

## Documentation References
- Horn profile theory: https://www.grc.com/acoustics/an-introduction-to-horn-theory.pdf
- JMLC profiles: https://sphericalhorns.net/2020/12/21/jmlc-inspired-horn-calculator/
- Profile comparison: https://www.diyaudio.com/community/threads/horns-and-waveguides-101.336780/

## Success Criteria
- All 10 horn profiles accessible in UI
- Each profile generates valid 3D geometry
- Flanges attach correctly to all profile types
- No TypeScript errors
- No runtime errors
- Smooth user experience when switching profiles

## Implementation Order
1. Update ParameterSidebar.tsx with profile dropdown
2. Add cutoff frequency input conditionally
3. Update constants to use ProfileType
4. Fix calculateScaleFactors for rectangular horns
5. Test each profile thoroughly
6. Run validation suite

## Notes
- The profile library is already robust and tested
- Flange attachment is profile-agnostic (works with mouth dimensions)
- Focus on UI integration and ensuring all profiles render correctly
- Keep backward compatibility where possible

## Confidence Score: 9/10
High confidence due to:
- All profiles already implemented and tested
- Clear separation of concerns
- Minimal changes required
- Existing validation framework
- Profile-agnostic flange system

Minor uncertainty only in rectangular horn scaling for exotic profiles.