/**
 * Horn mathematics utilities
 * Handles cross-section calculations, area computations, and shape transformations
 */

export type CrossSectionMode = "circle" | "ellipse" | "superellipse" | "rectangular" | "stereographic";

export interface CrossSectionSpec {
  mode: CrossSectionMode;
  aspect?: number; // Width/height ratio
  n_schedule?: {
    start: number;
    end: number;
    easing: "linear" | "cubic";
  };
  stereographic?: {
    fp?: number; // Focal parameter
    normalize?: boolean;
  };
  rectangular?: {
    matchMode?: "area" | "dimensions";
    cornerRadius?: number;
  };
  hv_diff?: {
    horizontal: number;
    vertical: number;
  };
}

/**
 * Calculate area of a circle
 */
export function areaCircle(radius: number): number {
  return Math.PI * radius * radius;
}

/**
 * Calculate area of an ellipse
 */
export function areaEllipse(a: number, b: number): number {
  return Math.PI * a * b;
}

/**
 * Calculate area of a superellipse using Gamma function
 * Area = 4 * a * b * Γ(1 + 1/n)² / Γ(1 + 2/n)
 */
export function areaSuperellipse(a: number, b: number, n: number): number {
  if (n === 2) {
    // Standard ellipse
    return areaEllipse(a, b);
  }
  
  // Using approximation for superellipse area
  // More accurate calculation would use gamma functions
  const gamma1 = gammaApprox(1 + 1/n);
  const gamma2 = gammaApprox(1 + 2/n);
  
  return 4 * a * b * (gamma1 * gamma1) / gamma2;
}

/**
 * Calculate area of a rectangle
 */
export function areaRectangle(width: number, height: number, cornerRadius: number = 0): number {
  if (cornerRadius === 0) {
    return width * height;
  }
  
  // Rectangle with rounded corners
  const cornerArea = (1 - Math.PI / 4) * cornerRadius * cornerRadius;
  return width * height - 4 * cornerArea;
}

/**
 * Schedule n parameter for superellipse along z
 */
export function scheduleN(
  z: number,
  length: number,
  schedule?: { start: number; end: number; easing: "linear" | "cubic" }
): number {
  if (!schedule) {
    return 2; // Default to ellipse
  }
  
  const { start, end, easing } = schedule;
  const t = z / length;
  
  if (easing === "cubic") {
    // Cubic easing
    const tCubic = t * t * (3 - 2 * t);
    return start + (end - start) * tCubic;
  } else {
    // Linear easing
    return start + (end - start) * t;
  }
}

/**
 * Stereographic projection mapping
 * Maps spherical coordinates to planar coordinates
 */
export function stereographicMap(
  theta: number,
  phi: number,
  fp: number = 1,
  normalize: boolean = true
): { x: number; y: number } {
  // Stereographic projection from south pole
  const factor = fp / (1 + Math.sin(phi));
  const x = factor * Math.cos(theta) * Math.cos(phi);
  const y = factor * Math.sin(theta) * Math.cos(phi);
  
  if (normalize) {
    // Normalize to unit circle
    const r = Math.sqrt(x * x + y * y);
    if (r > 0) {
      return { x: x / r, y: y / r };
    }
  }
  
  return { x, y };
}

/**
 * Calculate dimensions for area-matched rectangular cross-section
 */
export function calculateRectangularDimensions(
  circularRadius: number,
  aspect: number,
  matchMode: "area" | "dimensions" = "area"
): { width: number; height: number } {
  const circularArea = areaCircle(circularRadius);
  
  if (matchMode === "area") {
    // Match area to circular cross-section
    const height = Math.sqrt(circularArea / aspect);
    const width = height * aspect;
    return { width, height };
  } else {
    // Match diagonal to circular diameter
    const diameter = 2 * circularRadius;
    const height = diameter / Math.sqrt(1 + aspect * aspect);
    const width = height * aspect;
    return { width, height };
  }
}

/**
 * Calculate superellipse dimensions for area matching
 */
export function calculateSuperellipseDimensions(
  circularRadius: number,
  aspect: number,
  n: number
): { a: number; b: number } {
  const targetArea = areaCircle(circularRadius);
  
  // Solve for semi-axes that match the area
  // Area = 4 * a * b * Γ(1 + 1/n)² / Γ(1 + 2/n)
  // With aspect ratio a = aspect * b
  
  const gamma1 = gammaApprox(1 + 1/n);
  const gamma2 = gammaApprox(1 + 2/n);
  const factor = 4 * (gamma1 * gamma1) / gamma2;
  
  const b = Math.sqrt(targetArea / (factor * aspect));
  const a = aspect * b;
  
  return { a, b };
}

/**
 * Apply H/V different flare laws
 */
export function applyHVDiff(
  baseRadius: number,
  z: number,
  length: number,
  hvDiff?: { horizontal: number; vertical: number }
): { horizontal: number; vertical: number } {
  if (!hvDiff) {
    return { horizontal: baseRadius, vertical: baseRadius };
  }
  
  const t = z / length;
  const horizontal = baseRadius * (1 + hvDiff.horizontal * t);
  const vertical = baseRadius * (1 + hvDiff.vertical * t);
  
  return { horizontal, vertical };
}

/**
 * Gamma function approximation using Lanczos approximation
 */
function gammaApprox(z: number): number {
  // Lanczos coefficients
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
  
  if (z < 0.5) {
    // Use reflection formula
    return Math.PI / (Math.sin(Math.PI * z) * gammaApprox(1 - z));
  }
  
  z -= 1;
  let x = coef[0];
  for (let i = 1; i < g + 2; i++) {
    x += coef[i] / (z + i);
  }
  
  const t = z + g + 0.5;
  const sqrt2Pi = Math.sqrt(2 * Math.PI);
  
  return sqrt2Pi * Math.pow(t, z + 0.5) * Math.exp(-t) * x;
}

/**
 * Generate points on a superellipse
 */
export function superellipsePoints(
  a: number,
  b: number,
  n: number,
  segments: number
): Array<{ x: number; y: number }> {
  const points: Array<{ x: number; y: number }> = [];
  
  for (let i = 0; i <= segments; i++) {
    const t = (i / segments) * 2 * Math.PI;
    const cosT = Math.cos(t);
    const sinT = Math.sin(t);
    
    const x = a * Math.sign(cosT) * Math.pow(Math.abs(cosT), 2 / n);
    const y = b * Math.sign(sinT) * Math.pow(Math.abs(sinT), 2 / n);
    
    points.push({ x, y });
  }
  
  return points;
}

/**
 * Report area drift for validation
 */
export function calculateAreaDrift(
  targetArea: number,
  actualArea: number
): number {
  return Math.abs(actualArea - targetArea) / targetArea * 100;
}