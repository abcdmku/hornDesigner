/**
 * Le Cléac'h horn profile
 * Optimized profile with frequency-dependent rollover that creates a spiral path
 * The spiral creates constant directivity by maintaining phase coherence
 * Reference: Jean Michel Le Cléac'h horn studies
 */

import { ProfileParams, ProfilePoint } from './types';

export function leCleach(params: ProfileParams): ProfilePoint[] {
  const { throatRadius, mouthRadius, length, segments } = params;
  const points: ProfilePoint[] = [];
  
  // Cutoff frequency determines the spiral characteristics
  const cutoffFreq = params.cutoffFrequency ?? 800; // Hz
  const c = 343; // Speed of sound in m/s
  const wavelength = c / cutoffFreq * 1000; // Convert to mm
  
  // Le Cléac'h uses a modified tractrix with spiral compensation
  // The key insight is that the wavefront should maintain constant curvature
  const r0 = wavelength / (2 * Math.PI); // Characteristic radius
  
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const z = t * length;
    
    if (i === 0) {
      points.push({ z: 0, r: throatRadius });
    } else if (i === segments) {
      points.push({ z: length, r: mouthRadius });
    } else {
      // Le Cléac'h profile equation
      // Start with exponential base for smooth expansion
      const m = Math.log(mouthRadius / throatRadius) / length;
      let r = throatRadius * Math.exp(m * z * 0.7); // Reduced expansion rate
      
      // Apply the spiral rollover characteristic
      // This creates the characteristic "spiral" shape seen in the reference image
      const spiralPhase = (z / length) * Math.PI;
      const spiralFactor = 1 + 0.3 * Math.sin(spiralPhase);
      r = r * spiralFactor;
      
      // Apply frequency-dependent rollover
      // The rollover becomes stronger as we approach the mouth
      const rolloverStart = 0.6; // Start rollover at 60% of length
      if (t > rolloverStart) {
        const rolloverProgress = (t - rolloverStart) / (1 - rolloverStart);
        // Smooth rollover using tanh function
        const rolloverAmount = Math.tanh(3 * rolloverProgress);
        
        // Calculate the asymptotic radius based on wavelength
        const asymptoteRadius = Math.min(mouthRadius, r0 * 2);
        
        // Blend between expansion and asymptote
        r = r * (1 - rolloverAmount) + asymptoteRadius * rolloverAmount;
      }
      
      // Ensure smooth transition and within bounds
      r = Math.min(Math.max(r, throatRadius), mouthRadius);
      
      points.push({ z, r });
    }
  }
  
  return points;
}