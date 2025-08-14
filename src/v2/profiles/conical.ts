/**
 * Conical horn profile
 * Linear expansion from throat to mouth
 */

import { ProfileParams, ProfilePoint } from './types';

export function conical(params: ProfileParams): ProfilePoint[] {
  const { throatRadius, mouthRadius, length, segments } = params;
  const points: ProfilePoint[] = [];
  
  for (let i = 0; i <= segments; i++) {
    const z = (i / segments) * length;
    const r = throatRadius + (mouthRadius - throatRadius) * (z / length);
    points.push({ z, r });
  }
  
  return points;
}