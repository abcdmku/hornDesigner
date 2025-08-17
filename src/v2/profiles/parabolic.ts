import { ProfileParams, ProfilePoint, linspace } from "./shared";
export function parabolicProfile(p: ProfileParams): ProfilePoint[] {
  const b = p.throatRadius * p.throatRadius;
  const a = (p.mouthRadius * p.mouthRadius - b) / p.length;
  const xs = linspace(0, p.length, p.segments);
  return Array.from(xs, (x) => ({ x, r: Math.sqrt(Math.max(0, a * x + b)) }));
}
