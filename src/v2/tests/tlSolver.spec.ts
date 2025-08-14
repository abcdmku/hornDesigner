/**
 * Tests for TL Solver acoustic calculations
 */

import { describe, it, expect } from 'vitest';
import { solveTL, calculateOnAxisSPL, exportFrequencyResponse } from '../math/tlSolver';
import { ProfilePoint } from '../profiles/types';
import { ComplexOps } from '../math/numericUtils';

describe('TL Solver', () => {
  // Simple test profile (conical horn)
  const testProfile: ProfilePoint[] = [
    { z: 0, r: 25 },
    { z: 50, r: 50 },
    { z: 100, r: 75 },
    { z: 150, r: 100 },
    { z: 200, r: 125 },
    { z: 250, r: 150 },
    { z: 300, r: 175 }
  ];
  
  it('should solve for single frequency', () => {
    const result = solveTL({
      profile: testProfile,
      frequencies: [1000]
    });
    
    expect(result).toHaveLength(1);
    expect(result[0].frequency).toBe(1000);
    expect(result[0].H_horn).toBeDefined();
    expect(result[0].Z_throat).toBeDefined();
    expect(result[0].SPL).toBeDefined();
    expect(result[0].phase).toBeDefined();
  });
  
  it('should solve for multiple frequencies', () => {
    const frequencies = [100, 500, 1000, 2000, 5000];
    const result = solveTL({
      profile: testProfile,
      frequencies
    });
    
    expect(result).toHaveLength(frequencies.length);
    
    for (let i = 0; i < frequencies.length; i++) {
      expect(result[i].frequency).toBe(frequencies[i]);
    }
  });
  
  it('should calculate reasonable SPL values', () => {
    const result = solveTL({
      profile: testProfile,
      frequencies: [1000]
    });
    
    const spl = result[0].SPL;
    
    // SPL should be finite and reasonable
    expect(isFinite(spl)).toBe(true);
    expect(spl).toBeGreaterThan(-60); // Not too much loss
    expect(spl).toBeLessThan(20); // Not unrealistic gain
  });
  
  it('should calculate phase response', () => {
    const result = solveTL({
      profile: testProfile,
      frequencies: [1000]
    });
    
    const phase = result[0].phase;
    
    // Phase should be between -π and π
    expect(phase).toBeGreaterThanOrEqual(-Math.PI);
    expect(phase).toBeLessThanOrEqual(Math.PI);
  });
  
  it('should handle custom medium properties', () => {
    const result = solveTL({
      profile: testProfile,
      frequencies: [1000],
      medium: {
        speedOfSound: 340,
        density: 1.2,
        temperature: 15
      }
    });
    
    expect(result).toHaveLength(1);
    expect(result[0].Z_throat).toBeDefined();
  });
  
  it('should calculate group delay for multiple frequencies', () => {
    const frequencies = [900, 1000, 1100];
    const result = solveTL({
      profile: testProfile,
      frequencies
    });
    
    // First frequency should not have group delay
    expect(result[0].groupDelay).toBeUndefined();
    
    // Subsequent frequencies should have group delay
    expect(result[1].groupDelay).toBeDefined();
    expect(result[2].groupDelay).toBeDefined();
  });
});

describe('Complex Operations', () => {
  it('should add complex numbers correctly', () => {
    const a = { real: 3, imag: 4 };
    const b = { real: 1, imag: 2 };
    const result = ComplexOps.add(a, b);
    
    expect(result.real).toBe(4);
    expect(result.imag).toBe(6);
  });
  
  it('should multiply complex numbers correctly', () => {
    const a = { real: 3, imag: 4 };
    const b = { real: 2, imag: 1 };
    const result = ComplexOps.multiply(a, b);
    
    // (3 + 4i) * (2 + i) = 6 + 3i + 8i + 4i² = 6 + 11i - 4 = 2 + 11i
    expect(result.real).toBe(2);
    expect(result.imag).toBe(11);
  });
  
  it('should calculate magnitude correctly', () => {
    const c = { real: 3, imag: 4 };
    const magnitude = ComplexOps.magnitude(c);
    
    expect(magnitude).toBe(5);
  });
  
  it('should calculate phase correctly', () => {
    const c = { real: 1, imag: 1 };
    const phase = ComplexOps.phase(c);
    
    expect(phase).toBeCloseTo(Math.PI / 4, 5);
  });
  
  it('should convert from polar correctly', () => {
    const magnitude = 5;
    const phase = Math.PI / 4;
    const c = ComplexOps.fromPolar(magnitude, phase);
    
    expect(c.real).toBeCloseTo(5 * Math.cos(Math.PI / 4), 5);
    expect(c.imag).toBeCloseTo(5 * Math.sin(Math.PI / 4), 5);
  });
});

describe('On-Axis SPL Calculation', () => {
  it('should calculate driver SPL', () => {
    const hornResponse = {
      frequency: 1000,
      H_horn: { real: 2, imag: 0 }, // 6dB gain
      Z_throat: { real: 100, imag: 0 },
      SPL: 6,
      phase: 0
    };
    
    const spl = calculateOnAxisSPL(
      hornResponse,
      90, // 90 dB/W @ 1m
      8,  // 8 ohm driver
      1   // 1 watt
    );
    
    // Should be driver sensitivity + horn gain
    expect(spl).toBeGreaterThan(90);
  });
  
  it('should handle different power levels', () => {
    const hornResponse = {
      frequency: 1000,
      H_horn: { real: 1, imag: 0 }, // Unity gain
      Z_throat: { real: 100, imag: 0 },
      SPL: 0,
      phase: 0
    };
    
    const spl1W = calculateOnAxisSPL(hornResponse, 90, 8, 1);
    const spl10W = calculateOnAxisSPL(hornResponse, 90, 8, 10);
    
    // 10W should be 10dB louder than 1W
    expect(spl10W - spl1W).toBeCloseTo(10, 1);
  });
});

describe('Export Functions', () => {
  it('should export frequency response to CSV', () => {
    const responses = [
      {
        frequency: 100,
        H_horn: { real: 0.9, imag: -0.1 },
        Z_throat: { real: 50, imag: 10 },
        SPL: -1,
        phase: -0.1,
        groupDelay: 0.5
      },
      {
        frequency: 1000,
        H_horn: { real: 1.1, imag: 0.05 },
        Z_throat: { real: 45, imag: -5 },
        SPL: 0.8,
        phase: 0.05,
        groupDelay: 0.3
      }
    ];
    
    const csv = exportFrequencyResponse(responses);
    
    expect(csv).toContain('Frequency(Hz)');
    expect(csv).toContain('100');
    expect(csv).toContain('1000');
    
    // Check CSV structure
    const lines = csv.split('\n');
    expect(lines[0]).toContain('Magnitude(dB)');
    expect(lines[0]).toContain('Phase(deg)');
    expect(lines[0]).toContain('GroupDelay(ms)');
  });
});

describe('Webster Equation Convergence', () => {
  it('should converge for exponential horn', () => {
    // Exponential horn has known analytical solution
    const exponentialProfile: ProfilePoint[] = [];
    const segments = 50;
    
    for (let i = 0; i <= segments; i++) {
      const z = (i / segments) * 300;
      const r = 25 * Math.exp(Math.log(6) * i / segments); // 6x expansion
      exponentialProfile.push({ z, r });
    }
    
    const result = solveTL({
      profile: exponentialProfile,
      frequencies: [500, 1000, 2000]
    });
    
    // Check all results are finite
    for (const response of result) {
      expect(isFinite(response.SPL)).toBe(true);
      expect(isFinite(response.phase)).toBe(true);
      expect(isFinite(ComplexOps.magnitude(response.H_horn))).toBe(true);
    }
  });
});