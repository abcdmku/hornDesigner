/**
 * Conical horn profile
 * Linear expansion from throat to mouth
 */

import { AnyProfileParams, ProfilePoint } from './types';

export function conical(params: AnyProfileParams): ProfilePoint[] {
  const { throatRadius, mouthRadius, length, segments } = params;
  const points: ProfilePoint[] = [];
  
  for (let i = 0; i <= segments; i++) {
    const x = (i / segments) * length;
    const r = throatRadius + (mouthRadius - throatRadius) * (x / length);
    points.push({ x, r });
  }
  
  return points;
}