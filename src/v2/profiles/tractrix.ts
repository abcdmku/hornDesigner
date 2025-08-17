import { ProfileParams, ProfilePoint, linspace, assertPos, PI, solveBracketed } from "./shared";

export interface TractrixParams extends ProfileParams {
  // If mouthRadius omitted, we solve 'a' from provided length and throat radius by matching a chosen mouth angle (default ~90°).
  mouthAngleDeg?: number; // optional, used if mouthRadius is not given; default 90
}

function xOfR(r: number, a: number): number {
  // classic tractrix distance from mouth (x=0) to radius r
  const t = Math.max(Math.min(r, a * (1 - 1e-12)), 1e-12);
  const s = Math.sqrt(Math.max(a * a - t * t, 0));
  return a * Math.log((a + s) / t) - s;
}

export function tractrixProfile(p: TractrixParams): ProfilePoint[] {
  const r0 = p.throatRadius; assertPos(r0, "throatRadius");
  let a = p.mouthRadius;     // mouth radius
  let L = p.length;

  // If a is unknown but L is known, solve for 'a' so x(r0) ≈ L
  if (!a && L) {
    // 'a' must be > r0. Bracket a in [r0*(1+eps), r0*1000] and solve x(r0,a) - L = 0
    const f = (A: number) => xOfR(r0, A) - L!;
    a = solveBracketed(f, r0 * 1.001, r0 * 1e3);
  }
  if (!a) throw new Error("Provide mouthRadius or length");
  if (!L) L = xOfR(r0, a);

  const xs = linspace(0, L, p.segments);
  // Invert x(r) -> r(x) using monotonic bracket [r0..a]
  const out: ProfilePoint[] = [];
  for (let i = 0; i < xs.length; i++) {
    const x = xs[i];
    const r = solveBracketed(
      (rv) => xOfR(rv, a!) - x,
      Math.min(r0, a! * 0.999999),
      a! * (1 - 1e-12),
    );
    out.push({ x, r });
  }
  // exact ends
  out[0].r = r0;
  out[out.length - 1].r = a!;
  return out;
}

/** NOTE: "True-Expansion Tractrix"
 * If you want area to follow a chosen expansion (e.g. exponential with m),
 * you compute a(z) (local tractrix parameter) such that dS/dx at throat matches
 * the target. Pragmatic approach: scale 'a' so the *integrated* S(x) drift is minimized.
 * Keep classic tractrix for plotting now; apply true-expansion correction later in area matching.
 */
