/**
 * Hyperbolic-Exponential (Hypex) horn profile
 * Combines hyperbolic and exponential characteristics
 * r(z) = r_throat * cosh(T * z/length) * exp((1-T) * ln(r_mouth/r_throat) * z/length)
 */

import { ProfileParams, ProfilePoint } from './types';

export function hypex(params: ProfileParams): ProfilePoint[] {
  const { throatRadius, mouthRadius, length, segments } = params;
  const T = params.T ?? 0.707; // Default T-factor
  const points: ProfilePoint[] = [];
  
  const k = Math.log(mouthRadius / throatRadius);
  
  for (let i = 0; i <= segments; i++) {
    const z = (i / segments) * length;
    const zNorm = z / length;
    
    // Hyperbolic component with exponential growth
    const hyperbolicPart = Math.cosh(T * k * zNorm);
    const exponentialPart = Math.exp((1 - T) * k * zNorm);
    
    const r = throatRadius * hyperbolicPart * exponentialPart;
    points.push({ z, r });
  }
  
  return points;
}