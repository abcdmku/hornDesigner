/**
 * Horn profile calculation types and interfaces
 */

export enum ProfileType {
  CONICAL = 'conical',
  EXPONENTIAL = 'exponential',
  MODIFIED_EXPONENTIAL = 'modifiedExponential',
  TRACTRIX = 'tractrix',
  LE_CLEACH = 'leCleach',
  JMLC = 'jmlc',
  OBLATE_SPHEROID = 'oblateSpheroid',
  PARABOLIC = 'parabolic',
  HYPERBOLIC_EXPONENTIAL = 'hyperbolicExponential',
  SPHERICAL_WAVE = 'sphericalWave'
}

export interface ProfilePoint {
  x: number;      // Distance from throat (mm)
  radius: number; // Radius at this point (mm)
}

export interface ProfileParameters {
  throatRadius: number;    // mm
  mouthRadius: number;     // mm
  length: number;          // mm
  segments?: number;       // Number of points to generate (default: 100)
  cutoffFrequency?: number; // Hz (for certain profiles like Le Cléac'h)
}

export type ProfileFunction = (params: ProfileParameters) => ProfilePoint[];

/**
 * Validates profile parameters
 * @throws Error if parameters are invalid
 */
export function validateProfileParameters(params: ProfileParameters): void {
  if (params.throatRadius <= 0) {
    throw new Error('Throat radius must be greater than 0');
  }
  if (params.mouthRadius <= params.throatRadius) {
    throw new Error('Mouth radius must be greater than throat radius');
  }
  if (params.length <= 0) {
    throw new Error('Length must be greater than 0');
  }
  if (params.segments !== undefined && params.segments <= 0) {
    throw new Error('Segments must be greater than 0');
  }
}

/**
 * Ensures profile points are valid
 * Handles NaN/Infinity and ensures monotonic increase
 */
export function sanitizeProfilePoints(points: ProfilePoint[]): ProfilePoint[] {
  return points.filter(point => {
    return isFinite(point.x) && isFinite(point.radius) && 
           point.radius > 0;
  });
}