import { describe, expect, it } from "vitest";
import {
  allowedJ,
  angularMagnitude,
  coupledAngularWeights,
  coupledVectors,
  orbitalUncertaintyProduct,
  orbitalVector,
} from "../../../../src/common/model/angular/VectorModel.js";

describe("angular quantum vector geometry", () => {
  it("preserves orbital length, projection and the uncertainty bound", () => {
    for (let l = 0; l <= 4; l++) {
      for (let m = -l; m <= l; m++) {
        const vector = orbitalVector(l, m, 0.73);
        expect(Math.hypot(...vector)).toBeCloseTo(angularMagnitude(l), 12);
        expect(vector[2]).toBe(m);
        expect(orbitalUncertaintyProduct(l, m)).toBeGreaterThanOrEqual(Math.abs(m) / 2);
      }
    }
  });
  it("closes L+S=J and preserves all magnitudes at every allowed j,mj", () => {
    for (let l = 0; l <= 4; l++) {
      for (const j of allowedJ(l)) {
        for (let mj = -j; mj <= j; mj++) {
          for (const phase of [0, 0.47, 2.1]) {
            const { orbital: L, spin: S, total: J } = coupledVectors(l, j, mj, phase, 2 * phase);
            expect(Math.hypot(...L)).toBeCloseTo(angularMagnitude(l), 11);
            expect(Math.hypot(...S)).toBeCloseTo(Math.sqrt(0.75), 11);
            expect(Math.hypot(...J)).toBeCloseTo(angularMagnitude(j), 11);
            expect(J[2]).toBeCloseTo(mj, 12);
            J.forEach((value, index) => {
              expect((L[index] ?? 0) + (S[index] ?? 0)).toBeCloseTo(value, 12);
            });
          }
          expect(coupledAngularWeights(l, j, mj).reduce((sum, entry) => sum + entry.weight, 0)).toBeCloseTo(1, 12);
        }
      }
    }
  });
  it("has the known p_1/2,mj=1/2 spin probabilities", () => {
    expect(coupledAngularWeights(1, 0.5, 0.5)[0]?.weight).toBeCloseTo(1 / 3, 12);
  });
});
