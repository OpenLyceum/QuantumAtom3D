/**
 * HydrogenRadial.ts
 *
 * Radial functions of a one-electron atom with nuclear charge Z, in atomic units:
 *
 *   R_nl(r) = N_nl ρ^l e^{−ρ/2} L_{n−l−1}^{(2l+1)}(ρ),  ρ = 2Zr/n,
 *   N_nl = √((2Z/n)³ (n − l − 1)! / (2n (n + l)!)),
 *
 * normalized so that ∫ R² r² dr = 1. Also gives the radial distribution
 * P(r) = r² R², the radial nodes, the most probable radius and the radius that
 * encloses a given probability.
 */

import { associatedLaguerre, factorial, findRoots } from "../math/specialFunctions.js";

/** Grid points for the numerical P(r) integrals (cumulative probability, maximum). */
const RADIAL_GRID_POINTS = 4000;

/** Scan steps for the node search; far more than the at most four nodes at n ≤ 5. */
const NODE_SCAN_SAMPLES = 2000;

/** Normalization N_nl of R_nl. */
function radialNorm(n: number, l: number, nuclearCharge: number): number {
  return Math.sqrt(((2 * nuclearCharge) / n) ** 3 * (factorial(n - l - 1) / (2 * n * factorial(n + l))));
}

/** R_nl(r) for nuclear charge Z, with r in Bohr radii. Positive near the nucleus. */
export function hydrogenRadial(n: number, l: number, nuclearCharge: number, r: number): number {
  const rho = (2 * nuclearCharge * r) / n;
  return (
    radialNorm(n, l, nuclearCharge) * rho ** l * Math.exp(-rho / 2) * associatedLaguerre(n - l - 1, 2 * l + 1, rho)
  );
}

/** P(r) = r² R_nl(r)², the probability per unit radius. */
export function hydrogenRadialDistribution(n: number, l: number, nuclearCharge: number, r: number): number {
  const radial = hydrogenRadial(n, l, nuclearCharge, r);
  return r * r * radial * radial;
}

/**
 * A radius beyond which P(r) is negligible (well past 99.99 %). It scales as
 * n²/Z, like the orbital itself.
 */
export function hydrogenRadialCutoff(n: number, nuclearCharge: number): number {
  const CUTOFF_N2_FACTOR = 4;
  const CUTOFF_OFFSET = 10;
  return (CUTOFF_N2_FACTOR * n * n + CUTOFF_OFFSET) / nuclearCharge;
}

/** The n − l − 1 radii (in a0) where R_nl changes sign, in increasing order. */
export function hydrogenRadialNodes(n: number, l: number, nuclearCharge: number): number[] {
  const degree = n - l - 1;
  if (degree === 0) {
    return [];
  }
  const alpha = 2 * l + 1;
  // Every zero of L_k^α lies below 4k + 2α + 2 (a crude but safe bound).
  const rhoMax = 4 * degree + 2 * alpha + 2;
  const rhoRoots = findRoots((rho) => associatedLaguerre(degree, alpha, rho), 0, rhoMax, NODE_SCAN_SAMPLES);
  return rhoRoots.map((rho) => (rho * n) / (2 * nuclearCharge));
}

/** The radius of the global maximum of P(r), found on a grid and refined by golden-section search. */
export function hydrogenMostProbableRadius(n: number, l: number, nuclearCharge: number): number {
  const GOLDEN_SECTION_STEPS = 60;
  const INVERSE_GOLDEN_RATIO = (Math.sqrt(5) - 1) / 2;
  const cutoff = hydrogenRadialCutoff(n, nuclearCharge);
  const step = cutoff / RADIAL_GRID_POINTS;
  let bestIndex = 0;
  let bestValue = -1;
  for (let i = 1; i <= RADIAL_GRID_POINTS; i++) {
    const value = hydrogenRadialDistribution(n, l, nuclearCharge, i * step);
    if (value > bestValue) {
      bestValue = value;
      bestIndex = i;
    }
  }
  let lo = Math.max(0, (bestIndex - 1) * step);
  let hi = (bestIndex + 1) * step;
  for (let k = 0; k < GOLDEN_SECTION_STEPS; k++) {
    const a = hi - INVERSE_GOLDEN_RATIO * (hi - lo);
    const b = lo + INVERSE_GOLDEN_RATIO * (hi - lo);
    if (hydrogenRadialDistribution(n, l, nuclearCharge, a) > hydrogenRadialDistribution(n, l, nuclearCharge, b)) {
      hi = b;
    } else {
      lo = a;
    }
  }
  return 0.5 * (lo + hi);
}

/**
 * The radius R with ∫₀^R P(r) dr = `fraction`, by Simpson's rule on a fine grid
 * and linear interpolation inside the grid cell where the fraction is crossed.
 */
export function hydrogenEnclosingRadius(n: number, l: number, nuclearCharge: number, fraction: number): number {
  const cutoff = hydrogenRadialCutoff(n, nuclearCharge);
  const step = cutoff / RADIAL_GRID_POINTS;
  let cumulative = 0;
  let previousValue = 0;
  for (let i = 1; i <= RADIAL_GRID_POINTS; i++) {
    const r = i * step;
    const value = hydrogenRadialDistribution(n, l, nuclearCharge, r);
    const midpoint = hydrogenRadialDistribution(n, l, nuclearCharge, r - step / 2);
    const cellProbability = (step / 6) * (previousValue + 4 * midpoint + value);
    if (cumulative + cellProbability >= fraction) {
      return r - step + step * ((fraction - cumulative) / cellProbability);
    }
    cumulative += cellProbability;
    previousValue = value;
  }
  return cutoff;
}
