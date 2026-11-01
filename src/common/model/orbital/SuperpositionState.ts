/** Normalized coherent hydrogenic states and their relative dynamical phases. */
import { hydrogenEnergy } from "../hydrogen/HydrogenExpectations.js";
import type { OrbitalTerm } from "./OrbitalTerm.js";

/** Combine duplicate basis states before normalizing; a cancelling state remains empty. */
export function normalizeTerms(input: readonly OrbitalTerm[]): OrbitalTerm[] {
  const combined = new Map<string, OrbitalTerm>();
  for (const term of input) {
    const key = `${term.n},${term.l},${term.m}`;
    const previous = combined.get(key);
    combined.set(key, { ...term, re: term.re + (previous?.re ?? 0), im: term.im + (previous?.im ?? 0) });
  }
  const terms = [...combined.values()].filter((term) => term.re ** 2 + term.im ** 2 > 1e-24);
  const norm = Math.sqrt(terms.reduce((sum, term) => sum + term.re ** 2 + term.im ** 2, 0));
  return norm > 0 ? terms.map((term) => ({ ...term, re: term.re / norm, im: term.im / norm })) : [];
}

/** Remove the common phase: stationary degenerate hybrids keep a stationary phase-colour map. */
export function evolveTerms(terms: readonly OrbitalTerm[], nuclearCharge: number, time: number): OrbitalTerm[] {
  const reference = terms[0];
  if (!reference) {
    return [];
  }
  const energy = hydrogenEnergy(reference.n, nuclearCharge);
  return terms.map((term) => {
    const phase = -((hydrogenEnergy(term.n, nuclearCharge) - energy) * time) % (2 * Math.PI);
    const c = Math.cos(phase);
    const s = Math.sin(phase);
    return { ...term, re: term.re * c - term.im * s, im: term.re * s + term.im * c };
  });
}

/** Electric dipole selection rule for some polarization; z polarization additionally needs Δm=0. */
export function dipoleAllowed(a: OrbitalTerm, b: OrbitalTerm): boolean {
  return Math.abs(a.l - b.l) === 1 && Math.abs(a.m - b.m) <= 1;
}
