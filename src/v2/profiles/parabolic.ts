/**
 * Parabolic horn profile
 * r(z) follows a parabolic curve
 */

import { ProfileParams, ProfilePoint } from './types';

export function parabolic(params: ProfileParams): ProfilePoint[] {
  const { throatRadius, mouthRadius, length, segments } = params;
  const points: ProfilePoint[] = [];
  
  // Parabolic shape parameter
  const curvature = params.curvature ?? 2; // Controls the parabola shape
  
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const z = t * length;
    
    // Parabolic equation: r = r_throat + a * z^n
    // where a is chosen to match mouth radius at z = length
    const a = (mouthRadius - throatRadius) / Math.pow(length, curvature);
    const r = throatRadius + a * Math.pow(z, curvature);
    
    points.push({ z, r });
  }
  
  return points;
}