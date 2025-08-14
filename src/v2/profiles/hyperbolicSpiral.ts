/**
 * Hyperbolic Spiral horn profile
 * Based on logarithmic spiral with hyperbolic modification
 * Reference: https://sphericalhorns.net/2020/04/06/spiral-functions-for-horns1/
 */

import { ProfileParams, ProfilePoint } from './types';

export function hyperbolicSpiral(params: ProfileParams): ProfilePoint[] {
  const { throatRadius, mouthRadius, length, segments } = params;
  const points: ProfilePoint[] = [];
  
  // Spiral parameters
  const spiralRate = params.spiralRate ?? 0.5; // Controls spiral tightness
  const hyperbolicFactor = params.hyperbolicFactor ?? 1.2;
  
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const z = t * length;
    
    if (t === 0) {
      points.push({ z: 0, r: throatRadius });
    } else {
      // Hyperbolic spiral equation
      // r(z) = r_throat * exp(k * theta) * cosh(h * theta)
      // where theta is the angular parameter
      const theta = spiralRate * Math.PI * t;
      
      // Logarithmic spiral component
      const spiralComponent = Math.exp(spiralRate * theta);
      
      // Hyperbolic modification
      const hyperbolicComponent = Math.cosh(hyperbolicFactor * theta / Math.PI);
      
      let r = throatRadius * spiralComponent * Math.pow(hyperbolicComponent, 0.3);
      
      // Scale to match mouth radius
      const expectedMouthRadius = throatRadius * Math.exp(spiralRate * Math.PI) * 
                                 Math.pow(Math.cosh(hyperbolicFactor), 0.3);
      const scaleFactor = (mouthRadius - throatRadius) / (expectedMouthRadius - throatRadius);
      
      r = throatRadius + (r - throatRadius) * scaleFactor;
      
      // Ensure within bounds
      r = Math.min(Math.max(r, throatRadius), mouthRadius);
      
      points.push({ z, r });
    }
  }
  
  return points;
}