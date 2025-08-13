/**
 * Validation script for horn profile library
 * Tests all profiles to ensure they generate valid points
 */

import { getProfile, getAvailableProfiles, getProfileDisplayName } from './index';

// Test parameters
const testParams = {
  throatRadius: 25,
  mouthRadius: 150,
  length: 300,
  segments: 50,
  cutoffFrequency: 500
};

console.log('🎺 Horn Profile Library Validation');
console.log('==================================\n');

// Test each profile
const profiles = getAvailableProfiles();
let allValid = true;

for (const type of profiles) {
  console.log(`Testing ${getProfileDisplayName(type)}...`);
  
  try {
    // Generate profile
    const profile = getProfile(type, testParams);
    
    // Basic validation
    if (profile.length !== testParams.segments + 1) {
      throw new Error(`Wrong point count: expected ${testParams.segments + 1}, got ${profile.length}`);
    }
    
    // Check throat radius (allow small tolerance for numerical precision)
    const throatError = Math.abs(profile[0].radius - testParams.throatRadius);
    if (throatError > 0.01) {
      throw new Error(`Wrong throat radius: expected ${testParams.throatRadius}, got ${profile[0].radius}`);
    }
    
    // Check mouth radius (allow small tolerance)
    const mouthError = Math.abs(profile[profile.length - 1].radius - testParams.mouthRadius);
    if (mouthError > 0.1) {
      throw new Error(`Wrong mouth radius: expected ${testParams.mouthRadius}, got ${profile[profile.length - 1].radius}`);
    }
    
    // Check for monotonic increase (radius should generally increase)
    let lastRadius = profile[0].radius;
    for (let i = 1; i < profile.length; i++) {
      if (profile[i].radius < lastRadius - 0.01) { // Allow small numerical errors
        console.warn(`  ⚠️  Non-monotonic increase at point ${i}: ${lastRadius} -> ${profile[i].radius}`);
      }
      lastRadius = profile[i].radius;
    }
    
    // Check for NaN or Infinity
    for (let i = 0; i < profile.length; i++) {
      if (!isFinite(profile[i].x) || !isFinite(profile[i].radius)) {
        throw new Error(`Invalid values at point ${i}: x=${profile[i].x}, radius=${profile[i].radius}`);
      }
    }
    
    // Check x positions
    const expectedEndX = testParams.length;
    const endXError = Math.abs(profile[profile.length - 1].x - expectedEndX);
    if (endXError > 0.01) {
      throw new Error(`Wrong end position: expected x=${expectedEndX}, got ${profile[profile.length - 1].x}`);
    }
    
    console.log(`  ✅ ${type}: ${profile.length} points generated successfully`);
    
    // Print some statistics
    const minRadius = Math.min(...profile.map(p => p.radius));
    const maxRadius = Math.max(...profile.map(p => p.radius));
    console.log(`     Min radius: ${minRadius.toFixed(2)}mm, Max radius: ${maxRadius.toFixed(2)}mm`);
    
  } catch (error) {
    allValid = false;
    console.error(`  ❌ ${type} failed: ${error instanceof Error ? error.message : error}`);
  }
  
  console.log('');
}

// Performance test
console.log('Performance Test');
console.log('----------------');

const perfTestParams = {
  throatRadius: 25,
  mouthRadius: 150,
  length: 300,
  segments: 100
};

for (const type of profiles) {
  const startTime = performance.now();
  getProfile(type, perfTestParams); // Generate profile to test performance
  const endTime = performance.now();
  const duration = endTime - startTime;
  
  if (duration > 10) {
    console.warn(`⚠️  ${getProfileDisplayName(type)}: ${duration.toFixed(2)}ms (exceeds 10ms target)`);
  } else {
    console.log(`✅ ${getProfileDisplayName(type)}: ${duration.toFixed(2)}ms`);
  }
}

// Final result
console.log('\n==================================');
if (allValid) {
  console.log('✅ All profiles validated successfully!');
} else {
  console.error('❌ Some profiles failed validation');
  throw new Error('Validation failed');
}

// Export validation function for testing
export function validateProfiles(): boolean {
  return allValid;
}