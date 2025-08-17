import { ProfileParams, ProfilePoint, linspace, solveBracketed } from "./shared";

export function sphericalProfile(p: ProfileParams): ProfilePoint[] {
  const { throatRadius: rt, mouthRadius: rm, length: L } = p;

  // Solve for x0 (then R from throat equation): rt^2 = 2 R x0 - x0^2
  // Mouth: rm^2 = 2 R (L + x0) - (L + x0)^2
  const f = (x0: number) => {
    const R = (rt * rt + x0 * x0) / (2 * x0);
    return 2 * R * (L + x0) - (L + x0) * (L + x0) - rm * rm;
  };
  const x0 = solveBracketed(f, 1e-6, Math.max(L, rt + rm + 1e-6));
  const R = (rt * rt + x0 * x0) / (2 * x0);

  const xs = linspace(0, L, p.segments);
  const out: ProfilePoint[] = new Array(p.segments);
  for (let i = 0; i < xs.length; i++) {
    const x = xs[i];
    const rr = Math.sqrt(Math.max(0, R * R - Math.pow(R - (x + x0), 2)));
    out[i] = { x, r: rr };
  }
  out[0].r = rt; out[out.length - 1].r = rm;
  return out;
}
