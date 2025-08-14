/**
 * Spherical horn profile
 * Based on spherical wave expansion
 * r(z) follows spherical wavefront propagation
 */

import { ProfileParams, ProfilePoint } from './types';

export function spherical(params: ProfileParams): ProfilePoint[] {
  const { throatRadius, mouthRadius, length, segments } = params;
  const points: ProfilePoint[] = [];
  
  // Spherical wave parameters
  const virtualApex = params.virtualApex ?? -throatRadius; // Virtual apex position behind throat
  
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const z = t * length;
    
    // Spherical expansion from virtual apex
    // r(z) = r0 * (z + z0) / z0
    // where z0 is the distance from virtual apex to throat
    const z0 = Math.abs(virtualApex);
    const expansionFactor = (z + z0) / z0;
    
    let r = throatRadius * expansionFactor;
    
    // Scale to match desired mouth radius
    const expectedMouthRadius = throatRadius * (length + z0) / z0;
    const scaleFactor = mouthRadius / expectedMouthRadius;
    
    r = throatRadius + (r - throatRadius) * scaleFactor;
    
    // Ensure within bounds
    r = Math.min(Math.max(r, throatRadius), mouthRadius);
    
    points.push({ z, r });
  }
  
  return points;
}