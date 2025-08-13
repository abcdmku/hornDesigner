import { ProfileParameters, ProfilePoint, validateProfileParameters } from './types';

/**
 * Calculates classic exponential horn profile
 * Formula: radius(x) = throatRadius * exp(m * x)
 * where m = ln(mouthRadius/throatRadius) / length
 * 
 * @param params Profile parameters
 * @returns Array of profile points along the horn axis
 */
export function exponentialProfile(params: ProfileParameters): ProfilePoint[] {
  validateProfileParameters(params);
  
  const { throatRadius, mouthRadius, length, segments = 100 } = params;
  const points: ProfilePoint[] = [];
  
  // Calculate expansion coefficient
  const m = Math.log(mouthRadius / throatRadius) / length;
  
  for (let i = 0; i <= segments; i++) {
    const x = (i / segments) * length;
    const radius = throatRadius * Math.exp(m * x);
    points.push({ x, radius });
  }
  
  return points;
}

/**
 * Modified exponential profile with adjustable T-factor
 * Provides smoother transition at throat
 * 
 * @param params Profile parameters with optional tFactor
 * @returns Array of profile points along the horn axis
 */
export function modifiedExponentialProfile(
  params: ProfileParameters & { tFactor?: number }
): ProfilePoint[] {
  validateProfileParameters(params);
  
  const { throatRadius, mouthRadius, length, segments = 100, tFactor = 0.7 } = params;
  const points: ProfilePoint[] = [];
  
  // Validate tFactor
  if (tFactor <= 0) {
    throw new Error('T-factor must be greater than 0');
  }
  
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const x = t * length;
    
    // Modified exponential with T-factor for smoother transition
    const radius = throatRadius + (mouthRadius - throatRadius) * 
                   (Math.exp(tFactor * t) - 1) / (Math.exp(tFactor) - 1);
    
    points.push({ x, radius });
  }
  
  return points;
}