/**
 * Directivity Index Calculator
 * Calculates DI and Q factor for horn loudspeakers
 */

import { DirectivityResult, PolarData } from '../types';

export class DirectivityCalculator {
  /**
   * Calculate directivity index and Q factor from coverage angles
   */
  static calculateFromCoverage(
    horizontalCoverage: number, // degrees
    verticalCoverage: number    // degrees
  ): DirectivityResult {
    // Convert to radians
    const hRad = horizontalCoverage * Math.PI / 180;
    const vRad = verticalCoverage * Math.PI / 180;
    
    // Calculate Q factor (directivity factor)
    // For rectangular coverage pattern: Q ≈ 180² / (H × V)
    // More accurate formula: Q = 4π / Ω where Ω is solid angle
    const solidAngle = 2 * Math.PI * (1 - Math.cos(vRad / 2)) * (hRad / Math.PI);
    const Q = 4 * Math.PI / solidAngle;
    
    // Calculate DI
    const DI = 10 * Math.log10(Q);
    
    return {
      directivityIndex: DI,
      directivityFactor: Q,
      coverage: {
        horizontal: horizontalCoverage,
        vertical: verticalCoverage
      }
    };
  }

  /**
   * Calculate directivity from polar pattern data
   * More accurate method using integration
   */
  static calculateFromPolarPattern(
    horizontalPattern: PolarData,
    verticalPattern: PolarData
  ): DirectivityResult {
    // Calculate Q from polar patterns using numerical integration
    const Q = this.integrateDirectivityFactor(horizontalPattern, verticalPattern);
    const DI = 10 * Math.log10(Q);
    
    // Determine coverage angles at -6dB
    const horizontalCoverage = this.findCoverageAngle(horizontalPattern, -6);
    const verticalCoverage = this.findCoverageAngle(verticalPattern, -6);
    
    return {
      directivityIndex: DI,
      directivityFactor: Q,
      coverage: {
        horizontal: horizontalCoverage,
        vertical: verticalCoverage
      }
    };
  }

  /**
   * Calculate frequency-dependent directivity
   */
  static calculateFrequencyDependentDI(
    mouthWidth: number,  // mm
    mouthHeight: number, // mm
    frequencies: number[]
  ): Array<{ frequency: number; DI: number; Q: number }> {
    const K = 29000; // Empirical constant
    const results = [];
    
    for (const frequency of frequencies) {
      // Calculate beamwidths
      const horizontalBeamwidth = K / ((mouthWidth / 25.4) * frequency);
      const verticalBeamwidth = K / ((mouthHeight / 25.4) * frequency);
      
      // Limit to realistic values
      const h = Math.min(180, horizontalBeamwidth);
      const v = Math.min(180, verticalBeamwidth);
      
      const result = this.calculateFromCoverage(h, v);
      
      results.push({
        frequency,
        DI: result.directivityIndex,
        Q: result.directivityFactor
      });
    }
    
    return results;
  }

  /**
   * Integrate directivity factor from polar patterns
   * Q = 4π / ∫∫ |p(θ,φ)|² sin(θ) dθ dφ
   */
  private static integrateDirectivityFactor(
    horizontalPattern: PolarData,
    verticalPattern: PolarData
  ): number {
    // Simplified integration assuming symmetry
    let integral = 0;
    const dTheta = Math.PI / 180; // 1 degree steps
    
    // Integrate over hemisphere (0 to π for elevation, 0 to 2π for azimuth)
    for (let theta = 0; theta <= Math.PI; theta += dTheta) {
      for (let phi = 0; phi <= 2 * Math.PI; phi += dTheta) {
        // Get pattern values
        const hValue = this.interpolatePattern(horizontalPattern, phi);
        const vValue = this.interpolatePattern(verticalPattern, theta);
        
        // Combined directivity (assuming separable patterns)
        const directivity = hValue * vValue;
        
        // Integrate: |p|² sin(θ) dθ dφ
        integral += directivity * directivity * Math.sin(theta) * dTheta * dTheta;
      }
    }
    
    // Q = 4π / integral
    return integral > 0 ? (4 * Math.PI) / integral : 1;
  }

  /**
   * Interpolate pattern value at a given angle
   */
  private static interpolatePattern(pattern: PolarData, angle: number): number {
    const { angles, magnitudes } = pattern;
    
    // Find surrounding points
    for (let i = 0; i < angles.length - 1; i++) {
      if (angle >= angles[i] && angle <= angles[i + 1]) {
        // Linear interpolation
        const t = (angle - angles[i]) / (angles[i + 1] - angles[i]);
        return magnitudes[i] + t * (magnitudes[i + 1] - magnitudes[i]);
      }
    }
    
    // Outside range, return edge value
    return angle < angles[0] ? magnitudes[0] : magnitudes[magnitudes.length - 1];
  }

  /**
   * Find coverage angle at specified dB down point
   */
  private static findCoverageAngle(pattern: PolarData, dBDown: number): number {
    const { angles, magnitudes } = pattern;
    const threshold = Math.pow(10, dBDown / 20);
    
    // Find on-axis response (assume it's at angle = 0)
    const onAxisIndex = angles.findIndex(a => Math.abs(a) < 0.01);
    const onAxisResponse = onAxisIndex >= 0 ? magnitudes[onAxisIndex] : 1;
    
    const targetLevel = onAxisResponse * threshold;
    
    // Find where response drops below threshold
    let coverageAngle = 180;
    
    for (let i = onAxisIndex; i < magnitudes.length; i++) {
      if (magnitudes[i] < targetLevel) {
        const angleInDegrees = Math.abs(angles[i] * 180 / Math.PI);
        coverageAngle = angleInDegrees * 2; // Total coverage
        break;
      }
    }
    
    return coverageAngle;
  }

  /**
   * Calculate Distance Factor (inverse square law compensation)
   */
  static calculateDistanceFactor(
    distance: number,     // meters
    referenceDistance: number = 1 // meters
  ): number {
    return 20 * Math.log10(referenceDistance / distance);
  }

  /**
   * Calculate SPL at distance given DI and power
   */
  static calculateSPL(
    power: number,        // Watts
    distance: number,     // meters
    DI: number,          // dB
    sensitivity: number = 100 // dB SPL @ 1W/1m
  ): number {
    // SPL = Sensitivity + 10*log(Power) + DI - 20*log(distance)
    const powerTerm = 10 * Math.log10(power);
    const distanceTerm = 20 * Math.log10(distance);
    
    return sensitivity + powerTerm + DI - distanceTerm;
  }

  /**
   * Calculate critical distance (where direct = reverberant)
   */
  static calculateCriticalDistance(
    Q: number,           // Directivity factor
    roomVolume: number,  // cubic meters
    RT60: number        // Reverberation time in seconds
  ): number {
    // Sabine equation: A = 0.161 * V / RT60
    const absorption = 0.161 * roomVolume / RT60;
    
    // Critical distance: Dc = 0.141 * sqrt(Q * A)
    return 0.141 * Math.sqrt(Q * absorption);
  }

  /**
   * Calculate room gain at a specific distance
   */
  static calculateRoomGain(
    distance: number,
    criticalDistance: number
  ): number {
    // Room gain in dB relative to free field
    const ratio = distance / criticalDistance;
    
    if (ratio < 1) {
      // In direct field, no room gain
      return 0;
    } else {
      // In reverberant field, gain increases with distance
      return 10 * Math.log10(1 + Math.pow(criticalDistance / distance, 2));
    }
  }

  /**
   * Calculate array directivity for multiple horns
   */
  static calculateArrayDirectivity(
    hornCount: number,
    spacing: number,      // meters
    frequency: number,    // Hz
    singleHornDI: number  // dB
  ): DirectivityResult {
    // Simplified array factor for line array
    const wavelength = 343 / frequency; // Speed of sound / frequency
    const d = spacing / wavelength;
    
    // Array factor gain (simplified)
    const arrayGain = 10 * Math.log10(hornCount);
    
    // Narrowing factor based on spacing
    const narrowingFactor = Math.sin(Math.PI * d) / (Math.PI * d);
    
    // Combined DI
    const totalDI = singleHornDI + arrayGain * Math.abs(narrowingFactor);
    const Q = Math.pow(10, totalDI / 10);
    
    // Approximate coverage angles (simplified)
    const singleHornQ = Math.pow(10, singleHornDI / 10);
    const coverage = {
      horizontal: 180 / Math.sqrt(Q),
      vertical: 180 / Math.sqrt(singleHornQ)
    };
    
    return {
      directivityIndex: totalDI,
      directivityFactor: Q,
      coverage
    };
  }
}