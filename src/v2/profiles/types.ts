/**
 * Horn profile types and interfaces for v2
 */

export interface ProfilePoint {
  z: number;  // Distance from throat (mm)
  r: number;  // Radius at this point (mm)
}

export interface ProfileParams {
  throatRadius: number;
  mouthRadius: number;
  length: number;
  segments: number;
  
  // Cutoff/rollover parameters
  cutoffFrequency?: number;  // Hz - for frequency-dependent profiles
  cutoffWavenumber?: number; // For tractrix
  rolloverPoint?: number;    // Position (0-1) where rollover starts
  rolloverStrength?: number; // Strength of rollover effect (0-1)
  
  [key: string]: any; // optional profile-specific params
}

export enum ProfileType {
  CONICAL = 'conical',
  EXPONENTIAL = 'exponential',
  HYPERBOLIC = 'hyperbolic',
  HYPEX = 'hypex',
  TRACTRIX = 'tractrix',
  LE_CLEACH = 'leCleach',
  JMLC = 'jmlc',
  OBLATE_SPHEROID = 'oblateSpheroid',
  SPHERICAL = 'spherical',
  PARABOLIC = 'parabolic',
  HYPERBOLIC_SPIRAL = 'hyperbolicSpiral',
  WN_ALO = 'wnAlo',
  PETF = 'petf'
}

export type ProfileFunction = (params: ProfileParams) => ProfilePoint[];