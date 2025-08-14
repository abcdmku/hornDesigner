/**
 * Oblate Spheroid horn profile
 * Based on oblate spheroidal wavefront expansion
 */

import { ProfileParams, ProfilePoint } from './types';

export function oblateSpheroid(params: ProfileParams): ProfilePoint[] {
  const { throatRadius, mouthRadius, length, segments } = params;
  const points: ProfilePoint[] = [];
  
  // Oblate spheroid parameters
  const eccentricity = params.eccentricity ?? 0.7;
  const a = length; // Semi-major axis
  const b = a * Math.sqrt(1 - eccentricity * eccentricity); // Semi-minor axis
  
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const z = t * length;
    
    if (t === 0) {
      points.push({ z: 0, r: throatRadius });
    } else if (t === 1) {
      points.push({ z: length, r: mouthRadius });
    } else {
      // Oblate spheroid equation
      // x^2/a^2 + (y^2 + z^2)/b^2 = 1
      // Solving for radius at position z
      const zNorm = z / a;
      const radiusFactor = b * Math.sqrt(1 - zNorm * zNorm);
      
      // Scale to match throat and mouth radii
      const baseRadius = throatRadius + (mouthRadius - throatRadius) * t;
      const shapeModulation = 1 + (radiusFactor / b - 1) * 0.3;
      
      let r = baseRadius * shapeModulation;
      
      // Ensure smooth transition and bounds
      r = Math.min(Math.max(r, throatRadius), mouthRadius);
      
      points.push({ z, r });
    }
  }
  
  return points;
}