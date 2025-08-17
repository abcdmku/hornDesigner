/**
 * Tractrix horn profile
 * Classic tractrix curve with proper rollover characteristics
 * The tractrix provides constant directivity above cutoff frequency
 */

import { ProfileParams, ProfilePoint } from './types';

export function tractrix(params: ProfileParams): ProfilePoint[] {
  const { throatRadius, mouthRadius, length, segments } = params;
  const points: ProfilePoint[] = [];
  
  // Cutoff frequency determines the rollover point
  const cutoffFreq = params.cutoffFrequency ?? 500; // Hz
  const c = 343000; // Speed of sound in mm/s
  const cutoffWavelength = c / cutoffFreq;
  const k = 2 * Math.PI / cutoffWavelength; // Wavenumber
  
  // Calculate the mouth radius for infinite horn
  const a = throatRadius / Math.tanh(k * throatRadius);
  
  for (let i = 0; i <= segments; i++) {
    const z = (i / segments) * length;
    
    if (i === 0) {
      points.push({ z: 0, r: throatRadius });
    } else {
      // Tractrix equation: r = a * sech(z/a + offset)
      // where offset ensures r(0) = throatRadius
      const offset = Math.log((a + Math.sqrt(a * a - throatRadius * throatRadius)) / throatRadius);
      
      // Calculate radius using tractrix equation
      let r = a / Math.cosh(z / a + offset);
      
      // Apply scaling to match desired mouth radius
      const theoreticalMouthRadius = a / Math.cosh(length / a + offset);
      if (theoreticalMouthRadius > throatRadius) {
        const scale = (mouthRadius - throatRadius) / (theoreticalMouthRadius - throatRadius);
        r = throatRadius + (r - throatRadius) * scale;
      }
      
      // Ensure within bounds
      r = Math.min(Math.max(r, throatRadius), mouthRadius);
      
      points.push({ z, r });
    }
  }
  
  return points;
}