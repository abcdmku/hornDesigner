/**
 * Horn profile library - exports all profile functions and types
 */

export type { ProfileParams, ProfilePoint, ProfileFunction } from './types';
export { ProfileType } from './types';

// Import all profile functions
import { conical } from './conical';
import { exponential } from './exponential';
import { hypex } from './hypex';
import { tractrix } from './tractrix';
import { jmlc } from './jmlc';
import { oblateSpheroid } from './oblateSpheroid';
import { spherical } from './spherical';
import { parabolic } from './parabolic';
import { hyperbolicSpiral } from './hyperbolicSpiral';
import { wnAlo } from './wnAlo';
import { petf } from './petf';

// Export individual profile functions
export {
  conical,
  exponential,
  hypex,
  tractrix,
  jmlc,
  oblateSpheroid,
  spherical,
  parabolic,
  hyperbolicSpiral,
  wnAlo,
  petf
};

// Profile function map for dynamic selection
export const profileFunctions = {
  conical,
  exponential,
  hypex,
  tractrix,
  jmlc,
  oblateSpheroid,
  spherical,
  parabolic,
  hyperbolicSpiral,
  wnAlo,
  petf
};

// Helper to get profile function by type
export function getProfileFunction(type: string) {
  return profileFunctions[type as keyof typeof profileFunctions];
}