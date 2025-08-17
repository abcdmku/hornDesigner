import { ProfileParams, ProfilePoint, linspace } from "./shared";
export interface HyperSpiralParams extends ProfileParams { beta?: number; }
export function hyperbolicSpiralProfile(p: HyperSpiralParams): ProfilePoint[] {
  const beta = p.beta ?? 4;
  const xs = linspace(0, p.length, p.segments);
  return Array.from(xs, (x) => ({
    x,
    r: p.mouthRadius - (p.mouthRadius - p.throatRadius) * Math.exp((-beta * x) / p.length),
  }));
}
