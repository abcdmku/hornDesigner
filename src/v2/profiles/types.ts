/**
 * Horn profile types and interfaces for v2 (normalized to { x, r } in mm)
 */

export interface ProfilePoint {
  /** Axial distance from throat (mm) */
  x: number;
  /** Radius at this axial position (mm) */
  r: number;
}

export interface BaseProfileParams {
  throatRadius: number;
  mouthRadius: number;
  length: number;
  segments: number;
}

// --- Specific profiles ---
export interface HypexParams extends BaseProfileParams {
  T: number; // Hypex parameter (shape factor)
}

export interface TractrixParams extends BaseProfileParams {
  cutoffFrequency: number; // Hz
}

export interface JMLCParams extends BaseProfileParams {
  cutoffFrequency: number; // Hz
  alpha?: number; // rolloff factor (default ~1)
}

export interface OSParams extends BaseProfileParams {
  throatAngle: number; // radians or deg
}

export interface HyperSpiralParams extends BaseProfileParams {
  m: number; // spiral constant
}

export interface ALOParams extends BaseProfileParams {
  wn: number; // waveguide number
}

export interface PETFParams extends BaseProfileParams {
  flareConstant: number; // PETF-specific param
}

export type ProfileParams =
  | ({ type: ProfileType.CONICAL } & BaseProfileParams)
  | ({ type: ProfileType.EXPONENTIAL } & BaseProfileParams & { m?: number })
  | ({ type: ProfileType.HYPEX } & HypexParams)
  | ({ type: ProfileType.TRACTRIX } & TractrixParams)
  | ({ type: ProfileType.JMLC } & JMLCParams)
  | ({ type: ProfileType.OBLATE_SPHEROID } & OSParams)
  | ({ type: ProfileType.HYPERBOLIC_SPIRAL } & HyperSpiralParams)
  | ({ type: ProfileType.WN_ALO } & ALOParams)
  | ({ type: ProfileType.PETF } & PETFParams)
  | ({ type: ProfileType.SPHERICAL } & BaseProfileParams)
  | ({ type: ProfileType.PARABOLIC } & BaseProfileParams)

  

/**
 * Canonical profile type identifiers.
 * The string values MUST match the keys used in profileFunctions (index.ts).
 */
export enum ProfileType {
  CONICAL = 'conical',
  EXPONENTIAL = 'exponential',
  HYPERBOLIC = 'hyperbolic',
  HYPEX = 'hypexProfile',
  TRACTRIX = 'tractrixProfile',
  JMLC = 'jmlcProfile',
  OBLATE_SPHEROID = 'oblateSpheroidProfile',
  SPHERICAL = 'sphericalProfile',
  PARABOLIC = 'parabolicProfile',
  HYPERBOLIC_SPIRAL = 'hyperbolicSpiralProfile',
  WN_ALO = 'wnAloProfile',
  PETF = 'petfProfile'
}

/** All profile functions return a normalized array of { x, r } in mm */
export type ProfileFunction<P extends BaseProfileParams = BaseProfileParams> = (
  params: P
) => ProfilePoint[];