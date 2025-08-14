/**
 * JMLC (Jean-Michel Le Cléac'h) horn profile
 * Optimized for constant directivity
 * Reference: https://sphericalhorns.net/2020/12/21/jmlc-inspired-horn-calculator/
 */

import { ProfileParams, ProfilePoint } from './types';

export function jmlc(params: ProfileParams): ProfilePoint[] {
  const { throatRadius, mouthRadius, length, segments } = params;
  const points: ProfilePoint[] = [];
  
  // JMLC specific parameters
  const coverage = params.coverage ?? 90; // Coverage angle in degrees
  const k = params.k ?? 0.64; // JMLC shape factor
  
  // Convert coverage to radians
  const coverageRad = (coverage * Math.PI) / 180;
  const halfAngle = coverageRad / 2;
  
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const z = t * length;
    
    if (t === 0) {
      points.push({ z: 0, r: throatRadius });
    } else if (t === 1) {
      points.push({ z: length, r: mouthRadius });
    } else {
      // JMLC profile equation
      // r(z) follows a modified spherical expansion with correction factor
      const zNorm = z / length;
      
      // Base spherical expansion
      const sphericalExpansion = throatRadius / (1 - zNorm * Math.sin(halfAngle));
      
      // JMLC correction factor for constant directivity
      const correctionFactor = 1 + k * Math.pow(zNorm, 2) * (1 - zNorm);
      
      let r = sphericalExpansion * correctionFactor;
      
      // Interpolate to match mouth radius
      const scaleFactor = (mouthRadius - throatRadius) / (sphericalExpansion * correctionFactor - throatRadius);
      r = throatRadius + (r - throatRadius) * scaleFactor * Math.pow(t, 0.8);
      
      // Ensure within bounds
      r = Math.min(Math.max(r, throatRadius), mouthRadius);
      
      points.push({ z, r });
    }
  }
  
  return points;
}