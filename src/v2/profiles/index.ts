/**
 * Horn profile library - exports all profile functions and types
 */

export type { ProfileParams, ProfilePoint, ProfileFunction } from './types';
export { ProfileType } from './types';

// Import all profile functions
import { conical } from './conical';
import { exponential } from './exponential';
import { hyperbolic } from './hyperbolic';
import { hypexProfile } from './hypex';
import { tractrixProfile } from './tractrix';
import { jmlcProfile } from './jmlc';
import { oblateSpheroidProfile } from './oblateSpheroid';
import { sphericalProfile } from './spherical';
import { parabolicProfile } from './parabolic';
import { hyperbolicSpiralProfile } from './hyperbolicSpiral';
import { wnAloProfile } from './wnAlo';
import { petfProfile } from './petf';
import { ProfileType, ProfileFunction } from './types';

// Export individual profile functions
export {
  conical,
  exponential,
  hyperbolic,
  hypexProfile,
  tractrixProfile,
  jmlcProfile,
  oblateSpheroidProfile,
  sphericalProfile,
  parabolicProfile,
  hyperbolicSpiralProfile,
  wnAloProfile,
  petfProfile
};

// Profile function map for dynamic selection
export const profileFunctions = {
  conical,
  exponential,
  hyperbolic,
  hypexProfile,
  tractrixProfile,
  jmlcProfile,
  oblateSpheroidProfile,
  sphericalProfile,
  parabolicProfile,
  hyperbolicSpiralProfile,
  wnAloProfile,
  petfProfile
};

export const profileRegistry: Record<ProfileType, ProfileFunction<any>> = {
  [ProfileType.CONICAL]: conical,
  [ProfileType.EXPONENTIAL]: exponential,
  [ProfileType.HYPERBOLIC]: hyperbolic,
  [ProfileType.HYPEX]: hypexProfile,
  [ProfileType.TRACTRIX]: tractrixProfile,
  [ProfileType.JMLC]: jmlcProfile,
  [ProfileType.OBLATE_SPHEROID]: oblateSpheroidProfile,
  [ProfileType.HYPERBOLIC_SPIRAL]: hyperbolicSpiralProfile,
  [ProfileType.WN_ALO]: wnAloProfile,
  [ProfileType.PETF]: petfProfile,
  [ProfileType.SPHERICAL]: sphericalProfile,
  [ProfileType.PARABOLIC]: parabolicProfile,
};
// Helper to get profile function by type
export function getProfileFunction(type: string) {
  return profileRegistry[type as keyof typeof profileRegistry];
}