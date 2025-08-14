/**
 * William Neile / ALO (Acoustic Loading Optimized) horn profile
 * Based on semicubical parabola for optimal acoustic loading
 * Reference: https://sphericalhorns.net/2022/09/20/acoustic-loading-optimized-william-neile-horns-part-2
 */

import { ProfileParams, ProfilePoint } from './types';

export function wnAlo(params: ProfileParams): ProfilePoint[] {
  const { throatRadius, mouthRadius, length, segments } = params;
  const points: ProfilePoint[] = [];
  
  // William Neile curve parameters
  const loadingFactor = params.loadingFactor ?? 0.6; // Acoustic loading optimization
  const curvePower = params.curvePower ?? 2/3; // Semicubical parabola default
  
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const z = t * length;
    
    if (t === 0) {
      points.push({ z: 0, r: throatRadius });
    } else {
      // William Neile curve: y^2 = a * x^3
      // Adapted for horn profile with acoustic loading optimization
      
      // Base curve
      const baseCurve = Math.pow(t, 1.5); // Semicubical relationship
      
      // Acoustic loading optimization factor
      const loadingModulation = 1 + loadingFactor * (1 - Math.exp(-3 * t));
      
      // Combined profile
      const profileFactor = baseCurve * loadingModulation;
      
      // Scale to match throat and mouth radii
      let r = throatRadius + (mouthRadius - throatRadius) * profileFactor;
      
      // Apply curve power for fine-tuning
      const adjustment = Math.pow(t, curvePower);
      r = throatRadius + (r - throatRadius) * adjustment;
      
      // Ensure within bounds
      r = Math.min(Math.max(r, throatRadius), mouthRadius);
      
      points.push({ z, r });
    }
  }
  
  return points;
}