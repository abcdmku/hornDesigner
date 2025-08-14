/**
 * Exponential horn profile
 * r(z) = r_throat * exp(m * z)
 * where m = ln(r_mouth / r_throat) / length
 */

import { ProfileParams, ProfilePoint } from './types';

export function exponential(params: ProfileParams): ProfilePoint[] {
  const { throatRadius, mouthRadius, length, segments } = params;
  const points: ProfilePoint[] = [];
  
  const m = Math.log(mouthRadius / throatRadius) / length;
  
  for (let i = 0; i <= segments; i++) {
    const z = (i / segments) * length;
    const r = throatRadius * Math.exp(m * z);
    points.push({ z, r });
  }
  
  return points;
}