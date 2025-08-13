/**
 * Bessel Functions Implementation
 * Mathematical utilities for acoustic calculations
 * References: 
 * - https://en.wikipedia.org/wiki/Bessel_function
 * - Abramowitz & Stegun: Handbook of Mathematical Functions
 */

export class BesselFunctions {
  /**
   * Regular Bessel function of the first kind J_n(x)
   * Uses series expansion for small x, asymptotic expansion for large x
   */
  static besselJ(n: number, x: number): number {
    if (x === 0) {
      return n === 0 ? 1 : 0;
    }

    // For small x, use power series expansion
    if (Math.abs(x) < 10) {
      return this.besselJSeries(n, x);
    }

    // For large x, use asymptotic expansion
    return this.besselJAsymptotic(n, x);
  }

  /**
   * Spherical Bessel function of the first kind j_n(x)
   * j_n(x) = sqrt(π/2x) * J_{n+1/2}(x)
   */
  static sphericalBessel(n: number, x: number): number {
    if (x === 0) {
      return n === 0 ? 1 : 0;
    }

    // For n = 0: j_0(x) = sin(x)/x
    if (n === 0) {
      return Math.sin(x) / x;
    }

    // For n = 1: j_1(x) = sin(x)/x² - cos(x)/x
    if (n === 1) {
      return Math.sin(x) / (x * x) - Math.cos(x) / x;
    }

    // For higher orders, use recurrence relation
    // j_{n+1}(x) = (2n+1)/x * j_n(x) - j_{n-1}(x)
    let j0 = Math.sin(x) / x;
    let j1 = Math.sin(x) / (x * x) - Math.cos(x) / x;
    
    for (let i = 1; i < n; i++) {
      const jNext = ((2 * i + 1) / x) * j1 - j0;
      j0 = j1;
      j1 = jNext;
    }
    
    return j1;
  }

  /**
   * Bessel function Y_n(x) of the second kind
   * Also known as Neumann function
   */
  static besselY(n: number, x: number): number {
    if (x <= 0) {
      return -Infinity;
    }

    // For integer n, use the relationship with J_n
    if (Number.isInteger(n)) {
      if (n === 0) {
        return this.besselY0(x);
      } else if (n === 1) {
        return this.besselY1(x);
      } else {
        // Use recurrence relation
        let y0 = this.besselY0(x);
        let y1 = this.besselY1(x);
        
        for (let i = 1; i < Math.abs(n); i++) {
          const yNext = (2 * i / x) * y1 - y0;
          y0 = y1;
          y1 = yNext;
        }
        
        return n > 0 ? y1 : Math.pow(-1, n) * y1;
      }
    }

    // For non-integer n, use the formula involving J_n
    const cosPin = Math.cos(Math.PI * n);
    const sinPin = Math.sin(Math.PI * n);
    
    if (Math.abs(sinPin) < 1e-10) {
      // n is close to an integer, use limit
      return this.besselY(Math.round(n), x);
    }
    
    return (this.besselJ(n, x) * cosPin - this.besselJ(-n, x)) / sinPin;
  }

  /**
   * Modified Bessel function of the first kind I_n(x)
   */
  static besselI(n: number, x: number): number {
    // I_n(x) = i^(-n) * J_n(ix)
    // For real x, use series expansion
    let sum = 0;
    const maxTerms = 50;
    
    for (let k = 0; k < maxTerms; k++) {
      const term = Math.pow(x / 2, 2 * k + n) / 
                   (this.factorial(k) * this.factorial(k + n));
      sum += term;
      
      if (Math.abs(term) < 1e-15 * Math.abs(sum)) {
        break;
      }
    }
    
    return sum;
  }

  /**
   * Modified Bessel function of the second kind K_n(x)
   */
  static besselK(n: number, x: number): number {
    if (x <= 0) {
      return Infinity;
    }

    // For small x, use asymptotic expansion
    if (x < 1) {
      if (n === 0) {
        return -Math.log(x / 2) - 0.5772156649; // Euler's constant
      } else {
        return this.factorial(n - 1) * Math.pow(2 / x, n) / 2;
      }
    }

    // For large x, use asymptotic expansion
    const expNegX = Math.exp(-x);
    return Math.sqrt(Math.PI / (2 * x)) * expNegX * 
           (1 + (4 * n * n - 1) / (8 * x));
  }

  /**
   * Private helper: Power series expansion for J_n(x)
   */
  private static besselJSeries(n: number, x: number): number {
    let sum = 0;
    const maxTerms = 50;
    const xHalf = x / 2;
    
    for (let k = 0; k < maxTerms; k++) {
      const sign = k % 2 === 0 ? 1 : -1;
      const term = sign * Math.pow(xHalf, 2 * k + n) / 
                   (this.factorial(k) * this.gamma(k + n + 1));
      sum += term;
      
      // Check for convergence
      if (Math.abs(term) < 1e-15 * Math.abs(sum)) {
        break;
      }
    }
    
    return sum;
  }

  /**
   * Private helper: Asymptotic expansion for J_n(x)
   */
  private static besselJAsymptotic(n: number, x: number): number {
    const chi = x - (n * Math.PI / 2) - (Math.PI / 4);
    const amplitude = Math.sqrt(2 / (Math.PI * x));
    
    // First few terms of asymptotic expansion
    const a0 = 1;
    const a1 = (4 * n * n - 1) / (8 * x);
    const a2 = (4 * n * n - 1) * (4 * n * n - 9) / (128 * x * x);
    
    return amplitude * (a0 * Math.cos(chi) - a1 * Math.sin(chi) + 
                        a2 * Math.cos(chi));
  }

  /**
   * Private helper: Y_0(x) Bessel function of second kind, order 0
   */
  private static besselY0(x: number): number {
    if (x < 8) {
      const j0 = this.besselJ(0, x);
      return (2 / Math.PI) * (Math.log(x / 2) * j0 + this.besselY0Series(x));
    }
    
    // Asymptotic expansion for large x
    const chi = x - Math.PI / 4;
    return Math.sqrt(2 / (Math.PI * x)) * Math.sin(chi);
  }

  /**
   * Private helper: Y_1(x) Bessel function of second kind, order 1
   */
  private static besselY1(x: number): number {
    if (x < 8) {
      const j1 = this.besselJ(1, x);
      return (2 / Math.PI) * (Math.log(x / 2) * j1 - 1 / x + 
                              this.besselY1Series(x));
    }
    
    // Asymptotic expansion for large x
    const chi = x - 3 * Math.PI / 4;
    return Math.sqrt(2 / (Math.PI * x)) * Math.sin(chi);
  }

  /**
   * Private helper: Series expansion for Y_0
   */
  private static besselY0Series(x: number): number {
    let sum = 0;
    const xHalf = x / 2;
    const maxTerms = 20;
    
    for (let k = 1; k < maxTerms; k++) {
      const term = Math.pow(-1, k) * Math.pow(xHalf, 2 * k) / 
                   Math.pow(this.factorial(k), 2) * this.harmonic(k);
      sum += term;
      
      if (Math.abs(term) < 1e-15) break;
    }
    
    return sum;
  }

  /**
   * Private helper: Series expansion for Y_1
   */
  private static besselY1Series(x: number): number {
    let sum = 0;
    const xHalf = x / 2;
    const maxTerms = 20;
    
    for (let k = 1; k < maxTerms; k++) {
      const term = Math.pow(-1, k) * Math.pow(xHalf, 2 * k + 1) / 
                   (this.factorial(k) * this.factorial(k + 1)) * 
                   (this.harmonic(k) + this.harmonic(k + 1));
      sum += term;
      
      if (Math.abs(term) < 1e-15) break;
    }
    
    return xHalf * sum;
  }

  /**
   * Helper: Factorial function
   */
  private static factorial(n: number): number {
    if (n < 0) return NaN;
    if (n === 0 || n === 1) return 1;
    
    let result = 1;
    for (let i = 2; i <= n; i++) {
      result *= i;
    }
    return result;
  }

  /**
   * Helper: Gamma function (extension of factorial to real numbers)
   */
  private static gamma(n: number): number {
    // For positive integers, gamma(n) = (n-1)!
    if (Number.isInteger(n) && n > 0) {
      return this.factorial(n - 1);
    }
    
    // Stirling's approximation for large n
    if (n > 10) {
      return Math.sqrt(2 * Math.PI / n) * Math.pow(n / Math.E, n);
    }
    
    // Use recursion and known values
    if (n < 1) {
      return Math.PI / (Math.sin(Math.PI * n) * this.gamma(1 - n));
    }
    
    // Lanczos approximation for other values
    const g = 7;
    const coef = [
      0.99999999999980993,
      676.5203681218851,
      -1259.1392167224028,
      771.32342877765313,
      -176.61502916214059,
      12.507343278686905,
      -0.13857109526572012,
      9.9843695780195716e-6,
      1.5056327351493116e-7
    ];
    
    let x = n;
    let tmp = coef[0];
    for (let i = 1; i < g + 2; i++) {
      tmp += coef[i] / (x + i);
    }
    
    return Math.sqrt(2 * Math.PI) * Math.pow(x + g + 0.5, x + 0.5) * 
           Math.exp(-(x + g + 0.5)) * tmp;
  }

  /**
   * Helper: Harmonic number H_n = 1 + 1/2 + 1/3 + ... + 1/n
   */
  private static harmonic(n: number): number {
    let sum = 0;
    for (let i = 1; i <= n; i++) {
      sum += 1 / i;
    }
    return sum;
  }

  /**
   * Hankel function of the first kind H^(1)_n(x) = J_n(x) + i*Y_n(x)
   * Returns complex number as {real, imaginary}
   */
  static hankel1(n: number, x: number): { real: number; imaginary: number } {
    return {
      real: this.besselJ(n, x),
      imaginary: this.besselY(n, x)
    };
  }

  /**
   * Hankel function of the second kind H^(2)_n(x) = J_n(x) - i*Y_n(x)
   * Returns complex number as {real, imaginary}
   */
  static hankel2(n: number, x: number): { real: number; imaginary: number } {
    return {
      real: this.besselJ(n, x),
      imaginary: -this.besselY(n, x)
    };
  }
}