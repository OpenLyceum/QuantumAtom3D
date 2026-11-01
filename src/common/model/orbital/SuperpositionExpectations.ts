/** Radial matrix elements by independent Simpson quadrature, with analytic angular selection rules. */
import { hydrogenMeanRadius } from "../hydrogen/HydrogenExpectations.js";
import { hydrogenRadial, hydrogenRadialCutoff } from "../hydrogen/HydrogenRadial.js";
import type { OrbitalTerm } from "./OrbitalTerm.js";

const radialCache = new Map<string, number>();

/** ∫R_nl(r) R_n'l'(r) r³dr for Z=1; other Z scale as 1/Z. */
export function radialPositionElement(a: OrbitalTerm, b: OrbitalTerm): number {
  if (a.n === b.n && a.l === b.l) {
    return hydrogenMeanRadius(a.n, a.l, 1);
  }
  const key = [`${a.n},${a.l}`, `${b.n},${b.l}`].sort((left, right) => left.localeCompare(right)).join(";");
  const cached = radialCache.get(key);
  if (cached !== undefined) {
    return cached;
  }
  const intervals = 4096;
  const limit = Math.max(hydrogenRadialCutoff(a.n, 1), hydrogenRadialCutoff(b.n, 1));
  const step = limit / intervals;
  let sum = 0;
  for (let i = 0; i <= intervals; i++) {
    const r = i * step;
    const weight = i === 0 || i === intervals ? 1 : i % 2 === 0 ? 2 : 4;
    sum += weight * hydrogenRadial(a.n, a.l, 1, r) * hydrogenRadial(b.n, b.l, 1, r) * r ** 3;
  }
  const value = (sum * step) / 3;
  radialCache.set(key, value);
  return value;
}

export function positionExpectations(terms: readonly OrbitalTerm[], nuclearCharge: number): { r: number; z: number } {
  let r = 0;
  let z = 0;
  for (const a of terms) {
    for (const b of terms) {
      if (a.m !== b.m) {
        continue;
      }
      const coherence = a.re * b.re + a.im * b.im;
      if (a.l === b.l) {
        r += (coherence * radialPositionElement(a, b)) / nuclearCharge;
      }
      if (Math.abs(a.l - b.l) === 1) {
        const l = Math.max(a.l, b.l);
        const angular = Math.sqrt((l * l - a.m * a.m) / (4 * l * l - 1));
        z += (coherence * angular * radialPositionElement(a, b)) / nuclearCharge;
      }
    }
  }
  return { r, z };
}
