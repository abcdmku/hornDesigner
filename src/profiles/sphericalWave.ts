import { ProfileParameters, ProfilePoint, validateProfileParameters } from './types';

/**
 * Calculates spherical wave horn profile
 * Designed to maintain spherical wavefront expansion throughout the horn
 * 
 * This profile ensures that acoustic waves expand as spherical wavefronts,
 * providing optimal phase coherence and minimal distortion
 * 
 * @param params Profile parameters with optional wave parameters
 * @returns Array of profile points along the horn axis
 */
export function sphericalWaveProfile(
  params: ProfileParameters & { waveParameter?: number }
): ProfilePoint[] {
  validateProfileParameters(params);
  
  const { 
    throatRadius, 
    mouthRadius, 
    length, 
    segments = 100,
    cutoffFrequency = 500,
    waveParameter = 1.0
  } = params;
  
  const points: ProfilePoint[] = [];
  
  // Validate wave parameter
  if (waveParameter <= 0) {
    throw new Error('Wave parameter must be greater than 0');
  }
  
  // Speed of sound in air at 20°C (m/s)
  const speedOfSound = 343;
  
  // Calculate wavelength at cutoff frequency
  const wavelength = speedOfSound / cutoffFrequency;
  
  // For spherical wave propagation, the radius should expand to maintain
  // constant wave impedance along the horn
  
  // The spherical wave equation for horn expansion:
  // r(x) = r0 * sqrt(1 + (x/x0)²)
  // where x0 is related to the wavelength and throat radius
  
  const x0 = (throatRadius * 2 * Math.PI) / wavelength * waveParameter;
  
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const x = t * length;
    
    // Spherical wave expansion formula
    const expansionFactor = Math.sqrt(1 + Math.pow(x / x0, 2));
    
    // Calculate radius based on spherical wave expansion
    let radius = throatRadius * expansionFactor;
    
    // We need to scale this to match our throat and mouth constraints
    // Find the natural expansion at full length
    const naturalMouthRadius = throatRadius * Math.sqrt(1 + Math.pow(length / x0, 2));
    
    // Calculate scaling factor
    const scale = (mouthRadius - throatRadius) / (naturalMouthRadius - throatRadius);
    
    // Apply scaling
    radius = throatRadius + (radius - throatRadius) * scale;
    
    // Apply smoothing for practical implementation
    const smoothingFactor = 1 - Math.exp(-3 * t);
    radius = throatRadius + (radius - throatRadius) * smoothingFactor;
    
    // Ensure we don't exceed design constraints
    const maxRadius = throatRadius + (mouthRadius - throatRadius) * Math.pow(t, 0.9);
    radius = Math.min(radius, maxRadius);
    
    points.push({ x, radius });
  }
  
  // Post-process to ensure smooth transitions
  const processedPoints = postProcessProfile(points, throatRadius, mouthRadius);
  
  return processedPoints;
}

/**
 * Post-processes the profile to ensure physical realizability
 * and exact endpoint matching
 */
function postProcessProfile(
  points: ProfilePoint[],
  throatRadius: number,
  mouthRadius: number
): ProfilePoint[] {
  if (points.length === 0) return points;
  
  // Apply a cubic interpolation to smooth the profile
  const smoothed: ProfilePoint[] = [];
  
  for (let i = 0; i < points.length; i++) {
    const t = i / (points.length - 1);
    
    // Cubic interpolation for smooth transition
    const cubicT = t * t * (3 - 2 * t);
    
    // Blend original with cubic interpolation
    const targetRadius = throatRadius + (mouthRadius - throatRadius) * cubicT;
    const blendedRadius = points[i].radius * 0.8 + targetRadius * 0.2;
    
    smoothed.push({
      x: points[i].x,
      radius: blendedRadius
    });
  }
  
  // Ensure exact endpoints
  if (smoothed.length > 0) {
    smoothed[0].radius = throatRadius;
    smoothed[smoothed.length - 1].radius = mouthRadius;
  }
  
  return smoothed;
}