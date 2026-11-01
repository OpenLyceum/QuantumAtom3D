import { describe, expect, it } from "vitest";
import {
  atomicFieldToTesla,
  FINE_STRUCTURE_CONSTANT,
  teslaToAtomicField,
  wavelengthNmForEnergy,
} from "../../../../src/common/model/AtomicUnits.js";
import {
  diracEnergy,
  distinctPhotonEnergies,
  landeG,
  weakFieldCap,
  zeemanLevels,
  zeemanTransitions,
} from "../../../../src/common/model/angular/ZeemanLevels.js";

describe("fine-structure Zeeman physics", () => {
  it("has textbook Landé factors", () => {
    expect(landeG(1, 0.5)).toBeCloseTo(2 / 3, 14);
    expect(landeG(1, 1.5)).toBeCloseTo(4 / 3, 14);
    expect(landeG(0, 0.5)).toBe(2);
  });
  it("has the exact Dirac 1s energy and leading-order 2p splitting", () => {
    const a = FINE_STRUCTURE_CONSTANT;
    expect(diracEnergy(1, 0.5, 1)).toBeCloseTo(-1 / (1 + Math.sqrt(1 - a * a)), 13);
    expect((diracEnergy(2, 1.5, 1) - diracEnergy(2, 0.5, 1)) / ((a * a) / 32)).toBeCloseTo(1, 3);
  });
  it("gives a normal triplet for Halpha and Lyman alpha, and removes pi along B", () => {
    for (const [upper, lower] of [
      [3, 2],
      [2, 1],
    ]) {
      const levels = zeemanLevels(upper ?? 3, 1, teslaToAtomicField(0.5), "normal");
      const base = zeemanLevels(lower ?? 2, 1, teslaToAtomicField(0.5), "normal");
      expect(distinctPhotonEnergies(zeemanTransitions(levels, base, "normal"))).toHaveLength(3);
      const along = zeemanTransitions(levels, base, "normal", true);
      expect(along.every((t) => t.polarization !== "pi")).toBe(true);
      expect(distinctPhotonEnergies(along)).toHaveLength(2);
    }
  });
  it("gives ten anomalous Lyman-alpha positions and the correct sigma wavelength scale", () => {
    const field = teslaToAtomicField(0.01);
    expect(
      distinctPhotonEnergies(
        zeemanTransitions(zeemanLevels(2, 1, field, "anomalous"), zeemanLevels(1, 1, field, "anomalous"), "anomalous"),
      ),
    ).toHaveLength(10);
    const photon = 5 / 72;
    const shift = wavelengthNmForEnergy(photon) - wavelengthNmForEnergy(photon + teslaToAtomicField(1) / 2);
    expect(shift).toBeCloseTo(0.0201, 4);
  });
  it("caps the fine-structure perturbation conservatively and scales approximately as Z^4", () => {
    const cap = weakFieldCap(3, 2, 1);
    expect(atomicFieldToTesla(cap)).toBeLessThan(0.01);
    expect(weakFieldCap(3, 2, 2) / cap).toBeCloseTo(16, 1);
    expect(atomicFieldToTesla(teslaToAtomicField(1))).toBeCloseTo(1, 14);
  });
});
