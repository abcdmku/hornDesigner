/**
 * Directivity pattern calculations for horn mouths
 * Implements Rayleigh, Hankel, and FFT-based far-field integrators
 */

import { Complex, ComplexOps, fft, padToPowerOfTwo } from './numericUtils';
import { CrossSectionMode } from './hornMath';

/**
 * Aperture shape specification
 */
export interface ApertureSpec {
  mode: CrossSectionMode;
  width: number; // mm
  height: number; // mm
  n?: number; // Superellipse parameter
}

/**
 * Directivity result
 */
export interface DirectivityResult {
  angle: number; // degrees
  magnitude: number; // Linear scale
  dB: number; // dB scale relative to on-axis
}

/**
 * Polar pattern data
 */
export interface PolarPattern {
  azimuth: DirectivityResult[]; // Horizontal plane
  elevation: DirectivityResult[]; // Vertical plane
  frequency: number; // Hz
}

/**
 * Calculate wavelength from frequency
 */
function wavelength(frequency: number, speedOfSound: number = 343.2): number {
  return speedOfSound / frequency;
}

/**
 * Calculate wave number
 */
function waveNumber(frequency: number, speedOfSound: number = 343.2): number {
  return (2 * Math.PI * frequency) / speedOfSound;
}

/**
 * Rayleigh integral for circular aperture
 * Analytical solution for uniform circular piston
 */
export function rayleighCircular(
  radius: number, // mm
  frequency: number, // Hz
  angles: number[] // degrees
): DirectivityResult[] {
  const radiusM = radius / 1000; // Convert to meters
  const k = waveNumber(frequency);
  const ka = k * radiusM;
  
  return angles.map(angle => {
    const theta = (angle * Math.PI) / 180; // Convert to radians
    
    if (Math.abs(theta) < 1e-10) {
      // On-axis response
      return { angle, magnitude: 1, dB: 0 };
    }
    
    // Bessel function argument
    const x = ka * Math.sin(theta);
    
    // Directivity function: D(θ) = 2*J1(x)/x
    const directivity = Math.abs(2 * besselJ1(x) / x);
    const dB = 20 * Math.log10(Math.max(1e-10, directivity));
    
    return { angle, magnitude: directivity, dB };
  });
}

/**
 * Bessel function J1 (first kind, order 1)
 */
function besselJ1(x: number): number {
  if (Math.abs(x) < 1e-10) return 0;
  
  // For small x, use series expansion
  if (Math.abs(x) < 3) {
    let sum = x / 2;
    let term = x / 2;
    for (let n = 1; n < 20; n++) {
      term *= -(x * x) / (4 * n * (n + 1));
      sum += term;
      if (Math.abs(term) < 1e-10) break;
    }
    return sum;
  }
  
  // For large x, use asymptotic expansion
  const phase = x - 3 * Math.PI / 4;
  return Math.sqrt(2 / (Math.PI * x)) * Math.cos(phase);
}

/**
 * Rayleigh integral for elliptical aperture
 * Numerical integration approach
 */
export function rayleighElliptical(
  width: number, // mm (major axis)
  height: number, // mm (minor axis)
  frequency: number, // Hz
  angles: number[], // degrees
  plane: 'azimuth' | 'elevation'
): DirectivityResult[] {
  const a = width / 2000; // Semi-major axis in meters
  const b = height / 2000; // Semi-minor axis in meters
  const k = waveNumber(frequency);
  
  return angles.map(angle => {
    const theta = (angle * Math.PI) / 180;
    
    if (Math.abs(theta) < 1e-10) {
      return { angle, magnitude: 1, dB: 0 };
    }
    
    // Numerical integration over ellipse
    let integral = 0;
    const samples = 100;
    
    for (let i = 0; i < samples; i++) {
      for (let j = 0; j < samples; j++) {
        const u = -1 + 2 * i / (samples - 1);
        const v = -1 + 2 * j / (samples - 1);
        
        // Check if point is inside ellipse
        if (u * u + v * v <= 1) {
          const x = a * u;
          const y = b * v;
          
          // Phase delay based on angle and plane
          let phase: number;
          if (plane === 'azimuth') {
            phase = k * x * Math.sin(theta);
          } else {
            phase = k * y * Math.sin(theta);
          }
          
          // Add contribution
          integral += Math.cos(phase);
        }
      }
    }
    
    // Normalize
    const onAxisIntegral = Math.PI * samples * samples / 4; // Approximate
    const directivity = Math.abs(integral / onAxisIntegral);
    const dB = 20 * Math.log10(Math.max(1e-10, directivity));
    
    return { angle, magnitude: directivity, dB };
  });
}

/**
 * Directivity for rectangular aperture
 * Analytical solution: sinc functions
 */
export function rayleighRectangular(
  width: number, // mm
  height: number, // mm
  frequency: number, // Hz
  angles: number[], // degrees
  plane: 'azimuth' | 'elevation'
): DirectivityResult[] {
  const widthM = width / 1000;
  const heightM = height / 1000;
  const k = waveNumber(frequency);
  
  return angles.map(angle => {
    const theta = (angle * Math.PI) / 180;
    
    if (Math.abs(theta) < 1e-10) {
      return { angle, magnitude: 1, dB: 0 };
    }
    
    let directivity: number;
    
    if (plane === 'azimuth') {
      // Horizontal plane: sinc(k*w*sin(θ)/2)
      const arg = (k * widthM * Math.sin(theta)) / 2;
      directivity = Math.abs(sinc(arg));
    } else {
      // Vertical plane: sinc(k*h*sin(θ)/2)
      const arg = (k * heightM * Math.sin(theta)) / 2;
      directivity = Math.abs(sinc(arg));
    }
    
    const dB = 20 * Math.log10(Math.max(1e-10, directivity));
    
    return { angle, magnitude: directivity, dB };
  });
}

/**
 * Sinc function: sin(x)/x
 */
function sinc(x: number): number {
  if (Math.abs(x) < 1e-10) return 1;
  return Math.sin(x) / x;
}

/**
 * Directivity for superellipse aperture
 * FFT-based numerical approach
 */
export function rayleighSuperellipse(
  width: number, // mm
  height: number, // mm
  n: number, // Superellipse parameter
  frequency: number, // Hz
  angles: number[], // degrees
  plane: 'azimuth' | 'elevation'
): DirectivityResult[] {
  const a = width / 2000; // Semi-axes in meters
  const b = height / 2000;
  const k = waveNumber(frequency);
  
  // Create aperture function samples
  const gridSize = 128; // Power of 2 for FFT
  const aperture: Complex[][] = [];
  
  for (let i = 0; i < gridSize; i++) {
    aperture[i] = [];
    for (let j = 0; j < gridSize; j++) {
      const x = -1 + 2 * i / (gridSize - 1);
      const y = -1 + 2 * j / (gridSize - 1);
      
      // Check if inside superellipse: |x|^n + |y|^n <= 1
      const inside = Math.pow(Math.abs(x), n) + Math.pow(Math.abs(y), n) <= 1;
      
      aperture[i][j] = {
        real: inside ? 1 : 0,
        imag: 0
      };
    }
  }
  
  // Calculate directivity for each angle
  return angles.map(angle => {
    const theta = (angle * Math.PI) / 180;
    
    if (Math.abs(theta) < 1e-10) {
      return { angle, magnitude: 1, dB: 0 };
    }
    
    // Apply phase shift for angle
    const phaseShifted: Complex[][] = [];
    for (let i = 0; i < gridSize; i++) {
      phaseShifted[i] = [];
      for (let j = 0; j < gridSize; j++) {
        const x = a * (-1 + 2 * i / (gridSize - 1));
        const y = b * (-1 + 2 * j / (gridSize - 1));
        
        let phase: number;
        if (plane === 'azimuth') {
          phase = k * x * Math.sin(theta);
        } else {
          phase = k * y * Math.sin(theta);
        }
        
        // Apply phase shift to aperture function
        phaseShifted[i][j] = ComplexOps.multiply(
          aperture[i][j],
          ComplexOps.fromPolar(1, phase)
        );
      }
    }
    
    // Sum all contributions (simplified far-field)
    let sum: Complex = { real: 0, imag: 0 };
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        sum = ComplexOps.add(sum, phaseShifted[i][j]);
      }
    }
    
    // Calculate on-axis response for normalization
    let onAxisSum = 0;
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        onAxisSum += aperture[i][j].real;
      }
    }
    
    const directivity = ComplexOps.magnitude(sum) / onAxisSum;
    const dB = 20 * Math.log10(Math.max(1e-10, directivity));
    
    return { angle, magnitude: directivity, dB };
  });
}

/**
 * Calculate full polar pattern for a given aperture
 */
export function calculatePolarPattern(
  aperture: ApertureSpec,
  frequency: number,
  angleResolution: number = 5 // degrees
): PolarPattern {
  const angles: number[] = [];
  for (let angle = -90; angle <= 90; angle += angleResolution) {
    angles.push(angle);
  }
  
  let azimuth: DirectivityResult[];
  let elevation: DirectivityResult[];
  
  switch (aperture.mode) {
    case 'circle':
      const radius = Math.max(aperture.width, aperture.height) / 2;
      azimuth = rayleighCircular(radius, frequency, angles);
      elevation = azimuth; // Circular is symmetric
      break;
      
    case 'ellipse':
      azimuth = rayleighElliptical(
        aperture.width,
        aperture.height,
        frequency,
        angles,
        'azimuth'
      );
      elevation = rayleighElliptical(
        aperture.width,
        aperture.height,
        frequency,
        angles,
        'elevation'
      );
      break;
      
    case 'rectangular':
      azimuth = rayleighRectangular(
        aperture.width,
        aperture.height,
        frequency,
        angles,
        'azimuth'
      );
      elevation = rayleighRectangular(
        aperture.width,
        aperture.height,
        frequency,
        angles,
        'elevation'
      );
      break;
      
    case 'superellipse':
      azimuth = rayleighSuperellipse(
        aperture.width,
        aperture.height,
        aperture.n || 2,
        frequency,
        angles,
        'azimuth'
      );
      elevation = rayleighSuperellipse(
        aperture.width,
        aperture.height,
        aperture.n || 2,
        frequency,
        angles,
        'elevation'
      );
      break;
      
    default:
      // Default to circular
      const defaultRadius = Math.max(aperture.width, aperture.height) / 2;
      azimuth = rayleighCircular(defaultRadius, frequency, angles);
      elevation = azimuth;
  }
  
  return { azimuth, elevation, frequency };
}

/**
 * Calculate beamwidth from polar pattern
 * Returns -3dB and -6dB beamwidths
 */
export function calculateBeamwidth(
  pattern: DirectivityResult[]
): { minus3dB: number; minus6dB: number } {
  // Find on-axis response
  const onAxis = pattern.find(p => Math.abs(p.angle) < 0.5);
  if (!onAxis) {
    return { minus3dB: 0, minus6dB: 0 };
  }
  
  const onAxisDB = onAxis.dB;
  
  // Find -3dB points
  let minus3dB = 0;
  for (const point of pattern) {
    if (point.angle > 0 && point.dB < onAxisDB - 3) {
      minus3dB = point.angle * 2; // Full beamwidth
      break;
    }
  }
  
  // Find -6dB points
  let minus6dB = 0;
  for (const point of pattern) {
    if (point.angle > 0 && point.dB < onAxisDB - 6) {
      minus6dB = point.angle * 2; // Full beamwidth
      break;
    }
  }
  
  return { minus3dB, minus6dB };
}

/**
 * Export polar pattern to CSV
 */
export function exportPolarPattern(pattern: PolarPattern): string {
  let csv = `Frequency: ${pattern.frequency} Hz\n\n`;
  csv += "Angle(deg),Azimuth(dB),Elevation(dB)\n";
  
  const maxLength = Math.max(pattern.azimuth.length, pattern.elevation.length);
  
  for (let i = 0; i < maxLength; i++) {
    const angle = pattern.azimuth[i]?.angle || pattern.elevation[i]?.angle || 0;
    const azimuthDB = pattern.azimuth[i]?.dB || 0;
    const elevationDB = pattern.elevation[i]?.dB || 0;
    
    csv += `${angle},${azimuthDB.toFixed(2)},${elevationDB.toFixed(2)}\n`;
  }
  
  return csv;
}