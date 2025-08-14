# PRP: Replace Leva with Custom Tailwind UI Controls

## Overview
Replace the Leva control library in AppV2 with custom Tailwind CSS-based UI controls that match the look and feel of the original App.tsx ParameterSidebar while maintaining all v2 functionality.

## Context & Requirements

### User Request
"I dont like how leva looks/works. remove it and replace it with the tailwind and the way the side panel looks in the original App.tsx. Maintain all functionality of v2 App but the look and feel of the original app"

### Current State Analysis
- **V2 App**: Uses Leva controls in `src/v2/ui/Controls.tsx` with flat control structure
- **Original App**: Uses custom Tailwind controls in `src/components/ParameterSidebar.tsx`
- **Styling System**: Glass-morphism design with custom CSS classes in `src/index.css`

### Functionality to Preserve
All control functionality from `ControlValues` interface:
- Profile parameters (profileType, throatRadius, mouthRadius, length, segments)
- Profile-specific parameters (T, coverage, eccentricity, curvature, spiralRate, tStart, tEnd)
- Cross-section parameters (crossSectionMode, aspect, nStart, nEnd, easing, cornerRadius, matchMode, fp)
- H/V flare difference (hvHorizontal, hvVertical)
- Display options (thetaDivs, wireframe, pressureColoring, showAxes)
- Material properties (color, metalness, roughness)
- Acoustic parameters (computeAcoustics, minFreq, maxFreq, freqPoints)
- Export and compute functions

## Implementation Strategy

### Architecture Pattern
Follow the established pattern from the original ParameterSidebar:
1. **Container Component**: Custom controls hook (`useHornControls`)
2. **Reusable Control Components**: Individual input components with consistent styling
3. **Layout Structure**: Sectioned layout with glass-morphism styling
4. **Type Safety**: Full TypeScript integration with controlled component patterns

### Design System Reference
Use the established styling patterns from `src/index.css` and `src/components/ParameterSidebar.tsx`:

#### Glass-morphism Classes
```css
.glass-dark: rgba(15, 15, 15, 0.4), backdrop-filter blur(20px)
.glass-section: rgba(255, 255, 255, 0.03), border rgba(255, 255, 255, 0.08)
.glass-input: rgba(255, 255, 255, 0.05), focus state with blue border
.glass-button: rgba(59, 130, 246, 0.2), hover state with transform
```

#### Layout Structure
```tsx
// Sidebar container: w-[28rem] glass-dark rounded-r-3xl
// Sections: glass-section p-5
// Section headers: blue dot + semibold text
// Input grids: grid-cols-2 gap-3 for paired inputs
```

### Component Architecture

#### 1. Custom Control Components
Create reusable components following modern React patterns:

**NumberInput Component**
```typescript
interface NumberInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  className?: string;
}
```

**SliderInput Component**
```typescript
interface SliderInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  unit?: string;
  showValue?: boolean;
}
```

**SelectInput Component**
```typescript
interface SelectInputProps<T> {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}
```

**ToggleButton Component**
```typescript
interface ToggleButtonProps {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  variant?: 'default' | 'primary';
}
```

**ButtonGroup Component**
```typescript
interface ButtonGroupProps<T> {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}
```

#### 2. Custom Controls Hook
Replace Leva's `useControls` with custom hook:

```typescript
export function useHornControls(
  onExport?: (format: string) => void,
  onCompute?: () => void
): ControlValues {
  // State management for all control values
  // Return reactive state that updates 3D mesh
}
```

### Layout Structure

#### Sidebar Layout
Follow original ParameterSidebar structure:
```tsx
<div className="w-[28rem] glass-dark rounded-r-3xl m-4 ml-0 flex flex-col h-[calc(100vh-2rem)] shadow-2xl">
  {/* Header with logo and title */}
  {/* Scrollable content with sections */}
</div>
```

#### Section Organization
1. **Profile Parameters**: Type, dimensions, segments
2. **Profile-Specific Options**: Conditional controls based on profile type
3. **Cross-Section Settings**: Mode, aspect, advanced options
4. **Display Options**: Theta divisions, wireframe, pressure coloring, axes
5. **Material Properties**: Color, metalness, roughness
6. **Acoustic Analysis**: Compute toggle, frequency range
7. **Export Actions**: STL, OBJ, CSV, Hornresp, Acoustics

### Conditional Rendering Patterns
Implement conditional visibility for profile-specific controls:

```typescript
// Example: T-Factor for Hypex profiles
{profileType === 'hypex' && (
  <SliderInput
    label="T-Factor"
    value={T}
    onChange={setT}
    min={0.1}
    max={1.0}
    step={0.01}
  />
)}
```

## External References

### React Best Practices (2024)
- **Component Architecture**: https://daily.dev/blog/my-tailwind-css-utility-function-for-creating-reusable-react-components-typescript-support
- **TypeScript Patterns**: https://fettblog.eu/typescript-react-component-patterns/
- **Form Components**: https://www.thisdot.co/blog/how-to-create-reusable-form-components-with-react-hook-forms-and-typescript

### Tailwind CSS Integration
- **Design System**: https://dev.to/hamatoyogi/how-to-build-a-react-ts-tailwind-design-system-1ppi
- **Reusable Components**: https://blog.logrocket.com/building-reusable-react-components-using-tailwind-css/
- **Best Practices**: https://www.serverx.org.in/articles/best-practices-for-react-development-with-tailwind-css

## Codebase References

### Files to Study
- `src/components/ParameterSidebar.tsx` - Original control styling and layout patterns
- `src/index.css` - Glass-morphism utility classes and slider styles
- `src/v2/ui/Controls.tsx` - Current control functionality to preserve
- `src/v2/ui/AppV2.tsx` - How controls integrate with 3D components
- `src/App.tsx` - Overall layout structure and data flow

### Key Patterns to Follow
- **Input Styling**: `glass-input` class with focus states
- **Button Groups**: Active/inactive states with conditional `glass-button`
- **Section Layout**: Blue dot indicators with `glass-section` containers
- **Grid Layouts**: `grid-cols-2 gap-3` for paired inputs
- **Range Sliders**: Custom `.slider` styling with webkit/moz prefixes

## Implementation Tasks

### Phase 1: Core Component Library
1. **Create base input components**
   - `NumberInput` with glass styling
   - `SliderInput` with custom range styling
   - `SelectInput` with glass dropdown
   - `ToggleButton` with active states
   - `ButtonGroup` for multi-option selection
   - `ColorPicker` for material color

2. **Create layout components**
   - `ControlSection` with header and blue dot
   - `ControlGrid` for paired inputs
   - `ConditionalSection` for profile-specific controls

### Phase 2: Custom Controls Hook
1. **Replace Leva's useControls**
   - State management with useState for all control values
   - Proper TypeScript typing matching ControlValues interface
   - Reactive updates that trigger 3D mesh re-rendering

2. **Integration with AppV2**
   - Replace Leva import and usage
   - Maintain all existing prop passing to HornMesh
   - Preserve export and compute functionality

### Phase 3: Layout Integration
1. **Create CustomControlSidebar component**
   - Follow ParameterSidebar layout structure
   - Implement scrollable sections with custom-scrollbar
   - Add header with appropriate title/icon

2. **Update AppV2 layout**
   - Replace Leva's default positioning
   - Integrate custom sidebar into existing layout
   - Maintain responsive behavior

### Phase 4: Conditional Control Logic
1. **Profile-specific controls**
   - T-Factor for Hypex profiles
   - Coverage for JMLC profiles
   - Eccentricity for Oblate Spheroid profiles
   - Curvature for Parabolic profiles
   - Spiral Rate for Hyperbolic Spiral profiles
   - tStart/tEnd for PETF profiles

2. **Cross-section conditionals**
   - Aspect ratio for non-circle modes
   - Superellipse N values and easing
   - Rectangular corner radius and match mode
   - Stereographic focal parameter

## Technical Specifications

### TypeScript Requirements
- Strict type checking for all control values
- Generic component patterns for reusability
- Proper event handler typing with React.ChangeEventHandler
- Interface extensions for custom props

### Performance Considerations
- Use React.memo for input components to prevent unnecessary re-renders
- Implement useMemo for expensive calculations
- Debounced updates for continuous controls (sliders)
- Lazy loading for conditional sections

### Accessibility
- Proper ARIA labels for all inputs
- Keyboard navigation support
- Focus management and visual indicators
- Screen reader compatibility

## Validation Gates

### Code Quality
```bash
# Type checking
npx tsc --noEmit

# Linting
npx eslint src/v2/ui/CustomControls.tsx --fix
npx eslint src/v2/ui/Controls.tsx --fix

# Formatting
npx prettier src/v2/ui/ --write
```

### Functionality Testing
1. **Control Updates**: Verify all controls update 3D mesh
2. **Profile Switching**: Test conditional control visibility
3. **Export Functions**: Ensure all export buttons work
4. **Responsive Design**: Test sidebar behavior at different sizes

### Integration Testing
1. **State Consistency**: Control values match 3D rendering
2. **Performance**: No degradation in 3D rendering performance
3. **Memory Usage**: No memory leaks from control updates

## Error Handling Strategy

### Input Validation
- Number inputs: min/max bounds checking
- Type guards for profile/cross-section modes
- Fallback values for undefined/null states

### Graceful Degradation
- Default values when controls fail to load
- Error boundaries around control sections
- Console warnings for invalid configurations

## Success Criteria

1. **Visual Consistency**: Controls match original ParameterSidebar styling exactly
2. **Functional Parity**: All v2 control functionality preserved
3. **Performance**: No performance regression in 3D rendering
4. **Code Quality**: TypeScript strict mode compliance, ESLint clean
5. **User Experience**: Smooth, responsive control interactions
6. **Maintainability**: Clean, reusable component architecture

## Risk Mitigation

### Potential Issues
1. **State sync**: Controls not updating 3D mesh
2. **Performance**: Continuous updates causing lag
3. **Layout**: Responsive behavior breaking
4. **Conditional logic**: Complex profile-specific control logic

### Mitigation Strategies
1. Implement proper React state management patterns
2. Use debouncing for high-frequency updates
3. Test layout at multiple breakpoints
4. Create clear conditional rendering patterns with proper TypeScript guards

## Confidence Score: 9/10

This PRP provides comprehensive context for one-pass implementation success:
- ✅ Complete functionality mapping from v2 to custom controls
- ✅ Detailed styling patterns from original codebase
- ✅ Modern React/TypeScript best practices integrated
- ✅ Clear component architecture and implementation plan
- ✅ Specific file references and code patterns
- ✅ Executable validation gates
- ✅ Comprehensive error handling strategy
- ✅ Performance and accessibility considerations

The only minor uncertainty is around complex conditional control interactions, but the detailed pattern analysis and TypeScript approach should handle this effectively.