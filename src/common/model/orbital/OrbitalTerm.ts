/**
 * OrbitalTerm.ts
 *
 * One term c · R_nl(r) Y_lm(θ, φ) of a wavefunction. Every state drawn by the
 * sim is a list of these, written in the complex Y_lm basis: real orbitals,
 * hybrids and (later) superpositions are just several terms with complex
 * coefficients c = re + i·im. The GPU field shader evaluates the same lists
 * term by term, so this is also the shape of the data it receives.
 */

export type OrbitalTerm = {
  readonly n: number;
  readonly l: number;
  readonly m: number;
  /** Real part of the coefficient c. */
  readonly re: number;
  /** Imaginary part of the coefficient c. */
  readonly im: number;
};

/** The single term ψ_nlm with coefficient 1. */
export function eigenstateTerm(n: number, l: number, m: number): OrbitalTerm {
  return { n, l, m, re: 1, im: 0 };
}

/**
 * Σ|c_k|² over the terms. The basis states are orthonormal, so this is ⟨ψ|ψ⟩
 * whenever no two terms share the same (n, l, m).
 */
export function termsNormSquared(terms: readonly OrbitalTerm[]): number {
  let sum = 0;
  for (const term of terms) {
    sum += term.re * term.re + term.im * term.im;
  }
  return sum;
}
