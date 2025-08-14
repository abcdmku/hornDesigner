/**
 * Tests for directivity pattern calculations
 */

import { describe, it, expect } from 'vitest';
import {
  rayleighCircular,
  rayleighElliptical,
  rayleighRectangular,
  rayleighSuperellipse,
  calculatePolarPattern,
  calculateBeamwidth,
  exportPolarPattern
} from '../math/protoDirectivity';

describe('Circular Aperture Directivity', () => {
  it('should have unity response on-axis', () => {
    const radius = 50; // mm
    const frequency = 1000; // Hz
    const result = rayleighCircular(radius, frequency, [0]);
    
    expect(result[0].angle).toBe(0);
    expect(result[0].magnitude).toBe(1);
    expect(result[0].dB).toBe(0);
  });
  
  it('should decrease off-axis', () => {
    const radius = 50;
    const frequency = 1000;
    const angles = [0, 15, 30, 45, 60, 90];
    const result = rayleighCircular(radius, frequency, angles);
    
    // Response should decrease with angle
    for (let i = 1; i < result.length; i++) {
      expect(result[i].magnitude).toBeLessThanOrEqual(result[i - 1].magnitude);
      expect(result[i].dB).toBeLessThanOrEqual(result[i - 1].dB);
    }
  });
  
  it('should have narrower beam at higher frequencies', () => {
    const radius = 50;
    const angles = Array.from({ length: 91 }, (_, i) => i); // 0 to 90 degrees
    
    const lowFreq = rayleighCircular(radius, 500, angles);
    const highFreq = rayleighCircular(radius, 2000, angles);
    
    // Find -3dB points
    let low3dB = 90;
    let high3dB = 90;
    
    for (let i = 0; i < angles.length; i++) {
      if (lowFreq[i].dB < -3 && low3dB === 90) {
        low3dB = angles[i];
      }
      if (highFreq[i].dB < -3 && high3dB === 90) {
        high3dB = angles[i];
      }
    }
    
    // Higher frequency should have narrower beam
    expect(high3dB).toBeLessThan(low3dB);
  });
  
  it('should be symmetric', () => {
    const radius = 50;
    const frequency = 1000;
    const angles = [-45, -30, -15, 0, 15, 30, 45];
    const result = rayleighCircular(radius, frequency, angles);
    
    // Check symmetry around 0
    const centerIndex = 3; // Index of angle 0
    for (let i = 1; i <= 3; i++) {
      expect(result[centerIndex - i].magnitude).toBeCloseTo(
        result[centerIndex + i].magnitude,
        5
      );
    }
  });
});

describe('Elliptical Aperture Directivity', () => {
  it('should have unity response on-axis', () => {
    const width = 100;
    const height = 50;
    const frequency = 1000;
    
    const azimuth = rayleighElliptical(width, height, frequency, [0], 'azimuth');
    const elevation = rayleighElliptical(width, height, frequency, [0], 'elevation');
    
    expect(azimuth[0].magnitude).toBeCloseTo(1, 2);
    expect(elevation[0].magnitude).toBeCloseTo(1, 2);
  });
  
  it('should have different patterns in H and V planes', () => {
    const width = 100; // Wide
    const height = 50; // Narrow
    const frequency = 1000;
    const angles = [0, 15, 30, 45];
    
    const azimuth = rayleighElliptical(width, height, frequency, angles, 'azimuth');
    const elevation = rayleighElliptical(width, height, frequency, angles, 'elevation');
    
    // At 30 degrees, vertical (narrow) should have more attenuation
    expect(elevation[2].dB).toBeLessThan(azimuth[2].dB);
  });
});

describe('Rectangular Aperture Directivity', () => {
  it('should follow sinc pattern', () => {
    const width = 100;
    const height = 100;
    const frequency = 1000;
    const result = rayleighRectangular(width, height, frequency, [0], 'azimuth');
    
    expect(result[0].magnitude).toBe(1);
    expect(result[0].dB).toBe(0);
  });
  
  it('should have nulls at specific angles', () => {
    const width = 100; // mm
    const frequency = 3430; // Hz (λ = 100mm at 343 m/s)
    
    // First null should be at sin(θ) = λ/width = 1
    // So θ = 90 degrees
    const angles = [0, 30, 60, 85, 90];
    const result = rayleighRectangular(width, width, frequency, angles, 'azimuth');
    
    // Response should drop significantly near 90 degrees
    expect(result[4].magnitude).toBeLessThan(0.1);
  });
  
  it('should show different beamwidths for different dimensions', () => {
    const frequency = 1000;
    const angles = Array.from({ length: 91 }, (_, i) => i);
    
    const square = rayleighRectangular(100, 100, frequency, angles, 'azimuth');
    const wide = rayleighRectangular(150, 100, frequency, angles, 'azimuth');
    
    // Find -3dB points
    let square3dB = 90;
    let wide3dB = 90;
    
    for (let i = 0; i < angles.length; i++) {
      if (square[i].dB < -3 && square3dB === 90) {
        square3dB = angles[i];
      }
      if (wide[i].dB < -3 && wide3dB === 90) {
        wide3dB = angles[i];
      }
    }
    
    // Wider aperture should have narrower beam
    expect(wide3dB).toBeLessThan(square3dB);
  });
});

describe('Superellipse Aperture Directivity', () => {
  it('should approximate circle for n=2 and equal axes', () => {
    const size = 50;
    const frequency = 1000;
    const angles = [0, 15, 30, 45];
    
    const superellipse = rayleighSuperellipse(
      size * 2, size * 2, 2, frequency, angles, 'azimuth'
    );
    const circle = rayleighCircular(size, frequency, angles);
    
    // Should be very similar
    for (let i = 0; i < angles.length; i++) {
      expect(superellipse[i].magnitude).toBeCloseTo(circle[i].magnitude, 1);
    }
  });
  
  it('should change pattern with n parameter', () => {
    const width = 100;
    const height = 100;
    const frequency = 1000;
    const angles = [0, 30, 60];
    
    const n2 = rayleighSuperellipse(width, height, 2, frequency, angles, 'azimuth');
    const n4 = rayleighSuperellipse(width, height, 4, frequency, angles, 'azimuth');
    
    // Different n values should produce different patterns
    expect(n2[1].magnitude).not.toBeCloseTo(n4[1].magnitude, 2);
  });
});

describe('Polar Pattern Calculation', () => {
  it('should generate complete polar pattern', () => {
    const aperture = {
      mode: 'circle' as const,
      width: 100,
      height: 100
    };
    
    const pattern = calculatePolarPattern(aperture, 1000, 5);
    
    expect(pattern.frequency).toBe(1000);
    expect(pattern.azimuth.length).toBe(37); // -90 to 90 in 5 degree steps
    expect(pattern.elevation.length).toBe(37);
    
    // Check on-axis response
    const onAxisIndex = 18; // 0 degrees
    expect(pattern.azimuth[onAxisIndex].angle).toBe(0);
    expect(pattern.azimuth[onAxisIndex].magnitude).toBeCloseTo(1, 2);
  });
  
  it('should handle different aperture modes', () => {
    const modes = ['circle', 'ellipse', 'rectangular', 'superellipse'] as const;
    
    for (const mode of modes) {
      const aperture = {
        mode,
        width: 100,
        height: 80,
        n: mode === 'superellipse' ? 3 : undefined
      };
      
      const pattern = calculatePolarPattern(aperture, 1000);
      
      expect(pattern).toBeDefined();
      expect(pattern.azimuth.length).toBeGreaterThan(0);
      expect(pattern.elevation.length).toBeGreaterThan(0);
    }
  });
});

describe('Beamwidth Calculation', () => {
  it('should calculate -3dB and -6dB beamwidths', () => {
    const pattern = [
      { angle: -90, magnitude: 0.01, dB: -40 },
      { angle: -60, magnitude: 0.1, dB: -20 },
      { angle: -30, magnitude: 0.5, dB: -6 },
      { angle: -15, magnitude: 0.707, dB: -3 },
      { angle: 0, magnitude: 1, dB: 0 },
      { angle: 15, magnitude: 0.707, dB: -3 },
      { angle: 30, magnitude: 0.5, dB: -6 },
      { angle: 60, magnitude: 0.1, dB: -20 },
      { angle: 90, magnitude: 0.01, dB: -40 }
    ];
    
    const beamwidth = calculateBeamwidth(pattern);
    
    expect(beamwidth.minus3dB).toBe(30); // ±15 degrees
    expect(beamwidth.minus6dB).toBe(60); // ±30 degrees
  });
  
  it('should handle patterns without clear beamwidth', () => {
    const pattern = [
      { angle: 0, magnitude: 1, dB: 0 },
      { angle: 90, magnitude: 0.9, dB: -0.9 }
    ];
    
    const beamwidth = calculateBeamwidth(pattern);
    
    // Should return 0 if no -3dB point found
    expect(beamwidth.minus3dB).toBe(0);
    expect(beamwidth.minus6dB).toBe(0);
  });
});

describe('Export Functions', () => {
  it('should export polar pattern to CSV', () => {
    const pattern = {
      frequency: 1000,
      azimuth: [
        { angle: -30, magnitude: 0.5, dB: -6 },
        { angle: 0, magnitude: 1, dB: 0 },
        { angle: 30, magnitude: 0.5, dB: -6 }
      ],
      elevation: [
        { angle: -30, magnitude: 0.4, dB: -8 },
        { angle: 0, magnitude: 1, dB: 0 },
        { angle: 30, magnitude: 0.4, dB: -8 }
      ]
    };
    
    const csv = exportPolarPattern(pattern);
    
    expect(csv).toContain('1000 Hz');
    expect(csv).toContain('Angle(deg)');
    expect(csv).toContain('Azimuth(dB)');
    expect(csv).toContain('Elevation(dB)');
    
    const lines = csv.split('\n');
    expect(lines.length).toBeGreaterThan(4); // Header + data
  });
});

describe('Analytical Validation', () => {
  it('should match theoretical piston radiator', () => {
    // For ka << 1, directivity should be nearly omnidirectional
    const smallRadius = 5; // mm
    const lowFreq = 100; // Hz
    const angles = [0, 30, 60, 90];
    
    const result = rayleighCircular(smallRadius, lowFreq, angles);
    
    // Should be relatively flat (within 3dB)
    const maxDB = Math.max(...result.map(r => r.dB));
    const minDB = Math.min(...result.map(r => r.dB));
    
    expect(maxDB - minDB).toBeLessThan(3);
  });
  
  it('should show increasing directivity with frequency', () => {
    const radius = 50;
    const frequencies = [100, 500, 1000, 2000, 5000];
    const beamwidths: number[] = [];
    
    for (const freq of frequencies) {
      const angles = Array.from({ length: 91 }, (_, i) => i);
      const pattern = rayleighCircular(radius, freq, angles);
      const beamwidth = calculateBeamwidth(pattern);
      beamwidths.push(beamwidth.minus3dB);
    }
    
    // Beamwidth should decrease with frequency
    for (let i = 1; i < beamwidths.length; i++) {
      expect(beamwidths[i]).toBeLessThanOrEqual(beamwidths[i - 1]);
    }
  });
});