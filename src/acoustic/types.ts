/**
 * Acoustic Analysis Type Definitions
 * Core interfaces and types for horn acoustic calculations
 */

import { ProfilePoint } from '../profiles/types';

// Physical constants
export const SPEED_OF_SOUND = 343; // m/s at 20°C
export const AIR_DENSITY = 1.2041; // kg/m³ at 20°C
export const REFERENCE_PRESSURE = 20e-6; // Pa (20 μPa)

/**
 * Parameters for dispersion analysis
 */
export interface DispersionParameters {
  horizontalAngle: number;    // degrees at -6dB
  verticalAngle: number;      // degrees at -6dB
  frequency: number;          // Hz
  mouthWidth: number;         // mm
  mouthHeight: number;        // mm
}

/**
 * Result from dispersion calculations
 */
export interface DispersionResult {
  requiredWidth: number;      // mm
  requiredHeight: number;     // mm
  horizontalBeamwidth: number; // degrees
  verticalBeamwidth: number;   // degrees
  directivityIndex: number;    // dB
}

/**
 * Polar pattern data for visualization
 */
export interface PolarData {
  angles: number[];           // angles in radians
  magnitudes: number[];       // magnitude at each angle (0-1)
  frequency: number;          // Hz
  axis: 'horizontal' | 'vertical';
}

/**
 * Frequency response data point
 */
export interface FrequencyPoint {
  frequency: number;          // Hz
  spl: number;               // dB SPL
  phase?: number;            // degrees
  impedance?: ComplexNumber;  // acoustic impedance
}

/**
 * Complete frequency response data
 */
export interface FrequencyResponseData {
  cutoffFrequency: number;    // Hz
  response: FrequencyPoint[];
  impedanceAtThroat?: ComplexNumber;
  efficiency?: number;        // percentage
}

/**
 * Complex number for impedance calculations
 */
export interface ComplexNumber {
  real: number;
  imaginary: number;
}

/**
 * Acoustic impedance data
 */
export interface AcousticImpedance {
  resistance: number;         // acoustic ohms
  reactance: number;          // acoustic ohms
  magnitude: number;          // |Z|
  phase: number;             // degrees
}

/**
 * Horn loading parameters
 */
export interface HornLoadingParams {
  throatArea: number;         // m²
  mouthArea: number;          // m²
  length: number;             // m
  profile: ProfilePoint[];
  frequency: number;          // Hz
}

/**
 * Directivity calculation result
 */
export interface DirectivityResult {
  directivityIndex: number;   // DI in dB
  directivityFactor: number;  // Q factor
  coverage: {
    horizontal: number;       // degrees
    vertical: number;         // degrees
  };
}

/**
 * Webster equation parameters
 */
export interface WebsterParams {
  profile: ProfilePoint[];
  frequency: number;          // Hz
  boundaryCondition: 'infinite' | 'finite' | 'flanged';
}

/**
 * Profile optimization parameters
 */
export interface ProfileOptimizationParams {
  targetDispersion: {
    horizontal: number;       // degrees
    vertical: number;         // degrees
  };
  frequencyRange: {
    min: number;             // Hz
    max: number;             // Hz
  };
  constraints: {
    minThroatDiameter: number; // mm
    maxMouthDiameter: number;  // mm
    maxLength: number;         // mm
  };
}

/**
 * Acoustic performance metrics
 */
export interface AcousticMetrics {
  efficiency: number;         // percentage
  sensitivity: number;        // dB/W/m
  maxSPL: number;            // dB SPL
  powerHandling: number;      // Watts
  distortion: {
    thd: number;             // Total Harmonic Distortion %
    imd: number;             // Intermodulation Distortion %
  };
}

/**
 * Room acoustics parameters (for future use)
 */
export interface RoomAcoustics {
  roomSize: {
    length: number;          // m
    width: number;           // m
    height: number;          // m
  };
  rt60: number;              // Reverberation time in seconds
  criticalDistance: number;  // m
}

/**
 * Driver parameters for coupling analysis
 */
export interface DriverParameters {
  throatDiameter: number;     // mm
  fs: number;                 // Resonant frequency Hz
  qts: number;                // Total Q factor
  vas: number;                // Equivalent volume liters
  sensitivity: number;        // dB/W/m
  powerHandling: number;      // Watts RMS
  impedance: number;          // Ohms nominal
}

/**
 * Complete acoustic analysis result
 */
export interface AcousticAnalysisResult {
  frequencyResponse: FrequencyResponseData;
  dispersion: {
    horizontal: PolarData;
    vertical: PolarData;
  };
  directivity: DirectivityResult;
  impedance: AcousticImpedance;
  metrics: AcousticMetrics;
}

/**
 * Visualization configuration
 */
export interface VisualizationConfig {
  showGrid: boolean;
  showLabels: boolean;
  colorScheme: 'viridis' | 'plasma' | 'cool' | 'warm';
  resolution: 'low' | 'medium' | 'high';
  animationSpeed: number;     // ms per frame
}

/**
 * Export formats for analysis data
 */
export enum ExportFormat {
  JSON = 'json',
  CSV = 'csv',
  MATLAB = 'mat',
  REW = 'rew',              // Room EQ Wizard format
  FRD = 'frd'               // Frequency response data format
}

/**
 * Validation result for acoustic calculations
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}