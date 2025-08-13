import { ProfileParameters, ProfilePoint, validateProfileParameters } from './types';

/**
 * Calculates conical horn profile (linear expansion)
 * Formula: radius(x) = throatRadius + (mouthRadius - throatRadius) * (x / length)
 * 
 * @param params Profile parameters
 * @returns Array of profile points along the horn axis
 */
export function conicalProfile(params: ProfileParameters): ProfilePoint[] {
  validateProfileParameters(params);
  
  const { throatRadius, mouthRadius, length, segments = 100 } = params;
  const points: ProfilePoint[] = [];
  
  // Linear interpolation between throat and mouth
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const x = t * length;
    const radius = throatRadius + (mouthRadius - throatRadius) * t;
    
    points.push({ x, radius });
  }
  
  return points;
}