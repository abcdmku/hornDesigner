/**
 * Exponential horn profile
 * r(z) = r_throat * exp(m * z)
 * where m = ln(r_mouth / r_throat) / length
 */

import { AnyProfileParams, ProfilePoint } from './types';

export function exponential(params: AnyProfileParams): ProfilePoint[] {
  const { throatRadius, mouthRadius, length, segments } = params;
  const points: ProfilePoint[] = [];
  
  const m = Math.log(mouthRadius / throatRadius) / length;
  
  for (let i = 0; i <= segments; i++) {
    const x = (i / segments) * length;
    const r = throatRadius * Math.exp(m * x);
    points.push({ x, r });
  }
  
  return points;
}