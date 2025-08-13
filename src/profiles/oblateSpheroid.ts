import { ProfileParameters, ProfilePoint, validateProfileParameters } from './types';

/**
 * Calculates oblate spheroid horn profile
 * Based on the geometry of an oblate spheroid (flattened sphere)
 * 
 * An oblate spheroid is an ellipsoid with two equal semi-diameters
 * This profile provides unique dispersion characteristics
 * 
 * @param params Profile parameters with optional eccentricity
 * @returns Array of profile points along the horn axis
 */
export function oblateSpheroidProfile(
  params: ProfileParameters & { eccentricity?: number }
): ProfilePoint[] {
  validateProfileParameters(params);
  
  const { 
    throatRadius, 
    mouthRadius, 
    length, 
    segments = 100, 
    eccentricity = 0.5 
  } = params;
  
  const points: ProfilePoint[] = [];
  
  // Validate eccentricity
  if (eccentricity < 0 || eccentricity >= 1) {
    throw new Error('Eccentricity must be between 0 and 1 (exclusive of 1)');
  }
  
  // Calculate semi-axes of the oblate spheroid
  // a = equatorial radius, c = polar radius (c < a for oblate)
  const a = mouthRadius; // Equatorial radius
  const c = length; // Polar radius (along horn axis)
  
  // For an oblate spheroid, the profile follows:
  // r²/a² + z²/c² = 1
  // Where r is the radius at position z
  
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const z = t * length; // Position along horn axis
    
    // Calculate radius using oblate spheroid equation
    // r = a * sqrt(1 - (z/c)²)
    const normalizedZ = z / c;
    const radiusRatio = Math.sqrt(Math.max(0, 1 - normalizedZ * normalizedZ));
    
    // Apply eccentricity modification
    // Higher eccentricity = more flattened spheroid
    const eccentricityFactor = 1 - eccentricity * (1 - radiusRatio);
    
    // Calculate the actual radius
    let radius = a * radiusRatio * eccentricityFactor;
    
    // Scale and interpolate to match throat and mouth requirements
    // We need to transform the natural spheroid shape to our constraints
    const scaleFactor = (mouthRadius - throatRadius) / (a - throatRadius);
    radius = throatRadius + (radius - throatRadius) * scaleFactor;
    
    // Apply a linear interpolation to ensure smooth transition
    const linearRadius = throatRadius + (mouthRadius - throatRadius) * t;
    
    // Blend between spheroid and linear for practical implementation
    const blendFactor = 0.7; // 70% spheroid, 30% linear
    radius = radius * blendFactor + linearRadius * (1 - blendFactor);
    
    points.push({ x: z, radius });
  }
  
  // Ensure exact throat and mouth radii
  if (points.length > 0) {
    points[0].radius = throatRadius;
    points[points.length - 1].radius = mouthRadius;
  }
  
  // Apply smoothing to ensure monotonic increase
  return ensureMonotonicIncrease(points);
}

/**
 * Ensures the profile has monotonically increasing radii
 * This is important for physical realizability
 */
function ensureMonotonicIncrease(points: ProfilePoint[]): ProfilePoint[] {
  const corrected: ProfilePoint[] = [];
  let lastRadius = 0;
  
  for (const point of points) {
    const correctedRadius = Math.max(point.radius, lastRadius);
    corrected.push({
      x: point.x,
      radius: correctedRadius
    });
    lastRadius = correctedRadius;
  }
  
  return corrected;
}