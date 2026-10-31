import { describe, expect, it } from "vitest";
import {
  hydrogenEnergy,
  hydrogenMeanRadius,
  hydrogenMeanSquareRadius,
} from "../../../../src/common/model/hydrogen/HydrogenExpectations.js";
import {
  hydrogenEnclosingRadius,
  hydrogenMostProbableRadius,
  hydrogenRadial,
  hydrogenRadialCutoff,
  hydrogenRadialDistribution,
  hydrogenRadialNodes,
} from "../../../../src/common/model/hydrogen/HydrogenRadial.js";

/** ∫₀^cutoff g(r) dr by Simpson's rule. */
function integrateRadial(g: (r: number) => number, cutoff: number, intervals = 20000): number {
  const h = cutoff / intervals;
  let sum = g(0) + g(cutoff);
  for (let i = 1; i < intervals; i++) {
    sum += (i % 2 === 1 ? 4 : 2) * g(i * h);
  }
  return (sum * h) / 3;
}

const states: [number, number][] = [];
for (let n = 1; n <= 5; n++) {
  for (let l = 0; l < n; l++) {
    states.push([n, l]);
  }
}

describe("hydrogenRadial", () => {
  it("matches the closed forms for 1s, 2s and 2p", () => {
    for (const Z of [1, 3]) {
      const r = 0.8;
      expect(hydrogenRadial(1, 0, Z, r)).toBeCloseTo(2 * Z ** 1.5 * Math.exp(-Z * r), 12);
      expect(hydrogenRadial(2, 0, Z, r)).toBeCloseTo(
        (1 / (2 * Math.SQRT2)) * Z ** 1.5 * (2 - Z * r) * Math.exp((-Z * r) / 2),
        12,
      );
      expect(hydrogenRadial(2, 1, Z, r)).toBeCloseTo(
        (1 / (2 * Math.sqrt(6))) * Z ** 2.5 * r * Math.exp((-Z * r) / 2),
        12,
      );
    }
  });

  it("is normalized for every state with n ≤ 5", () => {
    for (const [n, l] of states) {
      const cutoff = hydrogenRadialCutoff(n, 2);
      const norm = integrateRadial((r) => hydrogenRadialDistribution(n, l, 2, r), 2 * cutoff);
      expect(norm).toBeCloseTo(1, 8);
      // The model's cutoff itself leaves less than 1e-6 of the probability outside.
      const inside = integrateRadial((r) => hydrogenRadialDistribution(n, l, 2, r), cutoff);
      expect(1 - inside).toBeLessThan(1e-6);
    }
  });

  it("reproduces the closed-form ⟨r⟩ and ⟨r²⟩", () => {
    for (const [n, l] of states) {
      // Twice the model's cutoff: r and r² weight the tail beyond it.
      const cutoff = 2 * hydrogenRadialCutoff(n, 1);
      const mean = integrateRadial((r) => r * hydrogenRadialDistribution(n, l, 1, r), cutoff);
      const meanSquare = integrateRadial((r) => r * r * hydrogenRadialDistribution(n, l, 1, r), cutoff);
      expect(mean).toBeCloseTo(hydrogenMeanRadius(n, l, 1), 6);
      expect(meanSquare).toBeCloseTo(hydrogenMeanSquareRadius(n, l, 1), 4);
    }
  });

  it("has n − l − 1 radial nodes where R vanishes", () => {
    for (const [n, l] of states) {
      const nodes = hydrogenRadialNodes(n, l, 1);
      expect(nodes).toHaveLength(n - l - 1);
      for (const r of nodes) {
        expect(Math.abs(hydrogenRadial(n, l, 1, r))).toBeLessThan(1e-10);
      }
    }
    // 2s node at r = 2 a0/Z; 3s nodes at (9 ∓ 3√3)/2 · a0/Z.
    expect(hydrogenRadialNodes(2, 0, 1)[0]).toBeCloseTo(2, 10);
    expect(hydrogenRadialNodes(2, 0, 4)[0]).toBeCloseTo(0.5, 10);
    const threeS = hydrogenRadialNodes(3, 0, 1);
    expect(threeS[0]).toBeCloseTo((9 - 3 * Math.sqrt(3)) / 2, 9);
    expect(threeS[1]).toBeCloseTo((9 + 3 * Math.sqrt(3)) / 2, 9);
  });

  it("peaks at r = n²/Z for l = n − 1 (the Bohr radii)", () => {
    for (let n = 1; n <= 5; n++) {
      expect(hydrogenMostProbableRadius(n, n - 1, 1)).toBeCloseTo(n * n, 6);
      expect(hydrogenMostProbableRadius(n, n - 1, 2)).toBeCloseTo((n * n) / 2, 6);
    }
  });

  it("finds the 1s enclosing radius from 1 − e^{−2R}(1 + 2R + 2R²)", () => {
    const enclosed = (R: number) => 1 - Math.exp(-2 * R) * (1 + 2 * R + 2 * R * R);
    for (const fraction of [0.5, 0.9, 0.99]) {
      const R = hydrogenEnclosingRadius(1, 0, 1, fraction);
      expect(enclosed(R)).toBeCloseTo(fraction, 6);
    }
    expect(hydrogenEnclosingRadius(1, 0, 2, 0.9)).toBeCloseTo(hydrogenEnclosingRadius(1, 0, 1, 0.9) / 2, 5);
  });
});

describe("hydrogenEnergy", () => {
  it("is −Z²/(2n²) hartree", () => {
    expect(hydrogenEnergy(1, 1)).toBe(-0.5);
    expect(hydrogenEnergy(2, 2)).toBe(-0.5);
    expect(hydrogenEnergy(3, 1)).toBeCloseTo(-1 / 18, 15);
  });
});
