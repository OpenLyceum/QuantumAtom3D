import { expect, it, vi } from "vitest";
import { MetropolisSampler } from "../../../../src/common/model/orbital/MetropolisSampler.js";
import { SUPERPOSITION_PRESETS } from "../../../../src/common/model/orbital/SuperpositionPresets.js";
import { Wavefunction } from "../../../../src/common/model/orbital/Wavefunction.js";
import { cartesianPeakDensity } from "../../../../src/common/model/oscillator/OscillatorStates.js";

it("incremental Metropolis sweeps produce exactly the same seeded samples as synchronous sweeps", () => {
  const terms = SUPERPOSITION_PRESETS.dipole;
  const wave = new Wavefunction(terms, 1);
  const reference = new MetropolisSampler(terms, 1, 300, 173).update(wave, 3);
  const sampler = new MetropolisSampler(terms, 1, 300, 173);
  sampler.begin(wave, 3);
  let clock = 0;
  const now = vi.spyOn(performance, "now").mockImplementation(() => ++clock);
  expect(sampler.advance(1)).toBeNull();
  let result: Float32Array | null = null;
  while (!result) {
    result = sampler.advance(1);
  }
  now.mockRestore();
  expect(result).toEqual(reference);
  sampler.begin(wave, 16);
  sampler.cancel();
  expect(sampler.advance()).toBeNull();
});
it("separable Cartesian peaks agree with analytic ground and first-excited oscillator maxima", () => {
  expect(cartesianPeakDensity([0, 0, 0])).toBeCloseTo(Math.PI ** -1.5, 12);
  expect(cartesianPeakDensity([1, 0, 0])).toBeCloseTo(2 / (Math.E * Math.PI ** 1.5), 6);
});
