/**
 * Dispersion Analysis Module
 * Calculates horn dispersion patterns and required mouth dimensions
 */

import { 
  DispersionParameters, 
  DispersionResult, 
  PolarData,
  SPEED_OF_SOUND 
} from '../types';
import { ProfilePoint } from '../../profiles/types';
import { BesselFunctions } from '../profiles/BesselFunctions';

export class DispersionAnalyzer {
  // Constants for dispersion calculations
  private static readonly K_CONSTANT = 29000; // Empirical constant for inches/degrees
  private static readonly MM_TO_INCH = 0.0393701;
  private static readonly INCH_TO_MM = 25.4;

  /**
   * Calculate required mouth size for target dispersion angles
   * Based on the formula: f = K / (d × Θ)
   */
  static calculateRequiredMouthSize(params: DispersionParameters): DispersionResult {
    const { horizontalAngle, verticalAngle, frequency } = params;
    
    // Calculate required dimensions in inches first (formula uses imperial units)
    const widthInches = this.K_CONSTANT / (frequency * horizontalAngle);
    const heightInches = this.K_CONSTANT / (frequency * verticalAngle);
    
    // Convert to millimeters
    const requiredWidth = widthInches * this.INCH_TO_MM;
    const requiredHeight = heightInches * this.INCH_TO_MM;
    
    // Calculate actual beamwidth based on current mouth size
    const actualHorizontalBeamwidth = this.calculateBeamwidth(
      params.mouthWidth,
      frequency
    );
    const actualVerticalBeamwidth = this.calculateBeamwidth(
      params.mouthHeight,
      frequency
    );
    
    // Calculate directivity index
    const directivityIndex = this.calculateDirectivityIndex(
      actualHorizontalBeamwidth,
      actualVerticalBeamwidth
    );
    
    return {
      requiredWidth,
      requiredHeight,
      horizontalBeamwidth: actualHorizontalBeamwidth,
      verticalBeamwidth: actualVerticalBeamwidth,
      directivityIndex
    };
  }

  /**
   * Calculate beamwidth for a given mouth dimension and frequency
   */
  static calculateBeamwidth(mouthDimension: number, frequency: number): number {
    const dimensionInches = mouthDimension * this.MM_TO_INCH;
    
    if (dimensionInches === 0 || frequency === 0) {
      return 180; // No directivity control
    }
    
    const beamwidth = this.K_CONSTANT / (dimensionInches * frequency);
    
    // Limit to realistic values
    return Math.min(180, Math.max(10, beamwidth));
  }

  /**
   * Calculate dispersion pattern at a specific frequency
   * Returns polar data for visualization
   */
  static calculateDispersionPattern(
    _profile: ProfilePoint[],
    frequency: number,
    axis: 'horizontal' | 'vertical',
    mouthDimension: number
  ): PolarData {
    const angles: number[] = [];
    const magnitudes: number[] = [];
    
    // Calculate wavelength in mm
    const wavelength = (SPEED_OF_SOUND * 1000) / frequency;
    
    // Calculate ka (wave number × aperture radius)
    const ka = (2 * Math.PI * mouthDimension / 2) / wavelength;
    
    // Generate polar pattern from -90 to +90 degrees
    for (let angle = -90; angle <= 90; angle += 5) {
      const theta = angle * Math.PI / 180; // Convert to radians
      angles.push(theta);
      
      // Calculate directivity using diffraction theory
      const magnitude = this.calculateDirectivityAtAngle(ka, theta);
      magnitudes.push(magnitude);
    }
    
    return {
      angles,
      magnitudes,
      frequency,
      axis
    };
  }

  /**
   * Calculate directivity at a specific angle using diffraction theory
   * Based on circular aperture diffraction pattern
   */
  private static calculateDirectivityAtAngle(ka: number, theta: number): number {
    if (ka === 0) return 1; // No directivity
    
    const u = ka * Math.sin(Math.abs(theta));
    
    if (u === 0) {
      return 1; // On-axis response
    }
    
    // Use Bessel function for circular aperture
    // Directivity pattern: |2 * J1(u) / u|
    const j1 = BesselFunctions.besselJ(1, u);
    const directivity = Math.abs(2 * j1 / u);
    
    // Convert to dB and normalize
    const dB = 20 * Math.log10(Math.max(0.0001, directivity));
    
    // Normalize so on-axis = 1 (0 dB)
    const normalized = Math.pow(10, dB / 20);
    
    return Math.min(1, Math.max(0, normalized));
  }

  /**
   * Calculate directivity index from beamwidth angles
   * DI = 10 * log10(Q) where Q is the directivity factor
   */
  static calculateDirectivityIndex(
    horizontalBeamwidth: number,
    verticalBeamwidth: number
  ): number {
    // Convert beamwidths to radians
    const horizontalRad = horizontalBeamwidth * Math.PI / 180;
    const verticalRad = verticalBeamwidth * Math.PI / 180;
    
    // Approximate Q factor for rectangular coverage
    // Q ≈ 4π / (Ωh × Ωv) where Ω is solid angle
    const solidAngle = horizontalRad * verticalRad;
    
    if (solidAngle === 0) {
      return 40; // Maximum theoretical DI
    }
    
    const Q = (4 * Math.PI) / solidAngle;
    const DI = 10 * Math.log10(Q);
    
    // Limit to realistic values
    return Math.min(40, Math.max(0, DI));
  }

  /**
   * Calculate frequency-dependent dispersion
   * Shows how beamwidth changes with frequency
   */
  static calculateFrequencyDependentDispersion(
    mouthWidth: number,
    mouthHeight: number,
    frequencyRange: { min: number; max: number; steps: number }
  ): Array<{
    frequency: number;
    horizontalBeamwidth: number;
    verticalBeamwidth: number;
    directivityIndex: number;
  }> {
    const results = [];
    const { min, max, steps } = frequencyRange;
    
    // Generate logarithmic frequency spacing
    const logMin = Math.log10(min);
    const logMax = Math.log10(max);
    const logStep = (logMax - logMin) / (steps - 1);
    
    for (let i = 0; i < steps; i++) {
      const frequency = Math.pow(10, logMin + i * logStep);
      
      const horizontalBeamwidth = this.calculateBeamwidth(mouthWidth, frequency);
      const verticalBeamwidth = this.calculateBeamwidth(mouthHeight, frequency);
      const directivityIndex = this.calculateDirectivityIndex(
        horizontalBeamwidth,
        verticalBeamwidth
      );
      
      results.push({
        frequency,
        horizontalBeamwidth,
        verticalBeamwidth,
        directivityIndex
      });
    }
    
    return results;
  }

  /**
   * Calculate coverage area at a specific distance
   * Useful for room coverage planning
   */
  static calculateCoverageArea(
    horizontalBeamwidth: number,
    verticalBeamwidth: number,
    distance: number // meters
  ): {
    width: number;  // meters
    height: number; // meters
    area: number;   // square meters
  } {
    // Convert angles to radians
    const hRad = horizontalBeamwidth * Math.PI / 180;
    const vRad = verticalBeamwidth * Math.PI / 180;
    
    // Calculate coverage dimensions using trigonometry
    // Width/Height = 2 * distance * tan(angle/2)
    const width = 2 * distance * Math.tan(hRad / 2);
    const height = 2 * distance * Math.tan(vRad / 2);
    const area = width * height;
    
    return { width, height, area };
  }

  /**
   * Calculate optimal mouth size for a target coverage pattern
   * at a specific frequency and distance
   */
  static calculateOptimalMouthSize(
    targetCoverage: { width: number; height: number }, // meters
    distance: number, // meters
    frequency: number // Hz
  ): {
    mouthWidth: number;  // mm
    mouthHeight: number; // mm
  } {
    // Calculate required beamwidths from coverage
    const horizontalBeamwidth = 2 * Math.atan(targetCoverage.width / (2 * distance)) * 180 / Math.PI;
    const verticalBeamwidth = 2 * Math.atan(targetCoverage.height / (2 * distance)) * 180 / Math.PI;
    
    // Calculate required mouth dimensions
    const widthInches = this.K_CONSTANT / (frequency * horizontalBeamwidth);
    const heightInches = this.K_CONSTANT / (frequency * verticalBeamwidth);
    
    return {
      mouthWidth: widthInches * this.INCH_TO_MM,
      mouthHeight: heightInches * this.INCH_TO_MM
    };
  }

  /**
   * Analyze polar pattern for key metrics
   */
  static analyzePolarPattern(polarData: PolarData): {
    beamwidth: number;      // -6dB beamwidth in degrees
    sidelobeLevel: number;   // dB below main lobe
    frontToBackRatio: number; // dB
  } {
    const { angles, magnitudes } = polarData;
    
    // Find -6dB points for beamwidth
    const minus6dB = Math.pow(10, -6 / 20); // Convert -6dB to linear
    let beamwidth = 180; // Default to omnidirectional
    
    // Find where response drops below -6dB
    for (let i = 0; i < magnitudes.length; i++) {
      if (magnitudes[i] < minus6dB) {
        const angleInDegrees = Math.abs(angles[i] * 180 / Math.PI);
        beamwidth = angleInDegrees * 2; // Total beamwidth
        break;
      }
    }
    
    // Find sidelobe level (first local maximum after main lobe)
    let sidelobeLevel = -40; // Default to very low
    let foundNull = false;
    
    for (let i = 1; i < magnitudes.length - 1; i++) {
      if (!foundNull && magnitudes[i] < magnitudes[i - 1] && magnitudes[i] < magnitudes[i + 1]) {
        foundNull = true; // Found first null
      }
      if (foundNull && magnitudes[i] > magnitudes[i - 1] && magnitudes[i] > magnitudes[i + 1]) {
        sidelobeLevel = 20 * Math.log10(Math.max(0.0001, magnitudes[i]));
        break;
      }
    }
    
    // Calculate front-to-back ratio
    const frontResponse = magnitudes[Math.floor(magnitudes.length / 2)]; // 0 degrees
    const backIndex = angles.findIndex(a => Math.abs(a) > Math.PI * 0.9); // Near 180 degrees
    const backResponse = backIndex >= 0 ? magnitudes[backIndex] : 0.0001;
    
    const frontToBackRatio = 20 * Math.log10(frontResponse / backResponse);
    
    return {
      beamwidth,
      sidelobeLevel,
      frontToBackRatio: Math.max(0, frontToBackRatio)
    };
  }
}