/**
 * Horn Profile Library
 * Barrel exports and factory function for all horn profiles
 */

// Export types
export * from './types';

// Import all profile functions
import { conicalProfile } from './conical';
import { exponentialProfile, modifiedExponentialProfile } from './exponential';
import { parabolicProfile } from './parabolic';
import { tractrixProfile } from './tractrix';
import { hyperbolicExponentialProfile } from './hyperbolicExponential';
import { leCleachProfile } from './leCleach';
import { jmlcProfile } from './jmlc';
import { oblateSpheroidProfile } from './oblateSpheroid';
import { sphericalWaveProfile } from './sphericalWave';

// Export all profile functions
export { conicalProfile } from './conical';
export { exponentialProfile, modifiedExponentialProfile } from './exponential';
export { parabolicProfile } from './parabolic';
export { tractrixProfile } from './tractrix';
export { hyperbolicExponentialProfile } from './hyperbolicExponential';
export { leCleachProfile } from './leCleach';
export { jmlcProfile } from './jmlc';
export { oblateSpheroidProfile } from './oblateSpheroid';
export { sphericalWaveProfile } from './sphericalWave';

// Import types for factory function
import { ProfileType, ProfileParameters, ProfilePoint } from './types';

/**
 * Factory function to get profile function by type
 * @param type Profile type enum value
 * @param params Profile parameters
 * @returns Array of profile points
 */
export function getProfile(type: ProfileType, params: ProfileParameters): ProfilePoint[] {
  switch (type) {
    case ProfileType.CONICAL:
      return conicalProfile(params);
      
    case ProfileType.EXPONENTIAL:
      return exponentialProfile(params);
      
    case ProfileType.MODIFIED_EXPONENTIAL:
      return modifiedExponentialProfile(params);
      
    case ProfileType.PARABOLIC:
      return parabolicProfile(params);
      
    case ProfileType.TRACTRIX:
      return tractrixProfile(params);
      
    case ProfileType.HYPERBOLIC_EXPONENTIAL:
      return hyperbolicExponentialProfile(params);
      
    case ProfileType.LE_CLEACH:
      return leCleachProfile(params);
      
    case ProfileType.JMLC:
      return jmlcProfile(params);
      
    case ProfileType.OBLATE_SPHEROID:
      return oblateSpheroidProfile(params);
      
    case ProfileType.SPHERICAL_WAVE:
      return sphericalWaveProfile(params);
      
    default:
      // Fallback to exponential if unknown type
      console.warn(`Unknown profile type: ${type}, falling back to exponential`);
      return exponentialProfile(params);
  }
}

/**
 * Get a list of all available profile types
 * @returns Array of profile type values
 */
export function getAvailableProfiles(): ProfileType[] {
  return Object.values(ProfileType);
}

/**
 * Get human-readable name for profile type
 * @param type Profile type
 * @returns Human-readable name
 */
export function getProfileDisplayName(type: ProfileType): string {
  const displayNames: Record<ProfileType, string> = {
    [ProfileType.CONICAL]: 'Conical (Linear)',
    [ProfileType.EXPONENTIAL]: 'Exponential',
    [ProfileType.MODIFIED_EXPONENTIAL]: 'Modified Exponential',
    [ProfileType.PARABOLIC]: 'Parabolic',
    [ProfileType.TRACTRIX]: 'Tractrix (Constant Directivity)',
    [ProfileType.HYPERBOLIC_EXPONENTIAL]: 'Hyperbolic-Exponential',
    [ProfileType.LE_CLEACH]: 'Le Cléac\'h (Spherical Wave)',
    [ProfileType.JMLC]: 'JMLC (Modified Le Cléac\'h)',
    [ProfileType.OBLATE_SPHEROID]: 'Oblate Spheroid',
    [ProfileType.SPHERICAL_WAVE]: 'Spherical Wave',
  };
  
  return displayNames[type] || type;
}