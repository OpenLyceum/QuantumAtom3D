import { realOrbitalTerms } from "./OrbitalCatalog.js";
import type { OrbitalTerm } from "./OrbitalTerm.js";
import { normalizeTerms } from "./SuperpositionState.js";

/** One normalized sp^k hybrid in the direction of a unit vector, k=1,2,3. */
export function hybridTerms(k: number, direction: readonly [number, number, number]): OrbitalTerm[] {
  const terms: OrbitalTerm[] = [{ n: 2, l: 0, m: 0, re: 1 / Math.sqrt(k + 1), im: 0 }];
  for (const [index, m] of [1, -1, 0].entries()) {
    const weight = Math.sqrt(k / (k + 1)) * (direction[index] ?? 0);
    terms.push(...realOrbitalTerms(2, 1, m).map((term) => ({ ...term, re: weight * term.re, im: weight * term.im })));
  }
  return normalizeTerms(terms);
}

const pair = (a: readonly [number, number, number], b: readonly [number, number, number]) =>
  normalizeTerms([a, b].map(([n, l, m]) => ({ n, l, m, re: 1, im: 0 })));

export const SUPERPOSITION_PRESETS = {
  dipole: pair([1, 0, 0], [2, 1, 0]),
  breathing: pair([1, 0, 0], [2, 0, 0]),
  rotating: pair([2, 1, 1], [3, 2, 2]),
  sp: hybridTerms(1, [0, 0, 1]),
  sp2: hybridTerms(2, [1, 0, 0]),
  sp3: hybridTerms(3, [1 / Math.sqrt(3), 1 / Math.sqrt(3), 1 / Math.sqrt(3)]),
} as const;
export type SuperpositionPreset = keyof typeof SUPERPOSITION_PRESETS;
