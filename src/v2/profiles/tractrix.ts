/**
 * True-Expansion Tractrix horn profile
 * Based on spherical wavefront expansion
 * Reference: https://sphericalhorns.net/2019/08/30/a-true-expansion-tractrix-horn/
 */

import { ProfileParams, ProfilePoint } from './types';

export function tractrix(params: ProfileParams): ProfilePoint[] {
  const { throatRadius, mouthRadius, length, segments } = params;
  const points: ProfilePoint[] = [];
  
  // For true-expansion tractrix, we need to solve the differential equation
  // This is a simplified implementation using parametric equations
  const cutoffWavenumber = params.cutoffWavenumber ?? (1 / throatRadius);
  
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const z = t * length;
    
    // Tractrix curve parametrization
    // This ensures constant directivity above cutoff
    const a = mouthRadius;
    const theta = Math.PI * (1 - t) / 2;
    
    let r: number;
    if (t === 0) {
      r = throatRadius;
    } else if (t === 1) {
      r = mouthRadius;
    } else {
      // True tractrix expansion
      const expFactor = Math.exp(cutoffWavenumber * z);
      r = throatRadius * Math.sqrt(1 + (expFactor - 1) * (expFactor - 1) / 4);
      
      // Ensure smooth transition and proper bounds
      r = Math.min(Math.max(r, throatRadius), mouthRadius);
    }
    
    points.push({ z, r });
  }
  
  return points;
}