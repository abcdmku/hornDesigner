/**
 * Frequency Response Analysis Module
 * Calculates horn acoustic frequency response using Webster equation
 */

import { 
  FrequencyResponseData,
  FrequencyPoint,
  ComplexNumber,
  SPEED_OF_SOUND,
  AIR_DENSITY
} from '../types';
import { ProfilePoint } from '../../profiles/types';
import { HornProfileParams } from '../../lib/types';

export class FrequencyResponseAnalyzer {
  /**
   * Calculate complete frequency response for a horn profile
   */
  static calculateResponse(
    profile: ProfilePoint[],
    params: HornProfileParams
  ): FrequencyResponseData {
    // Convert dimensions to meters for calculations
    const throatRadius = params.throatDiameter / 2000; // mm to m
    
    // Calculate cutoff frequency
    const cutoffFrequency = this.calculateCutoffFrequency(throatRadius);
    
    // Generate frequency points (logarithmic spacing)
    const frequencies = this.generateLogFrequencies(20, 20000, 100);
    
    // Calculate response at each frequency
    const response: FrequencyPoint[] = frequencies.map(frequency => {
      const loading = this.calculateHornLoading(profile, frequency);
      const efficiency = this.calculateEfficiency(loading, frequency, cutoffFrequency);
      const phase = this.calculatePhase(profile, frequency);
      const impedance = this.calculateAcousticImpedance(profile, frequency);
      
      // Convert efficiency to SPL (dB)
      // Reference: 1W input at 1m distance
      const referenceSPL = 112; // dB SPL for 100% efficient horn at 1W/1m
      const spl = referenceSPL + 10 * Math.log10(Math.max(0.0001, efficiency));
      
      return {
        frequency,
        spl,
        phase,
        impedance
      };
    });
    
    // Calculate throat impedance
    const impedanceAtThroat = this.calculateThroatImpedance(throatRadius, cutoffFrequency);
    
    // Calculate overall efficiency
    const avgEfficiency = this.calculateAverageEfficiency(response);
    
    return {
      cutoffFrequency,
      response,
      impedanceAtThroat,
      efficiency: avgEfficiency
    };
  }

  /**
   * Calculate horn cutoff frequency
   * fc = c / (4π * a) where a is throat radius
   */
  static calculateCutoffFrequency(throatRadius: number): number {
    return SPEED_OF_SOUND / (4 * Math.PI * throatRadius);
  }

  /**
   * Calculate horn loading at a specific frequency
   * Based on Webster horn equation solution
   */
  private static calculateHornLoading(
    profile: ProfilePoint[],
    frequency: number
  ): number {
    // Wave number
    const k = 2 * Math.PI * frequency / SPEED_OF_SOUND;
    
    // Convert profile to meters
    const profileMeters = profile.map(p => ({
      x: p.x / 1000,
      radius: p.radius / 1000
    }));
    
    // Solve Webster equation using WKB approximation
    // This is a simplified solution for computational efficiency
    let loading = 1;
    
    for (let i = 1; i < profileMeters.length; i++) {
      const dx = profileMeters[i].x - profileMeters[i - 1].x;
      const r1 = profileMeters[i - 1].radius;
      const r2 = profileMeters[i].radius;
      
      // Area expansion
      const S1 = Math.PI * r1 * r1;
      const S2 = Math.PI * r2 * r2;
      
      // Local impedance change
      const dZ = this.calculateLocalImpedance(S1, S2, k, dx);
      
      // Accumulate loading factor
      loading *= dZ;
    }
    
    // Normalize loading (0 to 1)
    return Math.min(1, Math.abs(loading));
  }

  /**
   * Calculate local impedance for Webster equation
   */
  private static calculateLocalImpedance(
    S1: number,
    S2: number,
    k: number,
    dx: number
  ): number {
    // Characteristic impedance: Z = ρc/S
    const Z1 = (AIR_DENSITY * SPEED_OF_SOUND) / S1;
    const Z2 = (AIR_DENSITY * SPEED_OF_SOUND) / S2;
    
    // Transmission coefficient
    const r = (Z2 - Z1) / (Z2 + Z1);
    
    // Phase shift
    const phase = k * dx;
    
    // Complex transmission including phase
    const transmission = Math.sqrt(1 - r * r) * Math.cos(phase);
    
    return transmission;
  }

  /**
   * Calculate efficiency based on loading and frequency
   */
  private static calculateEfficiency(
    loading: number,
    frequency: number,
    cutoffFrequency: number
  ): number {
    // Below cutoff, efficiency drops rapidly
    if (frequency < cutoffFrequency) {
      const rolloff = Math.pow(frequency / cutoffFrequency, 4);
      return loading * rolloff;
    }
    
    // Above cutoff, efficiency is primarily determined by loading
    // with some high-frequency rolloff
    const hfRolloff = 1 / (1 + Math.pow(frequency / (10 * cutoffFrequency), 2));
    
    return loading * hfRolloff;
  }

  /**
   * Calculate phase response
   */
  private static calculatePhase(
    profile: ProfilePoint[],
    frequency: number
  ): number {
    // Calculate wavelength
    const wavelength = SPEED_OF_SOUND / frequency;
    
    // Get horn length in meters
    const lengthMeters = profile[profile.length - 1].x / 1000;
    
    // Phase delay through horn
    const phaseDelay = (lengthMeters / wavelength) * 360;
    
    // Wrap phase to -180 to +180 degrees
    return ((phaseDelay % 360) + 360) % 360 - 180;
  }

  /**
   * Calculate acoustic impedance at a frequency
   */
  private static calculateAcousticImpedance(
    profile: ProfilePoint[],
    frequency: number
  ): ComplexNumber {
    const k = 2 * Math.PI * frequency / SPEED_OF_SOUND;
    
    // Get throat and mouth areas
    const throatArea = Math.PI * Math.pow(profile[0].radius / 1000, 2);
    const mouthArea = Math.PI * Math.pow(profile[profile.length - 1].radius / 1000, 2);
    
    // Characteristic impedance at throat
    const Z0 = (AIR_DENSITY * SPEED_OF_SOUND) / throatArea;
    
    // Radiation impedance at mouth (simplified)
    const ka = k * Math.sqrt(mouthArea / Math.PI);
    
    // Radiation resistance and reactance (Beranek formulas)
    const radiationResistance = Z0 * (1 - BesselJ1(2 * ka) / ka);
    const radiationReactance = Z0 * StruveH1(2 * ka) / ka;
    
    return {
      real: radiationResistance,
      imaginary: radiationReactance
    };
  }

  /**
   * Calculate throat impedance
   */
  private static calculateThroatImpedance(
    throatRadius: number,
    _cutoffFrequency: number
  ): ComplexNumber {
    const throatArea = Math.PI * throatRadius * throatRadius;
    const Z0 = (AIR_DENSITY * SPEED_OF_SOUND) / throatArea;
    
    // At cutoff, reactance equals resistance
    return {
      real: Z0,
      imaginary: Z0
    };
  }

  /**
   * Calculate average efficiency across frequency range
   */
  private static calculateAverageEfficiency(response: FrequencyPoint[]): number {
    if (response.length === 0) return 0;
    
    // Weight efficiency by frequency (logarithmic weighting)
    let weightedSum = 0;
    let weightSum = 0;
    
    for (let i = 1; i < response.length; i++) {
      const freq = response[i].frequency;
      const efficiency = Math.pow(10, (response[i].spl - 112) / 10);
      
      // Logarithmic weight
      const weight = Math.log10(freq);
      
      weightedSum += efficiency * weight;
      weightSum += weight;
    }
    
    return weightSum > 0 ? (weightedSum / weightSum) * 100 : 0;
  }

  /**
   * Generate logarithmically spaced frequencies
   */
  static generateLogFrequencies(
    min: number,
    max: number,
    points: number
  ): number[] {
    const frequencies: number[] = [];
    const logMin = Math.log10(min);
    const logMax = Math.log10(max);
    const step = (logMax - logMin) / (points - 1);
    
    for (let i = 0; i < points; i++) {
      frequencies.push(Math.pow(10, logMin + i * step));
    }
    
    return frequencies;
  }

  /**
   * Calculate group delay (derivative of phase)
   */
  static calculateGroupDelay(
    response: FrequencyPoint[]
  ): Array<{ frequency: number; delay: number }> {
    const groupDelay = [];
    
    for (let i = 1; i < response.length - 1; i++) {
      const f1 = response[i - 1].frequency;
      const f2 = response[i + 1].frequency;
      const p1 = response[i - 1].phase || 0;
      const p2 = response[i + 1].phase || 0;
      
      // Calculate derivative of phase with respect to frequency
      const dPhase = (p2 - p1) * Math.PI / 180; // Convert to radians
      const dFreq = 2 * Math.PI * (f2 - f1);
      
      const delay = -dPhase / dFreq * 1000; // Convert to milliseconds
      
      groupDelay.push({
        frequency: response[i].frequency,
        delay
      });
    }
    
    return groupDelay;
  }

  /**
   * Calculate power response (including directivity)
   */
  static calculatePowerResponse(
    response: FrequencyPoint[],
    directivityIndex: number
  ): FrequencyPoint[] {
    return response.map(point => ({
      ...point,
      spl: point.spl + directivityIndex // Add DI to get on-axis response
    }));
  }
}

// Helper functions for Bessel and Struve functions
function BesselJ1(x: number): number {
  // Simplified Bessel function J1 for radiation impedance
  if (x < 3.0) {
    const x2 = x * x;
    return x * (0.5 - x2 / 16 + x2 * x2 / 384);
  } else {
    return Math.sqrt(2 / (Math.PI * x)) * Math.cos(x - 3 * Math.PI / 4);
  }
}

function StruveH1(x: number): number {
  // Simplified Struve function H1 for radiation reactance
  if (x < 3.0) {
    const x2 = x * x;
    return 2 * x / Math.PI * (1 + x2 / 6);
  } else {
    return Math.sqrt(2 / (Math.PI * x)) * Math.sin(x - 3 * Math.PI / 4);
  }
}