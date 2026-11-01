import { describe, expect, it } from "vitest";
import {
  buildDensityGrid,
  enclosedProbabilityLevel,
} from "../../../../src/common/model/orbital/EnclosedProbability.js";
import { orbitalTerms } from "../../../../src/common/model/orbital/OrbitalCatalog.js";
import { sampleEigenstate } from "../../../../src/common/model/orbital/ProbabilitySampler.js";
import { Wavefunction } from "../../../../src/common/model/orbital/Wavefunction.js";

describe("probability point samples", () => {
  it.each([
    [1, 0, 0, 1],
    [3, 2, -2, 1],
    [5, 4, 2, 6],
  ])("reproduces analytic mean r for n=%i,l=%i,m=%i,Z=%i", (n, l, m, z) => {
    const count = 24000;
    const points = sampleEigenstate(n, l, m, "complex", z, count, 317);
    let sum = 0;
    for (let i = 0; i < points.length; i += 3) {
      sum += Math.hypot(points[i] ?? 0, points[i + 1] ?? 0, points[i + 2] ?? 0);
    }
    const mean = (3 * n * n - l * (l + 1)) / (2 * z);
    const second = (n * n * (5 * n * n + 1 - 3 * l * (l + 1))) / (2 * z * z);
    expect(Math.abs(sum / count - mean)).toBeLessThan(3 * Math.sqrt((second - mean * mean) / count));
  });
  it("is reproducible, with p_x points distributed preferentially along x", () => {
    const points = sampleEigenstate(2, 1, 1, "real", 1, 12000, 15);
    expect(sampleEigenstate(2, 1, 1, "real", 1, 12000, 15)).toEqual(points);
    let xx = 0;
    let yy = 0;
    let zz = 0;
    for (let i = 0; i < points.length; i += 3) {
      xx += (points[i] ?? 0) ** 2;
      yy += (points[i + 1] ?? 0) ** 2;
      zz += (points[i + 2] ?? 0) ** 2;
    }
    expect(xx / yy).toBeCloseTo(3, 0);
    expect(xx / zz).toBeCloseTo(3, 0);
  });
});

describe("highest-density enclosed probability", () => {
  it.each([0.9, 0.95])("matches the analytic 1s cumulative probability at fraction %f", (fraction) => {
    const wavefunction = new Wavefunction(orbitalTerms(1, 0, 0, "complex"), 1);
    const grid = buildDensityGrid(wavefunction, 7, 64);
    expect(grid.totalProbability).toBeCloseTo(1, 2);
    const level = enclosedProbabilityLevel(grid, fraction);
    const r = -Math.log(Math.PI * level) / 2;
    const exact = 1 - Math.exp(-2 * r) * (1 + 2 * r + 2 * r * r);
    expect(Math.abs(exact - fraction)).toBeLessThan(0.006);
  });
});
