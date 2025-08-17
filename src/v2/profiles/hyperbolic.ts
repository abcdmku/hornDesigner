/**
 * Hyperbolic horn profile
 * r(z) = r_throat * cosh(m * z)
 * where m = acosh(r_mouth / r_throat) / length
 */

import { ProfileParams, ProfilePoint } from './types';

export function hyperbolic(params: ProfileParams): ProfilePoint[] {
  const { throatRadius, mouthRadius, length, segments } = params;
  const points: ProfilePoint[] = [];
  
  // Calculate the hyperbolic expansion rate
  const m = Math.acosh(mouthRadius / throatRadius) / length;
  
  for (let i = 0; i <= segments; i++) {
    const z = (i / segments) * length;
    
    if (i === 0) {
      points.push({ z: 0, r: throatRadius });
    } else if (i === segments) {
      points.push({ z: length, r: mouthRadius });
    } else {
      const r = throatRadius * Math.cosh(m * z);
      points.push({ z, r });
    }
  }
  
  return points;
}