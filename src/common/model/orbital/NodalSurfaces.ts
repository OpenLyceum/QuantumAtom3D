/**
 * NodalSurfaces.ts
 *
 * Where an eigenstate (or a real orbital) vanishes:
 *
 *   radial nodes     n − l − 1 spheres, at the zeros of R_nl
 *   polar nodes      l − |m| cones θ = θ_k (θ = 90° is the xy-plane), at the
 *                    zeros of P_l^|m|(cos θ) inside (−1, 1)
 *   azimuthal nodes  |m| planes containing the z-axis, for real orbitals only:
 *                    cos μφ = 0 (cos type) or sin μφ = 0 (sin type). A complex
 *                    Y_lm with m ≠ 0 has no φ nodes; its phase winds instead.
 *
 * So l = (l − |m|) + |m| angular nodes in the real basis.
 */

import { hydrogenRadialNodes } from "../hydrogen/HydrogenRadial.js";
import { findRoots } from "../math/specialFunctions.js";
import { associatedLegendrePolynomialPart } from "../math/sphericalHarmonics.js";
import type { OrbitalBasis } from "./OrbitalCatalog.js";

/** Scan steps on (−1, 1) for the polar-node search (at most four roots for l ≤ 4). */
const POLAR_SCAN_SAMPLES = 2000;

export type NodalSurfaceSet = {
  /** Radii of the spherical nodes, in a0. */
  readonly radialNodeRadii: readonly number[];
  /** Polar angles θ (radians, from +z) of the conical nodes; π/2 is the xy-plane. */
  readonly polarNodeAngles: readonly number[];
  /** Azimuths φ (radians, in [0, π)) of the planes through the z-axis. */
  readonly azimuthalNodeAngles: readonly number[];
};

/** Polar angles of the l − |m| conical nodes of Y_lm, in increasing θ. */
export function polarNodeAngles(l: number, m: number): number[] {
  // Nudge the scan off ±1, where the sin^|m| factor (not a cone) would vanish.
  const EDGE = 1e-9;
  const roots = findRoots((x) => associatedLegendrePolynomialPart(l, m, x), -1 + EDGE, 1 - EDGE, POLAR_SCAN_SAMPLES);
  return roots.map((x) => Math.acos(x)).sort((a, b) => a - b);
}

/** Azimuths of the |m| nodal planes of the real orbital labelled m, in [0, π). */
export function azimuthalNodeAngles(m: number): number[] {
  const mu = Math.abs(m);
  const angles: number[] = [];
  for (let k = 0; k < mu; k++) {
    // cos type: cos μφ = 0 at φ = (π/2 + kπ)/μ. sin type: sin μφ = 0 at φ = kπ/μ.
    angles.push(m > 0 ? (Math.PI / 2 + k * Math.PI) / mu : (k * Math.PI) / mu);
  }
  return angles;
}

/** Every nodal surface of state (n, l, m) in the given basis. */
export function nodalSurfaces(
  n: number,
  l: number,
  m: number,
  nuclearCharge: number,
  basis: OrbitalBasis,
): NodalSurfaceSet {
  return {
    radialNodeRadii: hydrogenRadialNodes(n, l, nuclearCharge),
    polarNodeAngles: polarNodeAngles(l, m),
    azimuthalNodeAngles: basis === "real" ? azimuthalNodeAngles(m) : [],
  };
}
