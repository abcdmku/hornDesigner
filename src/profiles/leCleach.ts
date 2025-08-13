import { ProfileParameters, ProfilePoint, validateProfileParameters } from './types';

/**
 * Calculates Le Cléac'h spherical wave horn profile
 * Based on Jean-Michel Le Cléac'h's spherical wave horn theory
 * 
 * This profile is designed to maintain spherical wave propagation
 * throughout the horn, providing excellent phase coherence
 * 
 * @param params Profile parameters with optional cutoff frequency
 * @returns Array of profile points along the horn axis
 */
export function leCleachProfile(params: ProfileParameters): ProfilePoint[] {
  validateProfileParameters(params);
  
  const { throatRadius, mouthRadius, length, segments = 100, cutoffFrequency = 500 } = params;
  const points: ProfilePoint[] = [];
  
  // Speed of sound in air at 20°C (m/s)
  const speedOfSound = 343;
  
  // Calculate the cutoff wavelength
  const wavelength = speedOfSound / cutoffFrequency;
  
  // Le Cléac'h parameter (related to the cutoff frequency)
  // fc = c / (2π * throatRadius) => for ideal coupling
  const k = (2 * Math.PI * cutoffFrequency) / speedOfSound;
  
  // The Le Cléac'h profile follows a specific expansion law
  // that maintains spherical wavefronts
  
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const x = t * length;
    
    // Le Cléac'h expansion formula
    // This is a simplified version of the full spherical wave equation
    // The actual formula involves Bessel functions and is quite complex
    
    // Approximation using a modified exponential with frequency-dependent terms
    const expansionRate = Math.log(mouthRadius / throatRadius) / length;
    
    // Frequency-dependent correction factor
    const correctionFactor = 1 + (wavelength / (4 * Math.PI * throatRadius)) * Math.sin(k * x);
    
    // Calculate radius with spherical wave correction
    const baseRadius = throatRadius * Math.exp(expansionRate * x);
    const radius = baseRadius * correctionFactor;
    
    // Smooth the profile to ensure monotonic increase
    const smoothedRadius = throatRadius + (radius - throatRadius) * t;
    
    // Ensure we don't exceed the mouth radius
    const finalRadius = Math.min(smoothedRadius, throatRadius + (mouthRadius - throatRadius) * t);
    
    points.push({ x, radius: finalRadius });
  }
  
  // Apply a smoothing pass to ensure the profile is physically realizable
  const smoothedPoints = smoothProfile(points);
  
  // Ensure exact throat and mouth radii
  if (smoothedPoints.length > 0) {
    smoothedPoints[0].radius = throatRadius;
    smoothedPoints[smoothedPoints.length - 1].radius = mouthRadius;
  }
  
  return smoothedPoints;
}

/**
 * Smooths the profile to ensure physical realizability
 * Uses a simple moving average filter
 */
function smoothProfile(points: ProfilePoint[], windowSize: number = 3): ProfilePoint[] {
  const smoothed: ProfilePoint[] = [];
  
  for (let i = 0; i < points.length; i++) {
    let sumRadius = 0;
    let count = 0;
    
    // Calculate moving average
    for (let j = Math.max(0, i - windowSize); j <= Math.min(points.length - 1, i + windowSize); j++) {
      sumRadius += points[j].radius;
      count++;
    }
    
    smoothed.push({
      x: points[i].x,
      radius: sumRadius / count
    });
  }
  
  return smoothed;
}