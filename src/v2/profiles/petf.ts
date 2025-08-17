import { ProfileParams, ProfilePoint, linspace, PI } from "./shared";

export interface PETFParams extends ProfileParams {
  speedOfSound?: number;
  fc?: number;  // or m
  m?: number;
  T0: number;
  Tadd: number;
  power?: number; // φ(x) = (x/L)^power
}

export function petfProfile(p: PETFParams): ProfilePoint[] {
  const c = p.speedOfSound ?? 343;
  const m = p.m ?? ((p.fc ?? 0) > 0 ? (2 * Math.PI * (p.fc as number)) / c : undefined);
  if (!m) throw new Error("Provide m or fc");
  const S0 = PI * p.throatRadius * p.throatRadius;
  const pow = p.power ?? 1.0;
  const xs = linspace(0, p.length, p.segments);
  const out: ProfilePoint[] = new Array(p.segments);
  for (let i = 0; i < xs.length; i++) {
    const x = xs[i];
    const phi = Math.pow(x / p.length, pow);
    const T = p.T0 + p.Tadd * phi;
    const S = S0 * ((1 + T) * Math.exp(m * x) - T);
    out[i] = { x, r: Math.sqrt(Math.max(S, 0) / PI) };
  }
  out[out.length - 1].r = p.mouthRadius ?? out[out.length - 1].r;
  return out;
}
