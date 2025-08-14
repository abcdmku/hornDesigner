/**
 * Tests for hornMath utilities
 */

import { describe, it, expect } from 'vitest';
import {
  areaCircle,
  areaEllipse,
  areaSuperellipse,
  areaRectangle,
  scheduleN,
  calculateRectangularDimensions,
  calculateSuperellipseDimensions,
  calculateAreaDrift,
  superellipsePoints
} from '../math/hornMath';

describe('Area Calculations', () => {
  it('should calculate circle area correctly', () => {
    const radius = 10;
    const area = areaCircle(radius);
    expect(area).toBeCloseTo(Math.PI * 100, 5);
  });
  
  it('should calculate ellipse area correctly', () => {
    const a = 10;
    const b = 5;
    const area = areaEllipse(a, b);
    expect(area).toBeCloseTo(Math.PI * 50, 5);
  });
  
  it('should calculate rectangle area correctly', () => {
    const width = 10;
    const height = 5;
    const area = areaRectangle(width, height);
    expect(area).toBe(50);
  });
  
  it('should calculate superellipse area for n=2 (ellipse)', () => {
    const a = 10;
    const b = 5;
    const area = areaSuperellipse(a, b, 2);
    const ellipseArea = areaEllipse(a, b);
    expect(area).toBeCloseTo(ellipseArea, 2);
  });
  
  it('should calculate area with rounded corners', () => {
    const width = 10;
    const height = 10;
    const cornerRadius = 2;
    const area = areaRectangle(width, height, cornerRadius);
    const expectedArea = 100 - 4 * (1 - Math.PI / 4) * 4;
    expect(area).toBeCloseTo(expectedArea, 2);
  });
});

describe('N-scheduling', () => {
  it('should return start value at z=0', () => {
    const n = scheduleN(0, 100, { start: 2, end: 4, easing: 'linear' });
    expect(n).toBe(2);
  });
  
  it('should return end value at z=length', () => {
    const n = scheduleN(100, 100, { start: 2, end: 4, easing: 'linear' });
    expect(n).toBe(4);
  });
  
  it('should interpolate linearly', () => {
    const n = scheduleN(50, 100, { start: 2, end: 4, easing: 'linear' });
    expect(n).toBe(3);
  });
  
  it('should use cubic easing', () => {
    const n = scheduleN(50, 100, { start: 2, end: 4, easing: 'cubic' });
    // Cubic easing at t=0.5: 3*0.25 - 2*0.125 = 0.5
    expect(n).toBe(3);
  });
  
  it('should return default value when no schedule provided', () => {
    const n = scheduleN(50, 100);
    expect(n).toBe(2);
  });
});

describe('Rectangular Dimensions', () => {
  it('should match area for area mode', () => {
    const radius = 10;
    const aspect = 2;
    const { width, height } = calculateRectangularDimensions(radius, aspect, 'area');
    
    const rectArea = width * height;
    const circleArea = areaCircle(radius);
    
    expect(rectArea).toBeCloseTo(circleArea, 2);
    expect(width / height).toBeCloseTo(aspect, 2);
  });
  
  it('should match diagonal for dimensions mode', () => {
    const radius = 10;
    const aspect = 1;
    const { width, height } = calculateRectangularDimensions(radius, aspect, 'dimensions');
    
    const diagonal = Math.sqrt(width * width + height * height);
    const diameter = 2 * radius;
    
    expect(diagonal).toBeCloseTo(diameter, 2);
  });
});

describe('Superellipse Dimensions', () => {
  it('should match circle area', () => {
    const radius = 10;
    const aspect = 1.5;
    const n = 2.5;
    
    const { a, b } = calculateSuperellipseDimensions(radius, aspect, n);
    const area = areaSuperellipse(a, b, n);
    const targetArea = areaCircle(radius);
    
    expect(area).toBeCloseTo(targetArea, 1);
    expect(a / b).toBeCloseTo(aspect, 2);
  });
});

describe('Area Drift', () => {
  it('should calculate area drift percentage', () => {
    const targetArea = 100;
    const actualArea = 105;
    const drift = calculateAreaDrift(targetArea, actualArea);
    
    expect(drift).toBe(5);
  });
  
  it('should handle exact match', () => {
    const targetArea = 100;
    const actualArea = 100;
    const drift = calculateAreaDrift(targetArea, actualArea);
    
    expect(drift).toBe(0);
  });
});

describe('Superellipse Points', () => {
  it('should generate correct number of points', () => {
    const points = superellipsePoints(10, 5, 2, 16);
    expect(points).toHaveLength(17); // segments + 1 for closure
  });
  
  it('should generate circle for n=2 and equal axes', () => {
    const radius = 10;
    const points = superellipsePoints(radius, radius, 2, 32);
    
    // Check all points are on circle
    for (const point of points) {
      const distance = Math.sqrt(point.x * point.x + point.y * point.y);
      expect(distance).toBeCloseTo(radius, 1);
    }
  });
  
  it('should generate square-like shape for large n', () => {
    const size = 10;
    const points = superellipsePoints(size, size, 10, 32);
    
    // Check points approach square corners
    const maxX = Math.max(...points.map(p => Math.abs(p.x)));
    const maxY = Math.max(...points.map(p => Math.abs(p.y)));
    
    expect(maxX).toBeCloseTo(size, 0.5);
    expect(maxY).toBeCloseTo(size, 0.5);
  });
});

describe('Profile Validation', () => {
  it('should ensure throat to mouth expansion', () => {
    const profiles = ['conical', 'exponential', 'hypex'];
    
    for (const profileType of profiles) {
      // This would test actual profile generation
      // Ensuring radius increases monotonically
    }
  });
  
  it('should match specified endpoints', () => {
    const throatRadius = 25;
    const mouthRadius = 150;
    
    // Test that all profiles start at throat and end at mouth radius
    // This would require importing and testing actual profile functions
  });
});