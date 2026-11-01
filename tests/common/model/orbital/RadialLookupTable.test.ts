import { describe, expect, it } from "vitest";
import { hydrogenRadial, hydrogenRadialCutoff } from "../../../../src/common/model/hydrogen/HydrogenRadial.js";
import { orbitalTerms } from "../../../../src/common/model/orbital/OrbitalCatalog.js";
import { peakDensity } from "../../../../src/common/model/orbital/PeakDensity.js";
import { RadialLookupTable, radialRowIndex } from "../../../../src/common/model/orbital/RadialLookupTable.js";
import { Wavefunction } from "../../../../src/common/model/orbital/Wavefunction.js";

describe("RadialLookupTable", () => {
  const table = new RadialLookupTable();

  it("has one row per (n, l) with n ≤ 5", () => {
    expect(table.rowCount).toBe(15);
    expect(radialRowIndex(1, 0)).toBe(0);
    expect(radialRowIndex(5, 4)).toBe(14);
  });

  it("interpolates R_nl to within 1e-3 of its peak, for any Z", () => {
    for (let n = 1; n <= 5; n++) {
      for (let l = 0; l < n; l++) {
        for (const Z of [1, 2, 6]) {
          const cutoff = hydrogenRadialCutoff(n, Z);
          let worst = 0;
          let scale = 0;
          for (let i = 0; i < 3000; i++) {
            const r = (cutoff * i) / 3000;
            const exact = hydrogenRadial(n, l, Z, r);
            scale = Math.max(scale, Math.abs(exact));
            worst = Math.max(worst, Math.abs(table.evaluate(n, l, Z, r) - exact));
          }
          expect(worst / scale).toBeLessThan(1e-3);
        }
      }
    }
  });

  it("is zero beyond the cutoff", () => {
    expect(table.evaluate(2, 1, 1, hydrogenRadialCutoff(2, 1) * 1.01)).toBe(0);
  });
});

describe("peakDensity", () => {
  it("is Z³/π for 1s, at the nucleus", () => {
    expect(peakDensity(new Wavefunction(orbitalTerms(1, 0, 0, "complex"), 2))).toBeCloseTo(8 / Math.PI, 10);
  });

  it("matches the analytic 2p_z peak: max R² at r = 2/Z times 3/(4π)", () => {
    const Z = 1;
    const radial = hydrogenRadial(2, 1, Z, 2 / Z);
    const expected = radial * radial * (3 / (4 * Math.PI));
    expect(peakDensity(new Wavefunction(orbitalTerms(2, 1, 0, "real"), Z))).toBeCloseTo(expected, 6);
  });

  it("falls back to a grid for mixed terms and never undershoots much", () => {
    const mixed = new Wavefunction(
      [
        { n: 1, l: 0, m: 0, re: Math.SQRT1_2, im: 0 },
        { n: 2, l: 1, m: 0, re: Math.SQRT1_2, im: 0 },
      ],
      1,
    );
    const peak = peakDensity(mixed);
    // ψ(0) = R_10(0) Y_00 / √2 is a lower bound on the peak.
    expect(peak).toBeGreaterThanOrEqual(0.5 * (4 / (4 * Math.PI)) * 0.999);
  });
});
