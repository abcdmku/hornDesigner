/**
 * Le Cléac'h horn profile
 * Optimized profile with frequency-dependent rollover
 * Provides constant directivity with smooth rollover
 * Reference: Jean Michel Le Cléac'h horn studies
 */

import { ProfileParams, ProfilePoint } from './types';

export function leCleach(params: ProfileParams): ProfilePoint[] {
  const { throatRadius, mouthRadius, length, segments } = params;
  const points: ProfilePoint[] = [];
  
  // Cutoff frequency for rollover characteristic
  const cutoffFreq = params.cutoffFrequency ?? 800; // Hz
  const c = 343000; // Speed of sound in mm/s
  const wavelength = c / cutoffFreq;
  
  // Le Cléac'h profile parameters
  const rolloverPoint = params.rolloverPoint ?? 0.7; // Position along length where rollover starts
  const rolloverStrength = params.rolloverStrength ?? 0.8; // How strong the rollover effect is
  
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const z = t * length;
    
    if (i === 0) {
      points.push({ z: 0, r: throatRadius });
    } else if (i === segments) {
      points.push({ z: length, r: mouthRadius });
    } else {
      // Le Cléac'h profile combines exponential growth with rollover
      const m = Math.log(mouthRadius / throatRadius) / length;
      
      // Base exponential expansion
      let r = throatRadius * Math.exp(m * z);
      
      // Apply rollover characteristic after rollover point
      if (t > rolloverPoint) {
        const rolloverProgress = (t - rolloverPoint) / (1 - rolloverPoint);
        const rolloverFactor = 1 - rolloverStrength * Math.pow(rolloverProgress, 2);
        
        // Blend between exponential and final radius
        r = r * rolloverFactor + mouthRadius * (1 - rolloverFactor);
      }
      
      // Frequency-dependent adjustment
      const freqFactor = Math.min(1, wavelength / (4 * r));
      r = r * (1 - 0.1 * (1 - freqFactor));
      
      // Ensure within bounds
      r = Math.min(Math.max(r, throatRadius), mouthRadius);
      
      points.push({ z, r });
    }
  }
  
  return points;
}