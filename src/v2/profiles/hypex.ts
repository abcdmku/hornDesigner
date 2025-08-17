import { ProfileParams, ProfilePoint, linspace, PI, assertPos } from "./shared";

export interface HypexParams extends ProfileParams {
  speedOfSound?: number; // m/s, default 343
  fc?: number;           // Hz; you can provide fc or m
  m?: number;            // 1/m flare constant (overrides fc if given)
  T: number;             // shape factor (T=0 => exponential)
}

export function hypexProfile(p: HypexParams): ProfilePoint[] {
  const c = p.speedOfSound ?? 343;
  const S0 = PI * p.throatRadius * p.throatRadius;
  assertPos(p.throatRadius, "throatRadius"); assertPos(p.segments, "segments");

  // Determine m and possibly length from mouthRadius
  const m = p.m ?? ((p.fc ?? 0) > 0 ? (2 * Math.PI * (p.fc as number)) / c : undefined);
  if (!m) throw new Error("Provide either m or fc");
  let L = p.length;
  if (!L && p.mouthRadius) {
    const Sm = PI * p.mouthRadius * p.mouthRadius;
    const ratio = Sm / S0;
    const inside = (ratio + p.T) / (1 + p.T);
    if (!(inside > 0)) throw new Error("Invalid mouth / T");
    L = Math.log(inside) / m;
  }
  if (!L) throw new Error("Provide length or mouthRadius");

  const xs = linspace(0, L!, p.segments);
  const out: ProfilePoint[] = new Array(p.segments);
  for (let i = 0; i < xs.length; i++) {
    const x = xs[i];
    const S = S0 * ((1 + p.T) * Math.exp(m * x) - p.T);
    const r = Math.sqrt(Math.max(S, 0) / PI);
    out[i] = { x, r };
  }
  // Optionally clamp exact mouth radius if provided:
  if (p.mouthRadius) out[out.length - 1].r = p.mouthRadius;
  return out;
}
