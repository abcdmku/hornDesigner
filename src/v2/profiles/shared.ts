export interface ProfileParams {
  throatRadius: number; // meters
  mouthRadius: number;  // meters
  length: number;       // meters
  segments: number;     // axial divisions
  // optional extras per profile…
  [k: string]: any;
}
export type ProfilePoint = { x: number; r: number };

export function assertPos(v: number, name: string) {
  if (!(v > 0)) throw new Error(`${name} must be > 0`);
}

export function linspace(a: number, b: number, n: number): Float64Array {
  const out = new Float64Array(n);
  const step = (b - a) / (n - 1);
  for (let i = 0; i < n; i++) out[i] = a + i * step;
  return out;
}

// Robust Newton with bisection fallback to solve f(t) = 0 on [lo, hi]
export function solveBracketed(
  f: (t: number) => number,
  lo: number,
  hi: number,
  opts: { tol?: number; maxIter?: number } = {}
): number {
  const tol = opts.tol ?? 1e-10;
  const maxIter = opts.maxIter ?? 80;
  let a = lo, b = hi, fa = f(a), fb = f(b);
  if (!isFinite(fa) || !isFinite(fb)) throw new Error("Non-finite bracket endpoints");
  if (fa === 0) return a;
  if (fb === 0) return b;
  if (fa * fb > 0) throw new Error("Root not bracketed");

  let x = 0.5 * (a + b);
  let fx = f(x);
  for (let i = 0; i < maxIter; i++) {
    // Secant step
    const denom = fb - fa;
    let s = x;
    if (Math.abs(denom) > 1e-18) {
      s = b - fb * (b - a) / denom;
    }
    // keep in bracket
    if (!(s > Math.min(a, b) && s < Math.max(a, b))) s = 0.5 * (a + b);

    const fs = f(s);
    if (!isFinite(fs)) { s = 0.5 * (a + b); }
    if (Math.abs(fs) < tol) return s;

    // Update bracket
    if (fa * fs < 0) { b = s; fb = fs; }
    else { a = s; fa = fs; }
    x = 0.5 * (a + b);
    fx = f(x);
    if (Math.abs(b - a) < tol) return x;
  }
  return x;
}

export const PI = Math.PI;
export const TAU = 2 * Math.PI;

export function toMeters(v: number, unit: "m" | "mm" = "m") {
  return unit === "mm" ? v / 1000 : v;
}
