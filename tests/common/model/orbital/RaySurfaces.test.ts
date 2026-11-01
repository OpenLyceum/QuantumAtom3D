import { describe, expect, it } from "vitest";
import { nodalSurfaces } from "../../../../src/common/model/orbital/NodalSurfaces.js";
import { orbitalTerms } from "../../../../src/common/model/orbital/OrbitalCatalog.js";
import { nodalRayHits, planeHit } from "../../../../src/common/model/orbital/RaySurfaces.js";
import { Wavefunction } from "../../../../src/common/model/orbital/Wavefunction.js";

describe("analytic nodal ray intersections", () => {
  it("crosses the 2s node at r=2 on both sides of the nucleus", () => {
    expect(nodalRayHits([0, 0, 0], [1, 0, 0], nodalSurfaces(2, 0, 0, 1, "complex"), 10)).toEqual([-2, 2]);
  });
  it("keeps each 3d z² cone on its own side of the xy plane", () => {
    const nodes = nodalSurfaces(3, 2, 0, 1, "complex");
    const hits = nodalRayHits([1, 0, 0], [0, 0, 1], nodes, 10);
    expect(hits).toHaveLength(2);
    expect(hits[0]).toBeCloseTo(-1 / Math.sqrt(2), 8);
    expect(hits[1]).toBeCloseTo(1 / Math.sqrt(2), 8);
  });
  it("all hits lie on zeros of the independently evaluated wavefunction", () => {
    for (const [n, l, m] of [
      [5, 2, 1],
      [5, 3, -2],
      [5, 4, 0],
    ] as const) {
      const wave = new Wavefunction(orbitalTerms(n, l, m, "real"), 1);
      const hits = nodalRayHits([0, 1, 2], [1, 0, 0], nodalSurfaces(n, l, m, 1, "real"), 100);
      expect(hits.length).toBeGreaterThan(0);
      for (const t of hits) {
        expect(wave.density(t, 1, 2, { re: 0, im: 0 })).toBeLessThan(1e-16);
      }
    }
  });
  it("handles parallel and offset cutting planes", () => {
    expect(planeHit([0, 0, 0], [1, 0, 0], [0, 0, 1], 2)).toBeNull();
    expect(planeHit([0, 0, 0], [0, 0, 1], [0, 0, 1], 2)).toBe(2);
  });
});
