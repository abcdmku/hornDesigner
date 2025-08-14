/**
 * Transmission Line (TL) Solver for horn acoustics
 * Implements 1D Webster equation solver for horn transfer function
 * Returns complex H_horn(f) and Z_throat(f)
 */

import { Complex, ComplexOps } from './numericUtils';
import { ProfilePoint } from '../profiles/types';

/**
 * Acoustic medium properties
 */
export interface MediumProperties {
  speedOfSound: number; // m/s
  density: number; // kg/m³
  temperature?: number; // Celsius
}

/**
 * Frequency response result
 */
export interface FrequencyResponse {
  frequency: number; // Hz
  H_horn: Complex; // Transfer function
  Z_throat: Complex; // Throat impedance
  SPL: number; // Sound pressure level (dB)
  phase: number; // Phase (radians)
  groupDelay?: number; // Group delay (ms)
}

/**
 * TL Solver parameters
 */
export interface TLSolverParams {
  profile: ProfilePoint[];
  frequencies: number[];
  medium?: MediumProperties;
  terminationImpedance?: Complex; // Radiation impedance at mouth
}

/**
 * Default air properties at 20°C
 */
const DEFAULT_MEDIUM: MediumProperties = {
  speedOfSound: 343.2,
  density: 1.204,
  temperature: 20
};

/**
 * Calculate speed of sound based on temperature
 */
function calculateSpeedOfSound(temperature: number): number {
  return 331.3 * Math.sqrt(1 + temperature / 273.15);
}

/**
 * Calculate characteristic impedance (Z0 = ρc/S)
 */
function characteristicImpedance(
  area: number,
  medium: MediumProperties
): number {
  return (medium.density * medium.speedOfSound) / area;
}

/**
 * Calculate radiation impedance at horn mouth
 * Using piston-in-infinite-baffle approximation
 */
function radiationImpedance(
  mouthRadius: number,
  frequency: number,
  medium: MediumProperties
): Complex {
  const k = (2 * Math.PI * frequency) / medium.speedOfSound; // Wave number
  const ka = k * mouthRadius;
  const ka2 = ka * ka;
  
  // Normalized radiation impedance components
  const R = 1 - 2 * besselJ1(2 * ka) / (2 * ka);
  const X = 2 * struve1(2 * ka) / (2 * ka);
  
  const Z0 = medium.density * medium.speedOfSound / (Math.PI * mouthRadius * mouthRadius);
  
  return {
    real: R * Z0,
    imag: X * Z0
  };
}

/**
 * Bessel function of first kind, order 1
 */
function besselJ1(x: number): number {
  if (Math.abs(x) < 1e-10) return 0;
  
  // Series expansion for small x
  if (Math.abs(x) < 3) {
    let sum = 0;
    let term = x / 2;
    let n = 0;
    
    while (Math.abs(term) > 1e-10 && n < 20) {
      sum += term;
      n++;
      term *= -(x * x) / (4 * n * (n + 1));
    }
    return sum;
  }
  
  // Asymptotic expansion for large x
  const phase = x - 3 * Math.PI / 4;
  return Math.sqrt(2 / (Math.PI * x)) * Math.cos(phase);
}

/**
 * Struve function H1
 */
function struve1(x: number): number {
  if (Math.abs(x) < 1e-10) return 0;
  
  // Approximation for Struve H1
  // Using series expansion for small x
  if (Math.abs(x) < 5) {
    let sum = 0;
    let term = Math.pow(x / 2, 2) / (Math.PI * 1.5);
    let n = 0;
    
    while (Math.abs(term) > 1e-10 && n < 20) {
      sum += term;
      n++;
      const factor = (n + 0.5) * (n + 1.5);
      term *= -(x * x) / (4 * factor);
    }
    return sum * x;
  }
  
  // Asymptotic approximation for large x
  return Math.sqrt(2 / (Math.PI * x)) * (1 - Math.cos(x - Math.PI / 4));
}

/**
 * Main TL solver using Webster equation
 * Implements transmission line matrix method
 */
export function solveTL(params: TLSolverParams): FrequencyResponse[] {
  const { profile, frequencies, medium = DEFAULT_MEDIUM } = params;
  const results: FrequencyResponse[] = [];
  
  // Update speed of sound if temperature provided
  const actualMedium = { ...medium };
  if (medium.temperature !== undefined) {
    actualMedium.speedOfSound = calculateSpeedOfSound(medium.temperature);
  }
  
  // Get mouth radius from last profile point
  const mouthRadius = profile[profile.length - 1].r / 1000; // Convert mm to m
  
  for (const freq of frequencies) {
    const omega = 2 * Math.PI * freq;
    const k = omega / actualMedium.speedOfSound; // Wave number
    
    // Calculate termination impedance (radiation impedance at mouth)
    const Z_term = params.terminationImpedance || 
                   radiationImpedance(mouthRadius, freq, actualMedium);
    
    // Initialize transfer matrix as identity
    let T11: Complex = { real: 1, imag: 0 };
    let T12: Complex = { real: 0, imag: 0 };
    let T21: Complex = { real: 0, imag: 0 };
    let T22: Complex = { real: 1, imag: 0 };
    
    // Process each segment of the horn
    for (let i = 0; i < profile.length - 1; i++) {
      const z1 = profile[i].z / 1000; // Convert mm to m
      const z2 = profile[i + 1].z / 1000;
      const r1 = profile[i].r / 1000;
      const r2 = profile[i + 1].r / 1000;
      
      const dz = z2 - z1;
      if (dz <= 0) continue;
      
      // Areas
      const S1 = Math.PI * r1 * r1;
      const S2 = Math.PI * r2 * r2;
      
      // Average area for segment
      const S_avg = (S1 + S2) / 2;
      
      // Characteristic impedance for segment
      const Z0 = characteristicImpedance(S_avg, actualMedium);
      
      // Propagation constant
      const beta = k;
      const gamma: Complex = { real: 0, imag: beta };
      
      // Calculate segment transfer matrix
      const cosh_gz = ComplexOps.fromPolar(Math.cosh(gamma.real * dz), gamma.imag * dz);
      const sinh_gz = ComplexOps.fromPolar(Math.sinh(gamma.real * dz), gamma.imag * dz);
      
      // Area discontinuity correction
      const area_ratio = S2 / S1;
      const discontinuity_factor = (1 + area_ratio) / 2;
      
      // Segment matrix elements
      const seg_T11 = ComplexOps.multiply(cosh_gz, { real: discontinuity_factor, imag: 0 });
      const seg_T12 = ComplexOps.multiply(sinh_gz, { real: Z0, imag: 0 });
      const seg_T21 = ComplexOps.divide(sinh_gz, { real: Z0, imag: 0 });
      const seg_T22 = ComplexOps.multiply(cosh_gz, { real: 1 / discontinuity_factor, imag: 0 });
      
      // Multiply transfer matrices
      const new_T11 = ComplexOps.add(
        ComplexOps.multiply(T11, seg_T11),
        ComplexOps.multiply(T12, seg_T21)
      );
      const new_T12 = ComplexOps.add(
        ComplexOps.multiply(T11, seg_T12),
        ComplexOps.multiply(T12, seg_T22)
      );
      const new_T21 = ComplexOps.add(
        ComplexOps.multiply(T21, seg_T11),
        ComplexOps.multiply(T22, seg_T21)
      );
      const new_T22 = ComplexOps.add(
        ComplexOps.multiply(T21, seg_T12),
        ComplexOps.multiply(T22, seg_T22)
      );
      
      T11 = new_T11;
      T12 = new_T12;
      T21 = new_T21;
      T22 = new_T22;
    }
    
    // Calculate throat impedance
    // Z_throat = (T11 * Z_term + T12) / (T21 * Z_term + T22)
    const numerator = ComplexOps.add(
      ComplexOps.multiply(T11, Z_term),
      T12
    );
    const denominator = ComplexOps.add(
      ComplexOps.multiply(T21, Z_term),
      T22
    );
    const Z_throat = ComplexOps.divide(numerator, denominator);
    
    // Calculate transfer function H_horn
    // H_horn = 1 / T11 (simplified for matched termination)
    const H_horn = ComplexOps.divide({ real: 1, imag: 0 }, T11);
    
    // Calculate SPL and phase
    const magnitude = ComplexOps.magnitude(H_horn);
    const SPL = 20 * Math.log10(Math.max(1e-10, magnitude));
    const phase = ComplexOps.phase(H_horn);
    
    // Calculate group delay (optional)
    let groupDelay: number | undefined;
    const freqIndex = frequencies.indexOf(freq);
    if (frequencies.length > 1 && freqIndex > 0) {
      const prevPhase = results[results.length - 1].phase;
      const dPhase = phase - prevPhase;
      const dFreq = freq - frequencies[freqIndex - 1];
      if (dFreq > 0) {
        groupDelay = -1000 * dPhase / (2 * Math.PI * dFreq); // Convert to ms
      }
    }
    
    results.push({
      frequency: freq,
      H_horn,
      Z_throat,
      SPL,
      phase,
      groupDelay
    });
  }
  
  return results;
}

/**
 * Calculate on-axis SPL for a given driver
 */
export function calculateOnAxisSPL(
  hornResponse: FrequencyResponse,
  driverSensitivity: number, // dB/W @ 1m
  driverImpedance: number, // Ohms (nominal)
  inputPower: number = 1 // Watts
): number {
  // Calculate voltage for given power
  const voltage = Math.sqrt(inputPower * driverImpedance);
  
  // Convert driver sensitivity to linear scale
  const driverLinear = Math.pow(10, driverSensitivity / 20);
  
  // Apply horn transfer function
  const hornGain = ComplexOps.magnitude(hornResponse.H_horn);
  
  // Calculate total SPL
  const totalLinear = driverLinear * hornGain * Math.sqrt(inputPower);
  const totalSPL = 20 * Math.log10(totalLinear);
  
  return totalSPL;
}

/**
 * Export frequency response to CSV format
 */
export function exportFrequencyResponse(
  responses: FrequencyResponse[]
): string {
  let csv = "Frequency(Hz),Magnitude(dB),Phase(deg),GroupDelay(ms)\n";
  
  for (const response of responses) {
    const magnitude = 20 * Math.log10(ComplexOps.magnitude(response.H_horn));
    const phaseDeg = (response.phase * 180) / Math.PI;
    const groupDelay = response.groupDelay || 0;
    
    csv += `${response.frequency},${magnitude.toFixed(2)},${phaseDeg.toFixed(2)},${groupDelay.toFixed(3)}\n`;
  }
  
  return csv;
}