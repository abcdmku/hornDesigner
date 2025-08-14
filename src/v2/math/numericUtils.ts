/**
 * Numerical utilities for horn calculations
 * Includes Newton-Raphson, bisection, FFT, and other numerical methods
 */

/**
 * Newton-Raphson solver for finding roots
 */
export function newtonRaphson(
  f: (x: number) => number,
  df: (x: number) => number,
  x0: number,
  tolerance: number = 1e-6,
  maxIterations: number = 100
): number | null {
  let x = x0;
  
  for (let i = 0; i < maxIterations; i++) {
    const fx = f(x);
    
    if (Math.abs(fx) < tolerance) {
      return x;
    }
    
    const dfx = df(x);
    
    if (Math.abs(dfx) < 1e-10) {
      // Derivative too small, switch to bisection
      return null;
    }
    
    const xNext = x - fx / dfx;
    
    if (Math.abs(xNext - x) < tolerance) {
      return xNext;
    }
    
    x = xNext;
  }
  
  return null; // Failed to converge
}

/**
 * Bisection method for finding roots
 */
export function bisection(
  f: (x: number) => number,
  a: number,
  b: number,
  tolerance: number = 1e-6,
  maxIterations: number = 100
): number | null {
  let left = a;
  let right = b;
  
  const fa = f(a);
  const fb = f(b);
  
  if (fa * fb > 0) {
    // Same sign at boundaries, no root in interval
    return null;
  }
  
  for (let i = 0; i < maxIterations; i++) {
    const mid = (left + right) / 2;
    const fmid = f(mid);
    
    if (Math.abs(fmid) < tolerance || (right - left) / 2 < tolerance) {
      return mid;
    }
    
    if (fa * fmid < 0) {
      right = mid;
    } else {
      left = mid;
    }
  }
  
  return (left + right) / 2;
}

/**
 * Combined Newton-Raphson with bisection fallback
 */
export function solveWithFallback(
  f: (x: number) => number,
  df: (x: number) => number,
  x0: number,
  bounds: [number, number],
  tolerance: number = 1e-6
): number | null {
  // Try Newton-Raphson first
  const newtonResult = newtonRaphson(f, df, x0, tolerance);
  
  if (newtonResult !== null && newtonResult >= bounds[0] && newtonResult <= bounds[1]) {
    return newtonResult;
  }
  
  // Fall back to bisection
  return bisection(f, bounds[0], bounds[1], tolerance);
}

/**
 * Complex number type
 */
export interface Complex {
  real: number;
  imag: number;
}

/**
 * Complex number operations
 */
export const ComplexOps = {
  add(a: Complex, b: Complex): Complex {
    return { real: a.real + b.real, imag: a.imag + b.imag };
  },
  
  subtract(a: Complex, b: Complex): Complex {
    return { real: a.real - b.real, imag: a.imag - b.imag };
  },
  
  multiply(a: Complex, b: Complex): Complex {
    return {
      real: a.real * b.real - a.imag * b.imag,
      imag: a.real * b.imag + a.imag * b.real
    };
  },
  
  divide(a: Complex, b: Complex): Complex {
    const denominator = b.real * b.real + b.imag * b.imag;
    return {
      real: (a.real * b.real + a.imag * b.imag) / denominator,
      imag: (a.imag * b.real - a.real * b.imag) / denominator
    };
  },
  
  magnitude(a: Complex): number {
    return Math.sqrt(a.real * a.real + a.imag * a.imag);
  },
  
  phase(a: Complex): number {
    return Math.atan2(a.imag, a.real);
  },
  
  exp(a: Complex): Complex {
    const expReal = Math.exp(a.real);
    return {
      real: expReal * Math.cos(a.imag),
      imag: expReal * Math.sin(a.imag)
    };
  },
  
  fromPolar(magnitude: number, phase: number): Complex {
    return {
      real: magnitude * Math.cos(phase),
      imag: magnitude * Math.sin(phase)
    };
  }
};

/**
 * Fast Fourier Transform (Cooley-Tukey algorithm)
 */
export function fft(input: Complex[]): Complex[] {
  const n = input.length;
  
  // Base case
  if (n <= 1) {
    return input;
  }
  
  // Ensure power of 2
  if ((n & (n - 1)) !== 0) {
    throw new Error("FFT input length must be a power of 2");
  }
  
  // Divide
  const even: Complex[] = [];
  const odd: Complex[] = [];
  
  for (let i = 0; i < n; i++) {
    if (i % 2 === 0) {
      even.push(input[i]);
    } else {
      odd.push(input[i]);
    }
  }
  
  // Conquer
  const evenFFT = fft(even);
  const oddFFT = fft(odd);
  
  // Combine
  const result: Complex[] = new Array(n);
  const halfN = n / 2;
  
  for (let k = 0; k < halfN; k++) {
    const angle = -2 * Math.PI * k / n;
    const w: Complex = {
      real: Math.cos(angle),
      imag: Math.sin(angle)
    };
    
    const t = ComplexOps.multiply(w, oddFFT[k]);
    result[k] = ComplexOps.add(evenFFT[k], t);
    result[k + halfN] = ComplexOps.subtract(evenFFT[k], t);
  }
  
  return result;
}

/**
 * Inverse Fast Fourier Transform
 */
export function ifft(input: Complex[]): Complex[] {
  const n = input.length;
  
  // Conjugate the input
  const conjugated = input.map(c => ({ real: c.real, imag: -c.imag }));
  
  // Apply FFT
  const transformed = fft(conjugated);
  
  // Conjugate and scale the output
  return transformed.map(c => ({
    real: c.real / n,
    imag: -c.imag / n
  }));
}

/**
 * Pad array to next power of 2 for FFT
 */
export function padToPowerOfTwo<T>(array: T[], fillValue: T): T[] {
  const n = array.length;
  const nextPowerOfTwo = Math.pow(2, Math.ceil(Math.log2(n)));
  
  if (n === nextPowerOfTwo) {
    return array;
  }
  
  const padded = [...array];
  for (let i = n; i < nextPowerOfTwo; i++) {
    padded.push(fillValue);
  }
  
  return padded;
}

/**
 * Numerical integration using Simpson's rule
 */
export function integrate(
  f: (x: number) => number,
  a: number,
  b: number,
  n: number = 1000
): number {
  if (n % 2 !== 0) {
    n++; // Ensure even number of intervals
  }
  
  const h = (b - a) / n;
  let sum = f(a) + f(b);
  
  for (let i = 1; i < n; i++) {
    const x = a + i * h;
    if (i % 2 === 0) {
      sum += 2 * f(x);
    } else {
      sum += 4 * f(x);
    }
  }
  
  return (h / 3) * sum;
}

/**
 * Linear interpolation
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Cubic interpolation
 */
export function cubicInterp(a: number, b: number, t: number): number {
  const t2 = t * t;
  const t3 = t2 * t;
  return a + (b - a) * (3 * t2 - 2 * t3);
}

/**
 * Clamp value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Convert dB to linear scale
 */
export function dbToLinear(db: number): number {
  return Math.pow(10, db / 20);
}

/**
 * Convert linear to dB scale
 */
export function linearToDb(linear: number): number {
  return 20 * Math.log10(Math.max(1e-10, linear));
}