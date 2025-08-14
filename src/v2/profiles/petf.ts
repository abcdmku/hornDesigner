/**
 * PETF (Progressive Expansion T-Factor) horn profile
 * T-factor varies progressively along the horn length
 * Reference: https://sphericalhorns.net/2020/12/14/progressive-expansion-t-factor-horns/
 */

import { ProfileParams, ProfilePoint } from './types';

export function petf(params: ProfileParams): ProfilePoint[] {
  const { throatRadius, mouthRadius, length, segments } = params;
  const points: ProfilePoint[] = [];
  
  // PETF parameters
  const tStart = params.tStart ?? 0.5; // T-factor at throat
  const tEnd = params.tEnd ?? 1.0; // T-factor at mouth
  const progressionType = params.progressionType ?? 'exponential'; // linear, exponential, or sigmoid
  
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const z = t * length;
    
    // Calculate progressive T-factor
    let tFactor: number;
    switch (progressionType) {
      case 'linear':
        tFactor = tStart + (tEnd - tStart) * t;
        break;
      case 'exponential':
        tFactor = tStart * Math.pow(tEnd / tStart, t);
        break;
      case 'sigmoid':
        const sigmoidX = 10 * (t - 0.5);
        const sigmoid = 1 / (1 + Math.exp(-sigmoidX));
        tFactor = tStart + (tEnd - tStart) * sigmoid;
        break;
      default:
        tFactor = tStart + (tEnd - tStart) * t;
    }
    
    // Apply progressive T-factor to expansion
    // Combines hyperbolic and exponential characteristics with varying T
    const k = Math.log(mouthRadius / throatRadius);
    const zNorm = z / length;
    
    // Modified hypex formula with progressive T-factor
    const hyperbolicPart = Math.cosh(tFactor * k * zNorm);
    const exponentialPart = Math.exp((1 - tFactor) * k * zNorm);
    
    let r = throatRadius * Math.pow(hyperbolicPart * exponentialPart, 1 / (1 + 0.5 * (1 - tFactor)));
    
    // Ensure exact match at throat and mouth
    if (i === 0) {
      r = throatRadius;
    } else if (i === segments) {
      r = mouthRadius;
    }
    
    // Ensure within bounds
    r = Math.min(Math.max(r, throatRadius), mouthRadius);
    
    points.push({ z, r });
  }
  
  return points;
}