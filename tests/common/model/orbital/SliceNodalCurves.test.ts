import { describe, expect, it } from "vitest";
import type { ComplexSample } from "../../../../src/common/model/math/sphericalHarmonics.js";
import { nodalSurfaces } from "../../../../src/common/model/orbital/NodalSurfaces.js";
import { type OrbitalBasis, orbitalTerms } from "../../../../src/common/model/orbital/OrbitalCatalog.js";
import {
  type SliceCurve,
  type SlicePoint,
  sliceNodalCurves,
} from "../../../../src/common/model/orbital/SliceNodalCurves.js";
import { SLICE_PLANE_VALUES, sampleSlice, slicePoint } from "../../../../src/common/model/orbital/SliceSampler.js";
import { Wavefunction } from "../../../../src/common/model/orbital/Wavefunction.js";

const sample: ComplexSample = { re: 0, im: 0 };

const cases: [number, number, number, OrbitalBasis][] = [
  [3, 2, 0, "real"],
  [3, 2, 1, "real"],
  [3, 2, -2, "real"],
  [4, 3, 2, "real"],
  [4, 1, 0, "complex"],
  [5, 2, 1, "complex"],
];

/**
 * The points of a curve to test. Straight lines come as two far endpoints, so
 * they are sampled along their length. Sampled curves (circles, hyperbolas)
 * are tested at their own vertices only, because their chords cut corners.
 */
function testPoints(curve: SliceCurve): SlicePoint[] {
  if (curve.length > 2) {
    return [...curve];
  }
  const [u0, v0] = curve[0] ?? [0, 0];
  const [u1, v1] = curve[1] ?? [0, 0];
  const points: SlicePoint[] = [];
  for (let k = 0; k <= 10; k++) {
    points.push([u0 + ((u1 - u0) * k) / 10, v0 + ((v1 - v0) * k) / 10]);
  }
  return points;
}

describe("sliceNodalCurves", () => {
  it("every curve point lies where ψ vanishes", () => {
    const extent = 30;
    for (const [n, l, m, basis] of cases) {
      const psi = new Wavefunction(orbitalTerms(n, l, m, basis), 1);
      const nodes = nodalSurfaces(n, l, m, 1, basis);
      for (const plane of SLICE_PLANE_VALUES) {
        for (const offset of [0, 1.7, -3.1]) {
          const peak = sampleSlice(psi, plane, offset, extent, 48).maxDensity;
          const points = sliceNodalCurves(nodes, plane, offset, extent)
            .flatMap(testPoints)
            .filter(([u, v]) => Math.abs(u) <= extent && Math.abs(v) <= extent);
          for (const [u, v] of peak > 1e-12 ? points : []) {
            const [x, y, z] = slicePoint(plane, u, v, offset);
            expect(psi.density(x, y, z, sample) / peak).toBeLessThan(1e-12);
          }
        }
      }
    }
  });

  it("draws the 2s node as a circle of radius 2 a0 through the nucleus", () => {
    const curves = sliceNodalCurves(nodalSurfaces(2, 0, 0, 1, "complex"), "xz", 0, 10);
    expect(curves).toHaveLength(1);
    const [u, v] = curves[0]?.[0] ?? [0, 0];
    expect(Math.hypot(u, v)).toBeCloseTo(2, 9);
    expect(sliceNodalCurves(nodalSurfaces(2, 0, 0, 1, "complex"), "xz", 2.5, 10)).toHaveLength(0);
  });
});
