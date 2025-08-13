import { ProfileParameters, ProfilePoint, validateProfileParameters } from './types';

/**
 * Calculates tractrix horn profile (constant directivity horn)
 * The tractrix curve provides constant directivity characteristics
 * 
 * Mathematical formula:
 * x = throatRadius * (ln(tan(θ/2 + π/4)) - cos(θ))
 * radius = throatRadius * sin(θ)
 * where θ varies from θ_throat to θ_mouth
 * 
 * @param params Profile parameters
 * @returns Array of profile points along the horn axis
 */
export function tractrixProfile(params: ProfileParameters): ProfilePoint[] {
  validateProfileParameters(params);
  
  const { throatRadius, mouthRadius, length, segments = 100 } = params;
  const points: ProfilePoint[] = [];
  
  // Calculate the mouth angle based on the desired mouth radius
  // For a tractrix, the asymptotic radius is the throat radius
  // We need to scale the curve to reach the desired mouth radius
  const scaleFactor = mouthRadius / throatRadius;
  
  // The tractrix parameter varies from a small angle to nearly π/2
  const thetaMin = 0.1; // Start angle (avoid singularity at 0)
  const thetaMax = Math.PI / 2 - 0.01; // End angle (avoid singularity at π/2)
  
  // First pass: generate the raw tractrix curve
  const rawPoints: ProfilePoint[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const theta = thetaMin + (thetaMax - thetaMin) * t;
    
    // Tractrix parametric equations
    const x = throatRadius * (Math.log(Math.tan(theta / 2 + Math.PI / 4)) - Math.cos(theta));
    const radius = throatRadius * Math.sin(theta);
    
    rawPoints.push({ x, radius });
  }
  
  // Find the natural length of the tractrix curve
  const naturalLength = rawPoints[rawPoints.length - 1].x - rawPoints[0].x;
  
  // Scale and transform to match desired parameters
  const lengthScale = length / naturalLength;
  const radiusScale = scaleFactor;
  const xOffset = rawPoints[0].x;
  
  for (const point of rawPoints) {
    const scaledX = (point.x - xOffset) * lengthScale;
    const scaledRadius = point.radius * radiusScale;
    
    // Ensure we start at throat radius and end at mouth radius
    const t = scaledX / length;
    const interpolatedRadius = throatRadius + (scaledRadius - throatRadius) * t;
    
    points.push({
      x: scaledX,
      radius: Math.min(interpolatedRadius, mouthRadius) // Cap at mouth radius
    });
  }
  
  // Ensure exact throat and mouth radii
  if (points.length > 0) {
    points[0].radius = throatRadius;
    points[points.length - 1].radius = mouthRadius;
  }
  
  return points;
}