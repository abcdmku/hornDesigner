/**
 * Tractrix horn profile
 * Classic tractrix curve with proper rollover characteristics
 * Based on the tractrix curve equation: x = r₀ * ln((√(r² - y²) + r₀) / y) - √(r₀² - y²)
 */

import { ProfileParams, ProfilePoint } from './types';

export function tractrix(params: ProfileParams): ProfilePoint[] {
  const { throatRadius, mouthRadius, length, segments } = params;
  const points: ProfilePoint[] = [];
  
  // Cutoff frequency determines the mouth radius for infinite horn
  const cutoffFreq = params.cutoffFrequency ?? 500; // Hz
  const c = 343; // Speed of sound in m/s
  const r0 = c / (2 * Math.PI * cutoffFreq) * 1000; // Convert to mm
  
  // For a finite horn, we need to scale the tractrix curve
  // The tractrix curve starts at y = throat and goes to y = mouth
  // We use parametric equations to generate the curve
  
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    
    if (i === 0) {
      points.push({ z: 0, r: throatRadius });
    } else if (i === segments) {
      points.push({ z: length, r: mouthRadius });
    } else {
      // Parametric tractrix: y varies from throat to a value less than r0
      // For practical horns, we limit y to reasonable values
      const yMin = throatRadius;
      const yMax = Math.min(mouthRadius, r0 * 0.99); // Don't let y reach r0
      const y = yMin + (yMax - yMin) * t;
      
      // Calculate x using tractrix equation
      // x = r0 * ln((√(r0² - y²) + r0) / y) - √(r0² - y²)
      let x = 0;
      if (y < r0) {
        const sqrtTerm = Math.sqrt(r0 * r0 - y * y);
        x = r0 * Math.log((sqrtTerm + r0) / y) - sqrtTerm;
      }
      
      // Scale x to fit the horn length
      const maxX = r0 * Math.log((Math.sqrt(r0 * r0 - yMax * yMax) + r0) / yMax) - Math.sqrt(r0 * r0 - yMax * yMax);
      const z = (x / maxX) * length;
      
      // The radius at this point is y
      const r = y;
      
      // Scale to match desired mouth radius
      const scaleFactor = (mouthRadius - throatRadius) / (yMax - yMin);
      const scaledR = throatRadius + (r - throatRadius) * scaleFactor;
      
      points.push({ z, r: scaledR });
    }
  }
  
  // Sort points by z to ensure proper ordering
  points.sort((a, b) => a.z - b.z);
  
  return points;
}