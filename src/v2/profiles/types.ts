/**
 * Horn profile types and interfaces for v2
 * Base units: mm for geometry, Hz for frequency
 */

export interface ProfilePoint {
  x: number;  // axial distance from throat (mm)
  r: number;  // radius at z (mm)
}

/** Base parameters common to all profiles */
export interface BaseProfileParams {
  throatRadius: number; // mm
  mouthRadius: number;  // mm
  length: number;       // mm
  segments: number;     // divisions

  // Optional generic helpers some profiles may use
  cutoffFrequency?: number;  // Hz
  m?: number;                // generic flare constant (optional)
  [key: string]: any;        // allow forwards-compatible extras without breaking calling code
}

export enum ProfileType {
  CONICAL = 'conical',
  EXPONENTIAL = 'exponential',
  HYPERBOLIC = 'hyperbolic',
  HYPEX = 'hypex',
  TRACTRIX = 'tractrix',
  JMLC = 'jmlc',
  OBLATE_SPHEROID = 'oblateSpheroid',
  SPHERICAL = 'spherical',
  PARABOLIC = 'parabolic',
  HYPERBOLIC_SPIRAL = 'hyperbolicSpiral',
  WN_ALO = 'wnAlo',
  PETF = 'petf',
}

/** ---- Per-profile extras (only what that profile needs) ---- */

export interface HypexParams {
  /** flare constant; if omitted we infer it from throat/mouth/length */
  m?: number;
  /** hypex T parameter (0…~1+). REQUIRED */
  T: number;
}

export interface TractrixParams {
  /** commonly used input; alternatively allow ‘a’ if you implemented that */
  cutoffFrequency?: number; // Hz
}

export interface JMLCParams {
  /** JMLC cutoff (Hz) */
  cutoffFrequency: number;
  /** mouth angle (deg) or construction angle; optional */
  alpha?: number;
}

export interface OSParams {
  /** throat half-angle in degrees */
  throatAngle?: number;
  /**
   * OS shape parameter. Many papers call this m or e.
   * We support `beta` to match your UI; treat it as the shape factor.
   */
  beta?: number;
}

export interface HyperSpiralParams {
  /** spiral shape control */
  beta?: number;
}

export interface WNALOParams {
  /** WN/ALO shape control(s) */
  beta?: number;
  eta?: number;
}

export interface PETFParams {
  /** optional flare constant override */
  m?: number;
  /** base T at throat (REQUIRED) */
  T0: number;
  /** additive T across length (default 0) */
  Tadd?: number;
  /** power for progression (default 2) */
  power?: number;
}

/** If you support a separate explicit hyperbolic flare */
export interface HyperbolicParams {
  m?: number;
  T?: number;
}

/** ---- Map ProfileType → extra params ---- */

export type ProfileExtrasMap = {
  [ProfileType.CONICAL]: {};
  [ProfileType.EXPONENTIAL]: { m?: number };
  [ProfileType.HYPERBOLIC]: HyperbolicParams;
  [ProfileType.HYPEX]: HypexParams;
  [ProfileType.TRACTRIX]: TractrixParams;
  [ProfileType.JMLC]: JMLCParams;
  [ProfileType.OBLATE_SPHEROID]: OSParams;
  [ProfileType.SPHERICAL]: {};
  [ProfileType.PARABOLIC]: {};
  [ProfileType.HYPERBOLIC_SPIRAL]: HyperSpiralParams;
  [ProfileType.WN_ALO]: WNALOParams;
  [ProfileType.PETF]: PETFParams;
};

export type ParamsFor<T extends ProfileType> = BaseProfileParams & ProfileExtrasMap[T];
export type AnyProfileParams = BaseProfileParams & (
  HypexParams | TractrixParams | JMLCParams | OSParams | HyperSpiralParams | WNALOParams | PETFParams | HyperbolicParams | { m?: number }
);

export type ProfileFunction<T extends ProfileType = ProfileType> = (params: ParamsFor<T>) => ProfilePoint[];
