/**
 * OrbitalCatalog.ts
 *
 * Real orbitals (the chemist's 2p_x, 3d_z², …) as term lists in the complex
 * basis, and their names. For μ = |m| > 0 the real combinations are
 *
 *   cos type (m = +μ):  (Y_l,−μ + (−1)^μ Y_lμ) / √2     ∝ cos μφ, e.g. p_x, d_xz
 *   sin type (m = −μ):  i (Y_l,−μ − (−1)^μ Y_lμ) / √2   ∝ sin μφ, e.g. p_y, d_xy
 *
 * With the Condon–Shortley phase these are positive along +x (cos type) or
 * where the named Cartesian polynomial is positive (sin type). The m = 0
 * orbital is Y_l0 in both bases.
 */

import { eigenstateTerm, type OrbitalTerm } from "./OrbitalTerm.js";

/** Which set of angular functions labels the states on the Orbitals screen. */
export const ORBITAL_BASIS_VALUES = ["complex", "real"] as const;
export type OrbitalBasis = (typeof ORBITAL_BASIS_VALUES)[number];

/** Spectroscopic letters for l = 0, 1, 2, … */
const SPECTROSCOPIC_LETTERS = ["s", "p", "d", "f", "g", "h"] as const;

/**
 * The Cartesian polynomial that names each real orbital, indexed [l][m + l].
 * Written as RichText-ready strings so the view can set them as subscripts.
 */
const REAL_ORBITAL_SUBSCRIPTS: readonly (readonly string[])[] = [
  [""],
  ["y", "z", "x"],
  ["xy", "yz", "z²", "xz", "x²−y²"],
  ["y(3x²−y²)", "xyz", "yz²", "z³", "xz²", "z(x²−y²)", "x(x²−3y²)"],
  ["xy(x²−y²)", "yz(3x²−y²)", "xyz²", "yz³", "z⁴", "xz³", "z²(x²−y²)", "xz(x²−3y²)", "x⁴−6x²y²+y⁴"],
];

const INVERSE_SQRT_2 = 1 / Math.sqrt(2);

/** The spectroscopic letter (s, p, d, …) for orbital quantum number l. */
export function spectroscopicLetter(l: number): string {
  return SPECTROSCOPIC_LETTERS[l] ?? `l=${l}`;
}

/** The Cartesian subscript of the real orbital (l, m), e.g. "x²−y²" for (2, 2). Empty for s. */
export function realOrbitalSubscript(l: number, m: number): string {
  return REAL_ORBITAL_SUBSCRIPTS[l]?.[m + l] ?? "";
}

/** Terms of the real orbital labelled (n, l, m), expressed in the complex basis. */
export function realOrbitalTerms(n: number, l: number, m: number): OrbitalTerm[] {
  if (m === 0) {
    return [eigenstateTerm(n, l, 0)];
  }
  const mu = Math.abs(m);
  const parity = mu % 2 === 0 ? 1 : -1;
  if (m > 0) {
    return [
      { n, l, m: -mu, re: INVERSE_SQRT_2, im: 0 },
      { n, l, m: mu, re: parity * INVERSE_SQRT_2, im: 0 },
    ];
  }
  return [
    { n, l, m: -mu, re: 0, im: INVERSE_SQRT_2 },
    { n, l, m: mu, re: 0, im: -parity * INVERSE_SQRT_2 },
  ];
}

/** Terms of state (n, l, m) in either basis. */
export function orbitalTerms(n: number, l: number, m: number, basis: OrbitalBasis): OrbitalTerm[] {
  return basis === "real" ? realOrbitalTerms(n, l, m) : [eigenstateTerm(n, l, m)];
}
