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
  [key: string]: any; // optional profile-specific params
}

export enum ProfileType {
  CONICAL = 'conical',
  EXPONENTIAL = 'exponential',
  HYPEX = 'hypex',
  TRACTRIX = 'tractrix',
  JMLC = 'jmlc',
  OBLATE_SPHEROID = 'oblateSpheroid',
  SPHERICAL = 'spherical',
  PARABOLIC = 'parabolic',
  HYPERBOLIC_SPIRAL = 'hyperbolicSpiral',
  WN_ALO = 'wnAlo',
  PETF = 'petf'
}

export type ProfileFunction = (params: ProfileParams) => ProfilePoint[];