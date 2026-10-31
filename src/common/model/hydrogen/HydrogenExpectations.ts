/**
 * HydrogenExpectations.ts
 *
 * Exact energies and radial expectation values of a hydrogenic eigenstate, in
 * atomic units (lengths in a0, energies in E_h):
 *
 *   E_n   = −Z² / (2n²)
 *   ⟨r⟩   = [3n² − l(l + 1)] / (2Z)
 *   ⟨r²⟩  = n² [5n² + 1 − 3l(l + 1)] / (2Z²)
 *
 * These depend on n and l only, never on m, so they are the same in the complex
 * and real bases.
 */

/** Bohr energy E_n = −Z²/(2n²) in hartrees. */
export function hydrogenEnergy(n: number, nuclearCharge: number): number {
  return -(nuclearCharge * nuclearCharge) / (2 * n * n);
}

/** ⟨r⟩ in Bohr radii. */
export function hydrogenMeanRadius(n: number, l: number, nuclearCharge: number): number {
  return (3 * n * n - l * (l + 1)) / (2 * nuclearCharge);
}

/** ⟨r²⟩ in Bohr radii squared. */
export function hydrogenMeanSquareRadius(n: number, l: number, nuclearCharge: number): number {
  return (n * n * (5 * n * n + 1 - 3 * l * (l + 1))) / (2 * nuclearCharge * nuclearCharge);
}

/** The root-mean-square radius √⟨r²⟩ in Bohr radii. */
export function hydrogenRmsRadius(n: number, l: number, nuclearCharge: number): number {
  return Math.sqrt(hydrogenMeanSquareRadius(n, l, nuclearCharge));
}
