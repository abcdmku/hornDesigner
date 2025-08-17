import { ProfileParams, ProfilePoint, linspace } from "./shared";

export interface OSParams extends ProfileParams {
  thetaThroatDeg: number; // 5..15
  beta?: number;          // 2..8, default 4
}

export function oblateSpheroidProfile(p: OSParams): ProfilePoint[] {
  const beta = p.beta ?? 4;
  const ct = Math.cos((p.thetaThroatDeg * Math.PI) / 180);
  const k0 = p.throatRadius / Math.max(ct, 1e-6);
  const xs = linspace(0, p.length, p.segments);
  const raw: ProfilePoint[] = new Array(p.segments);
  for (let i = 0; i < xs.length; i++) {
    const x = xs[i];
    const r = k0 * Math.sqrt(Math.max(0, 1 - (1 - ct) * Math.exp((-beta * x) / p.length)));
    raw[i] = { x, r };
  }
  // scale to hit mouth exactly
  const scale = p.mouthRadius / raw[raw.length - 1].r;
  const out = raw.map(({ x, r }) => ({ x, r: p.throatRadius + (r - p.throatRadius) * scale }));
  out[out.length - 1].r = p.mouthRadius;
  return out;
}
