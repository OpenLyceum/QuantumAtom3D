import { describe, expect, it } from "vitest";
import { Wavefunction } from "../../../../src/common/model/orbital/Wavefunction.js";
import {
  cartesianExpansion,
  cartesianStates,
  cartesianWavefunction,
  oscillatorDegeneracy,
  oscillatorRadial,
  sphericalStates,
} from "../../../../src/common/model/oscillator/OscillatorStates.js";

describe("isotropic oscillator bases", () => {
  it("counts both complete bases and normalizes spherical radial states", () => {
    for (let N = 0; N <= 4; N++) {
      expect(cartesianStates(N)).toHaveLength(oscillatorDegeneracy(N));
      expect(sphericalStates(N)).toHaveLength(oscillatorDegeneracy(N));
      for (const state of sphericalStates(N).filter((s) => s.m === 0)) {
        let norm = 0;
        const h = 9 / 4000;
        for (let i = 0; i <= 4000; i++) {
          const r = i * h;
          norm +=
            (i === 0 || i === 4000 ? 1 : i % 2 === 0 ? 2 : 4) * oscillatorRadial(state.nr, state.l, r) ** 2 * r * r;
        }
        expect((norm * h) / 3).toBeCloseTo(1, 10);
      }
    }
  });
  it("has a unitary Cartesian-spherical overlap matrix in every shell", () => {
    for (let N = 0; N <= 4; N++) {
      const expansions = cartesianStates(N).map(cartesianExpansion);
      expansions.forEach((a, i) => {
        expansions.forEach((b, j) => {
          let re = 0,
            im = 0;
          for (const term of a) {
            const other = b.find((t) => t.n === term.n && t.l === term.l && t.m === term.m);
            if (other) {
              re += term.re * other.re + term.im * other.im;
              im += term.re * other.im - term.im * other.re;
            }
          }
          expect(re).toBeCloseTo(i === j ? 1 : 0, 11);
          expect(im).toBeCloseTo(0, 11);
        });
      });
    }
  });
  it("matches direct Hermite products at independent points, including the nine-term N=4 state", () => {
    expect(cartesianExpansion([4, 0, 0])).toHaveLength(9);
    const sample = { re: 0, im: 0 };
    for (let N = 0; N <= 4; N++) {
      for (const state of cartesianStates(N)) {
        const wave = new Wavefunction(cartesianExpansion(state), 1, "oscillator");
        for (const [x, y, z] of [
          [0, 0, 0],
          [0.3, -0.7, 1.1],
          [-1.3, 0.4, 0.8],
          [2, 1, -0.5],
        ]) {
          wave.evaluate(x ?? 0, y ?? 0, z ?? 0, sample);
          expect(sample.re).toBeCloseTo(cartesianWavefunction(state, x ?? 0, y ?? 0, z ?? 0), 11);
          expect(sample.im).toBeCloseTo(0, 11);
        }
      }
    }
  });
});
