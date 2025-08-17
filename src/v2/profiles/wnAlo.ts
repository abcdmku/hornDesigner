import { ProfileParams, ProfilePoint, linspace } from "./shared";
export interface ALOParams extends ProfileParams { beta?: number; eta?: number; }
export function wnAloProfile(p: ALOParams): ProfilePoint[] {
  const beta = p.beta ?? 4.0;
  const eta = p.eta ?? 1.6;
  const xs = linspace(0, p.length, p.segments);
  const r0sq = p.throatRadius * p.throatRadius;
  const rmsq = p.mouthRadius * p.mouthRadius;
  return Array.from(xs, (x) => {
    const t = 1 - Math.exp((-beta * x) / p.length);
    return { x, r: Math.sqrt(r0sq + (rmsq - r0sq) * Math.pow(Math.max(0, t), eta)) };
  });
}
