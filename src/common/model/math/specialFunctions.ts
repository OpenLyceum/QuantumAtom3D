/**
 * specialFunctions.ts
 *
 * Factorials and orthogonal polynomials for the radial functions.
 *
 * `factorial` and `associatedLaguerre` are ported from QuantumPotential
 * (src/common/model/analytical-solutions/math-utilities.ts). The quantum
 * numbers here stay small (n ≤ 5, so n + l ≤ 9), and none of the log-space
 * rescaling that QuantumPotential needs for n ≈ 150 is required.
 */

/** n! for a non-negative integer n (exact up to 18!). */
export function factorial(n: number): number {
  let result = 1;
  for (let i = 2; i <= n; i++) {
    result *= i;
  }
  return result;
}

/**
 * The generalized (associated) Laguerre polynomial L_n^α(x), with the modern
 * normalization L_0 = 1, L_1 = 1 + α − x, built by the three-term recurrence
 * (k + 1) L_(k+1) = (2k + 1 + α − x) L_k − (k + α) L_(k−1).
 */
export function associatedLaguerre(n: number, alpha: number, x: number): number {
  if (n === 0) {
    return 1;
  }
  let previous = 1;
  let current = 1 + alpha - x;
  for (let k = 1; k < n; k++) {
    const next = ((2 * k + 1 + alpha - x) * current - (k + alpha) * previous) / (k + 1);
    previous = current;
    current = next;
  }
  return current;
}

/**
 * Finds every sign change of `f` on [a, b] by scanning `samples` equal steps,
 * then refines each one by bisection. Returns the roots in increasing order.
 * Used for the radial and angular nodes, where the number of roots is known
 * in advance and the polynomials are well conditioned.
 */
export function findRoots(f: (x: number) => number, a: number, b: number, samples: number): number[] {
  const BISECTION_STEPS = 60;
  const roots: number[] = [];
  const step = (b - a) / samples;
  let x0 = a;
  let f0 = f(x0);
  for (let i = 1; i <= samples; i++) {
    const x1 = a + i * step;
    const f1 = f(x1);
    if (f0 === 0) {
      roots.push(x0);
    } else if (f0 * f1 < 0) {
      let lo = x0;
      let hi = x1;
      let fLo = f0;
      for (let k = 0; k < BISECTION_STEPS; k++) {
        const mid = 0.5 * (lo + hi);
        const fMid = f(mid);
        if (fLo * fMid <= 0) {
          hi = mid;
        } else {
          lo = mid;
          fLo = fMid;
        }
      }
      roots.push(0.5 * (lo + hi));
    }
    x0 = x1;
    f0 = f1;
  }
  return roots;
}
