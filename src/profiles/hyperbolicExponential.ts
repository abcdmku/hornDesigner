import { ProfileParameters, ProfilePoint, validateProfileParameters } from './types';

/**
 * Calculates hyperbolic-exponential hybrid horn profile
 * Combines hyperbolic and exponential characteristics for optimized performance
 * 
 * The profile uses a hyperbolic function modulated by an exponential growth factor
 * Formula: radius(x) = throatRadius * cosh(m * x) * exp(n * x)
 * where the coefficients are calculated to match throat and mouth radii
 * 
 * @param params Profile parameters with optional blend factor
 * @returns Array of profile points along the horn axis
 */
export function hyperbolicExponentialProfile(
  params: ProfileParameters & { blendFactor?: number }
): ProfilePoint[] {
  validateProfileParameters(params);
  
  const { throatRadius, mouthRadius, length, segments = 100, blendFactor = 0.5 } = params;
  const points: ProfilePoint[] = [];
  
  // Validate blend factor
  if (blendFactor < 0 || blendFactor > 1) {
    throw new Error('Blend factor must be between 0 and 1');
  }
  
  // The blend factor controls the mix between hyperbolic and exponential
  // 0 = more hyperbolic, 1 = more exponential
  
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const x = t * length;
    
    // Hyperbolic component
    const hyperbolicRadius = throatRadius * Math.cosh(t * Math.log(mouthRadius / throatRadius));
    
    // Exponential component
    const exponentialRadius = throatRadius * Math.exp(t * Math.log(mouthRadius / throatRadius));
    
    // Blend the two profiles and apply normalization
    // Using a combination of the blend factor and position to ensure smooth transition
    const radius = throatRadius + (mouthRadius - throatRadius) * t * 
                  (1 + blendFactor * (Math.cosh(t) - 1) / 2 + 
                   (1 - blendFactor) * (hyperbolicRadius / throatRadius - 1) * 0.1 +
                   blendFactor * (exponentialRadius / throatRadius - 1) * 0.1);
    
    points.push({ x, radius: Math.min(radius, mouthRadius) });
  }
  
  // Ensure exact throat and mouth radii
  if (points.length > 0) {
    points[0].radius = throatRadius;
    points[points.length - 1].radius = mouthRadius;
  }
  
  return points;
}