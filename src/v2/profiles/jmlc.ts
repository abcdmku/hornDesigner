import { ProfileParams, ProfilePoint, linspace, solveBracketed, assertPos } from "./shared";

export interface JMLCParams extends ProfileParams {
  fc: number;              // Hz
  speedOfSound?: number;   // m/s (343)
  alpha0_deg?: number;     // mouth angle target (deg), default 90
  gamma?: number;          // shaping (1..2), default 1.4
}

function integrateJMLC(p: Required<JMLCParams>, L: number): { pts: ProfilePoint[]; alphaEnd: number } {
  const N = p.segments;
  const dx = L / (N - 1);
  const k = (2 * Math.PI * p.fc) / p.speedOfSound;
  const eps = 1e-6;
  let r = p.throatRadius;
  let alpha = Math.max(1e-4, Math.atan((p.mouthRadius - p.throatRadius) / Math.max(L, 1e-6))); // mild initial slope
  const out: ProfilePoint[] = [{ x: 0, r }];

  for (let i = 1; i < N; i++) {
    // RK2 (Heun) – stable enough for UI
    const drdx = Math.tan(alpha);
    const dalphadx = k * Math.sqrt(1 + drdx * drdx) / Math.sqrt(1 + Math.pow(k * r / p.gamma, 2)) - Math.sin(alpha) / (r + eps);

    // predictor
    const r1 = r + drdx * dx;
    const a1 = alpha + dalphadx * dx;
    const drdx1 = Math.tan(a1);
    const dalphadx1 = k * Math.sqrt(1 + drdx1 * drdx1) / Math.sqrt(1 + Math.pow(k * r1 / p.gamma, 2)) - Math.sin(a1) / (r1 + eps);

    // corrector
    r += 0.5 * (drdx + drdx1) * dx;
    alpha += 0.5 * (dalphadx + dalphadx1) * dx;

    out.push({ x: i * dx, r: Math.max(r, p.throatRadius) });
  }
  return { pts: out, alphaEnd: alpha };
}

export function jmlcProfile(pp: JMLCParams): ProfilePoint[] {
  const p: Required<JMLCParams> = {
    speedOfSound: 343,
    alpha0_deg: 90,
    gamma: 1.4,
    ...pp,
  } as any;
  assertPos(p.fc, "fc"); assertPos(p.throatRadius, "throatRadius"); assertPos(p.segments, "segments");

  // choose L: if not provided, shoot L so alpha(L) ≈ alpha0; else refine mouth radius if given
  const alphaTarget = (p.alpha0_deg * Math.PI) / 180;

  let L = p.length;
  if (!L) {
    // bracket L using tractrix-like heuristic
    const Llo = Math.max(0.05, (p.mouthRadius - p.throatRadius) * 0.5);
    const Lhi = Math.max(Llo * 20, (p.mouthRadius - p.throatRadius) * 10 + 0.2);
    L = solveBracketed((Lx) => integrateJMLC(p, Lx).alphaEnd - alphaTarget, Llo, Lhi);
  }
  const { pts } = integrateJMLC(p, L!);
  // If mouthRadius provided, scale gently to hit exact mouth r without distorting start:
  if (p.mouthRadius) {
    const rEnd = pts[pts.length - 1].r;
    if (rEnd > 1e-9) {
      const k = (p.mouthRadius as number) / rEnd;
      for (let i = 1; i < pts.length; i++) {
        pts[i] = { x: pts[i].x, r: p.throatRadius + (pts[i].r - p.throatRadius) * k };
      }
      pts[pts.length - 1].r = p.mouthRadius as number;
    }
  }
  return pts;
}
