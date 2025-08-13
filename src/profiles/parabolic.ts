import { ProfileParameters, ProfilePoint, validateProfileParameters } from './types';

/**
 * Calculates parabolic horn profile
 * Formula: radius(x) = throatRadius + k * sqrt(x)
 * where k = (mouthRadius - throatRadius) / sqrt(length)
 * 
 * @param params Profile parameters
 * @returns Array of profile points along the horn axis
 */
export function parabolicProfile(params: ProfileParameters): ProfilePoint[] {
  validateProfileParameters(params);
  
  const { throatRadius, mouthRadius, length, segments = 100 } = params;
  const points: ProfilePoint[] = [];
  
  // Calculate expansion coefficient
  const k = (mouthRadius - throatRadius) / Math.sqrt(length);
  
  for (let i = 0; i <= segments; i++) {
    const x = (i / segments) * length;
    const radius = throatRadius + k * Math.sqrt(x);
    
    points.push({ x, radius });
  }
  
  return points;
}