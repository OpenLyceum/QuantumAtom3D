import { describe, expect, it } from "vitest";
import { hydrogenRadial } from "../../../../src/common/model/hydrogen/HydrogenRadial.js";
import type { ComplexSample } from "../../../../src/common/model/math/sphericalHarmonics.js";
import {
  orbitalTerms,
  realOrbitalSubscript,
  realOrbitalTerms,
} from "../../../../src/common/model/orbital/OrbitalCatalog.js";
import { termsNormSquared } from "../../../../src/common/model/orbital/OrbitalTerm.js";
import { sampleSlice } from "../../../../src/common/model/orbital/SliceSampler.js";
import { Wavefunction } from "../../../../src/common/model/orbital/Wavefunction.js";

const sample: ComplexSample = { re: 0, im: 0 };

/** ∫|ψ|² d³r by the midpoint rule on a cube of half-width `half`. */
function integrateDensity(psi: Wavefunction, half: number, cells = 60): number {
  const h = (2 * half) / cells;
  let sum = 0;
  for (let i = 0; i < cells; i++) {
    for (let j = 0; j < cells; j++) {
      for (let k = 0; k < cells; k++) {
        sum += psi.density(-half + (i + 0.5) * h, -half + (j + 0.5) * h, -half + (k + 0.5) * h, sample);
      }
    }
  }
  return sum * h ** 3;
}

describe("Wavefunction", () => {
  it("1s is spherically symmetric with ψ(0) = Z^{3/2}/√π", () => {
    const psi = new Wavefunction(orbitalTerms(1, 0, 0, "complex"), 2);
    psi.evaluate(0, 0, 0, sample);
    expect(sample.re).toBeCloseTo(2 ** 1.5 / Math.sqrt(Math.PI), 12);
    psi.evaluate(0.3, -0.4, 0, sample);
    const a = sample.re;
    psi.evaluate(0, 0, -0.5, sample);
    expect(sample.re).toBeCloseTo(a, 12);
  });

  it("real p orbitals point along x, y and z", () => {
    const px = new Wavefunction(realOrbitalTerms(2, 1, 1), 1);
    const py = new Wavefunction(realOrbitalTerms(2, 1, -1), 1);
    const pz = new Wavefunction(realOrbitalTerms(2, 1, 0), 1);
    const along = (psi: Wavefunction, x: number, y: number, z: number) => {
      psi.evaluate(x, y, z, sample);
      expect(Math.abs(sample.im)).toBeLessThan(1e-14);
      return sample.re;
    };
    const expected = Math.sqrt(3 / (4 * Math.PI)) * hydrogenRadial(2, 1, 1, 1);
    expect(along(px, 1, 0, 0)).toBeCloseTo(expected, 12);
    expect(along(py, 0, 1, 0)).toBeCloseTo(expected, 12);
    expect(along(pz, 0, 0, 1)).toBeCloseTo(expected, 12);
    expect(along(px, 0, 1, 0)).toBeCloseTo(0, 12);
    expect(along(py, 1, 0, 0)).toBeCloseTo(0, 12);
  });

  it("every real orbital is real-valued and unit-norm in coefficients", () => {
    for (let l = 0; l <= 4; l++) {
      for (let m = -l; m <= l; m++) {
        const terms = realOrbitalTerms(5, l, m);
        expect(termsNormSquared(terms)).toBeCloseTo(1, 14);
        const psi = new Wavefunction(terms, 1);
        for (const [x, y, z] of [
          [0.7, -1.3, 2.1],
          [-2.2, 0.4, -0.9],
        ] as const) {
          psi.evaluate(x, y, z, sample);
          expect(Math.abs(sample.im)).toBeLessThan(1e-14);
        }
        expect(realOrbitalSubscript(l, m)).toBeTypeOf("string");
      }
    }
  });

  it("d_xy is positive where xy > 0 and d_x²−y² is positive on the x-axis", () => {
    const dxy = new Wavefunction(realOrbitalTerms(3, 2, -2), 1);
    dxy.evaluate(1, 1, 0, sample);
    expect(sample.re).toBeGreaterThan(0);
    dxy.evaluate(1, -1, 0, sample);
    expect(sample.re).toBeLessThan(0);
    const dx2y2 = new Wavefunction(realOrbitalTerms(3, 2, 2), 1);
    dx2y2.evaluate(1, 0, 0, sample);
    expect(sample.re).toBeGreaterThan(0);
    dx2y2.evaluate(0, 1, 0, sample);
    expect(sample.re).toBeLessThan(0);
  });

  it("is normalized over space", () => {
    expect(integrateDensity(new Wavefunction(orbitalTerms(2, 1, 1, "complex"), 2), 9)).toBeCloseTo(1, 3);
    expect(integrateDensity(new Wavefunction(orbitalTerms(3, 2, -2, "real"), 3), 8)).toBeCloseTo(1, 3);
  });

  it("complex m ≠ 0 states wind their phase by 2πm around z", () => {
    const psi = new Wavefunction(orbitalTerms(3, 2, 2, "complex"), 1);
    psi.evaluate(1, 0, 0.5, sample);
    const phase0 = Math.atan2(sample.im, sample.re);
    psi.evaluate(0, 1, 0.5, sample); // φ = π/2 → phase advances by mφ = π
    const phase1 = Math.atan2(sample.im, sample.re);
    expect(Math.abs(Math.cos(phase1 - phase0) - Math.cos(Math.PI))).toBeLessThan(1e-12);
  });
});

describe("sampleSlice", () => {
  it("puts the 2p_z nodal plane across the middle row of an xz slice", () => {
    const psi = new Wavefunction(realOrbitalTerms(2, 1, 0), 1);
    const resolution = 33;
    const slice = sampleSlice(psi, "xz", 0, 10, resolution);
    const middle = Math.floor(resolution / 2);
    expect(Math.abs(slice.re[middle * resolution + middle] ?? 1)).toBeLessThan(1e-12);
    expect(slice.re[0 + middle]).toBeGreaterThan(0); // top row is +z
    expect(slice.re[(resolution - 1) * resolution + middle]).toBeLessThan(0);
    expect(slice.maxDensity).toBeGreaterThan(0);
  });

  it("an xy slice of 2p_z through the nucleus is empty", () => {
    const slice = sampleSlice(new Wavefunction(realOrbitalTerms(2, 1, 0), 1), "xy", 0, 10, 16);
    expect(slice.maxDensity).toBeLessThan(1e-25);
  });
});
