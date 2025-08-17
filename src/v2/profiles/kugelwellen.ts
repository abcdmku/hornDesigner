/**
 * Kugelwellen (Spherical Wave) horn profile
 * Based on spherical wave propagation with strong rollover
 * Creates a horn that maintains spherical wavefronts
 * Reference: German acoustic horn design tradition
 */

import { ProfileParams, ProfilePoint } from './types';

export function kugelwellen(params: ProfileParams): ProfilePoint[] {
  const { throatRadius, mouthRadius, length, segments } = params;
  const points: ProfilePoint[] = [];
  
  // The Kugelwellen horn is designed to maintain spherical wavefronts
  // It has a characteristic strong rollover as seen in the reference image
  const cutoffFreq = params.cutoffFrequency ?? 1000; // Hz
  const c = 343; // Speed of sound in m/s
  const wavelength = c / cutoffFreq * 1000; // Convert to mm
  
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const z = t * length;
    
    if (i === 0) {
      points.push({ z: 0, r: throatRadius });
    } else if (i === segments) {
      points.push({ z: length, r: mouthRadius });
    } else {
      // Kugelwellen profile equation
      // Based on spherical wave expansion with strong rollover
      
      // Initial expansion follows spherical wave pattern
      // r(z) = sqrt(r_throat^2 + (z * tan(theta))^2)
      // where theta is the expansion angle
      
      const expansionAngle = Math.atan((mouthRadius - throatRadius) / length);
      
      // Spherical expansion
      let r = Math.sqrt(throatRadius * throatRadius + Math.pow(z * Math.tan(expansionAngle), 2));
      
      // Apply strong rollover characteristic (as seen in the reference)
      // The rollover starts early and is very pronounced
      const rolloverStart = 0.3; // Start rollover at 30% of length
      if (t > rolloverStart) {
        const rolloverProgress = (t - rolloverStart) / (1 - rolloverStart);
        
        // Strong exponential rollover
        const rolloverFactor = Math.exp(-2 * rolloverProgress);
        
        // Calculate the asymptotic radius
        // Kugelwellen horns typically have strong rollover to a nearly constant radius
        const targetRadius = throatRadius + (mouthRadius - throatRadius) * 0.7;
        
        // Blend between spherical expansion and rollover
        r = r * rolloverFactor + targetRadius * (1 - rolloverFactor);
        
        // Add the characteristic "bulge" seen in Kugelwellen horns
        const bulgePosition = 0.6;
        const bulgeWidth = 0.2;
        const bulgeAmount = 0.15;
        const distFromBulge = Math.abs(t - bulgePosition) / bulgeWidth;
        if (distFromBulge < 1) {
          const bulgeFactor = Math.cos(distFromBulge * Math.PI / 2);
          r = r * (1 + bulgeAmount * bulgeFactor);
        }
      }
      
      // Ensure within bounds
      r = Math.min(Math.max(r, throatRadius), mouthRadius);
      
      points.push({ z, r });
    }
  }
  
  return points;
}