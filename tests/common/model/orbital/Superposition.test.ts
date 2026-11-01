import { describe, expect, it } from "vitest";
import { atomicTimeToFs } from "../../../../src/common/model/AtomicUnits.js";
import { MetropolisSampler } from "../../../../src/common/model/orbital/MetropolisSampler.js";
import type { OrbitalTerm } from "../../../../src/common/model/orbital/OrbitalTerm.js";
import { positionExpectations } from "../../../../src/common/model/orbital/SuperpositionExpectations.js";
import { hybridTerms, SUPERPOSITION_PRESETS } from "../../../../src/common/model/orbital/SuperpositionPresets.js";
import { dipoleAllowed, evolveTerms, normalizeTerms } from "../../../../src/common/model/orbital/SuperpositionState.js";
import { Wavefunction } from "../../../../src/common/model/orbital/Wavefunction.js";
import { SuperpositionModel } from "../../../../src/superposition/model/SuperpositionModel.js";

function overlap(a: readonly OrbitalTerm[], b: readonly OrbitalTerm[]): number {
  return a.reduce(
    (sum, term) =>
      sum +
      b
        .filter((other) => other.n === term.n && other.l === term.l && other.m === term.m)
        .reduce((value, other) => value + term.re * other.re + term.im * other.im, 0),
    0,
  );
}

describe("coherent hydrogenic states", () => {
  it("combines duplicate coefficients before normalization, including complete cancellation", () => {
    const a = { n: 1, l: 0, m: 0, re: 1, im: 0 };
    expect(normalizeTerms([a, a])).toEqual([a]);
    expect(normalizeTerms([a, { ...a, re: -1 }])).toEqual([]);
  });
  it("conserves norm and makes degenerate hybrids stationary, even at long times", () => {
    for (const terms of Object.values(SUPERPOSITION_PRESETS)) {
      for (const time of [0, 100, 1e8]) {
        expect(overlap(evolveTerms(terms, 6, time), evolveTerms(terms, 6, time))).toBeCloseTo(1, 12);
      }
    }
    expect(evolveTerms(SUPERPOSITION_PRESETS.sp3, 1, 1e8)).toEqual(SUPERPOSITION_PRESETS.sp3);
  });
  it("sp, sp² and sp³ families are orthonormal", () => {
    const families = [
      {
        k: 1,
        directions: [
          [0, 0, 1],
          [0, 0, -1],
        ],
      },
      {
        k: 2,
        directions: [
          [1, 0, 0],
          [-0.5, Math.sqrt(3) / 2, 0],
          [-0.5, -Math.sqrt(3) / 2, 0],
        ],
      },
      {
        k: 3,
        directions: [
          [1, 1, 1],
          [1, -1, -1],
          [-1, 1, -1],
          [-1, -1, 1],
        ].map((v) => v.map((x) => x / Math.sqrt(3))),
      },
    ];
    for (const { k, directions } of families) {
      const hybrids = directions.map((v) => hybridTerms(k, [v[0] ?? 0, v[1] ?? 0, v[2] ?? 0]));
      hybrids.forEach((a, i) => {
        hybrids.forEach((b, j) => {
          expect(overlap(a, b)).toBeCloseTo(i === j ? 1 : 0, 12);
        });
      });
    }
  });
  it("1s+2p_z has the analytic dipole amplitude and Bohr period", () => {
    const period = (2 * Math.PI) / (3 / 8);
    expect(atomicTimeToFs(period)).toBeCloseTo(0.4053, 4);
    for (const fraction of [0, 0.125, 0.25, 0.5, 1]) {
      const result = positionExpectations(evolveTerms(SUPERPOSITION_PRESETS.dipole, 1, fraction * period), 1);
      expect(result.z).toBeCloseTo((256 / (243 * Math.sqrt(2))) * Math.cos(2 * Math.PI * fraction), 7);
      expect(result.r).toBeCloseTo(3.25, 9);
    }
  });
  it("1s+2s breathes without an electric dipole, and lengths scale as 1/Z", () => {
    const result = positionExpectations(SUPERPOSITION_PRESETS.breathing, 1);
    expect(result.r).toBeCloseTo(3.75 - 64 / (81 * Math.sqrt(2)), 7);
    expect(result.z).toBe(0);
    expect(positionExpectations(SUPERPOSITION_PRESETS.breathing, 6).r).toBeCloseTo(result.r / 6, 10);
    const [a, b] = SUPERPOSITION_PRESETS.breathing;
    expect(a && b && dipoleAllowed(a, b)).toBe(false);
  });
  it("playback pauses, single-step advances, and reset restores the dipole state", () => {
    const model = new SuperpositionModel();
    model.step(1);
    expect(model.timeProperty.value).toBe(0);
    model.advance(0.1);
    expect(model.timeProperty.value).toBeCloseTo(0.4);
    model.timer.isPlayingProperty.value = true;
    model.step(1);
    expect(model.timeProperty.value).toBeCloseTo(4.4);
    model.loadPreset("sp3");
    expect(model.timer.isPlayingProperty.value).toBe(false);
    model.reset();
    expect(model.timeProperty.value).toBe(0);
    expect(model.termsProperty.value).toEqual(SUPERPOSITION_PRESETS.dipole);
    model.dispose();
  });
  it("Metropolis samples follow the coherent dipole density before and after phase reversal", () => {
    const count = 12000;
    const terms = SUPERPOSITION_PRESETS.dipole;
    const sampler = new MetropolisSampler(terms, 1, count, 173);
    for (const time of [0, Math.PI / (3 / 8)]) {
      const wave = new Wavefunction(evolveTerms(terms, 1, time), 1);
      const points = sampler.update(wave, 16);
      let meanR = 0;
      let meanZ = 0;
      for (let i = 0; i < points.length; i += 3) {
        meanR += Math.hypot(points[i] ?? 0, points[i + 1] ?? 0, points[i + 2] ?? 0) / count;
        meanZ += (points[i + 2] ?? 0) / count;
      }
      expect(Math.abs(meanR - 3.25)).toBeLessThan(3 * Math.sqrt((16.5 - 3.25 ** 2) / count));
      const expectedZ = (256 / (243 * Math.sqrt(2))) * Math.cos((3 / 8) * time);
      expect(Math.abs(meanZ - expectedZ)).toBeLessThan(3 * Math.sqrt((9.5 - expectedZ ** 2) / count));
    }
  });
});
