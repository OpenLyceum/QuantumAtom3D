/**
 * sphericalHarmonics.ts
 *
 * Spherical harmonics Y_lm(θ, φ) = Θ_lm(cos θ) e^{imφ}, orthonormal on the unit
 * sphere, with the Condon–Shortley phase (−1)^m included in P_l^m. With this
 * convention Y_l,−m = (−1)^m Y*_lm, and Y_11 = −√(3/8π) sin θ e^{iφ}.
 *
 * P_l^m is built by the standard stable recurrence: start from P_m^m, step to
 * P_(m+1)^m, then (l − m) P_l^m = (2l − 1) x P_(l−1)^m − (l + m − 1) P_(l−2)^m.
 */

import { factorial } from "./specialFunctions.js";

/**
 * P_l^|m|(x) with the Condon–Shortley phase, but with the (1 − x²)^{|m|/2}
 * factor left out. What remains is a polynomial of degree l − |m| whose roots
 * in (−1, 1) are the conical nodes of Y_lm.
 */
export function associatedLegendrePolynomialPart(l: number, m: number, x: number): number {
  const absM = Math.abs(m);
  // P_m^m / sin^m θ = (−1)^m (2m − 1)!!
  let pmm = 1;
  let oddFactor = 1;
  for (let i = 1; i <= absM; i++) {
    pmm *= -oddFactor;
    oddFactor += 2;
  }
  if (l === absM) {
    return pmm;
  }
  let pmm1 = x * (2 * absM + 1) * pmm;
  for (let ll = absM + 2; ll <= l; ll++) {
    const next = (x * (2 * ll - 1) * pmm1 - (ll + absM - 1) * pmm) / (ll - absM);
    pmm = pmm1;
    pmm1 = next;
  }
  return pmm1;
}

/** The normalization √((2l + 1)/(4π) · (l − |m|)!/(l + |m|)!) of Y_l,|m|. */
function sphericalHarmonicNorm(l: number, m: number): number {
  const absM = Math.abs(m);
  return Math.sqrt(((2 * l + 1) / (4 * Math.PI)) * (factorial(l - absM) / factorial(l + absM)));
}

/**
 * The constant in front of sin^|m| θ · P-polynomial in Θ_lm: the norm, with the
 * (−1)^m of negative odd m folded in. The GPU shader takes this per term, so it
 * only evaluates the polynomial.
 */
export function sphericalHarmonicPrefactor(l: number, m: number): number {
  const absM = Math.abs(m);
  const sign = m < 0 && absM % 2 === 1 ? -1 : 1;
  return sign * sphericalHarmonicNorm(l, m);
}

/**
 * The real polar factor Θ_lm(cos θ) such that Y_lm = Θ_lm e^{imφ}. Valid for
 * every m in [−l, l]; negative m picks up the (−1)^m of Y_l,−m = (−1)^m Y*_lm.
 */
export function sphericalHarmonicTheta(l: number, m: number, cosTheta: number): number {
  const absM = Math.abs(m);
  const sinTheta = Math.sqrt(Math.max(0, 1 - cosTheta * cosTheta));
  return sphericalHarmonicPrefactor(l, m) * sinTheta ** absM * associatedLegendrePolynomialPart(l, m, cosTheta);
}

/** A complex number written into by the hot-loop evaluators, to avoid allocating per sample. */
export type ComplexSample = { re: number; im: number };

/** Writes Y_lm(θ, φ) into `out`. */
export function sphericalHarmonic(l: number, m: number, theta: number, phi: number, out: ComplexSample): void {
  const polar = sphericalHarmonicTheta(l, m, Math.cos(theta));
  out.re = polar * Math.cos(m * phi);
  out.im = polar * Math.sin(m * phi);
}
