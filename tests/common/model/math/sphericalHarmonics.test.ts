import { describe, expect, it } from "vitest";
import {
  type ComplexSample,
  sphericalHarmonic,
  sphericalHarmonicTheta,
} from "../../../../src/common/model/math/sphericalHarmonics.js";

/**
 * ∫ f dΩ: Simpson's rule in θ (smooth, O(h⁴)) and the rectangle rule in φ (exact
 * for these trigonometric polynomials, being periodic).
 */
function integrateSphere(f: (theta: number, phi: number) => number, steps = 200): number {
  const dTheta = Math.PI / steps;
  const phiSteps = 2 * steps;
  const dPhi = (2 * Math.PI) / phiSteps;
  let sum = 0;
  for (let i = 0; i <= steps; i++) {
    const theta = i * dTheta;
    const weight = i === 0 || i === steps ? 1 : i % 2 === 1 ? 4 : 2;
    let ring = 0;
    for (let j = 0; j < phiSteps; j++) {
      ring += f(theta, j * dPhi);
    }
    sum += weight * ring * Math.sin(theta);
  }
  return ((sum * dTheta) / 3) * dPhi;
}

const states: [number, number][] = [];
for (let l = 0; l <= 4; l++) {
  for (let m = -l; m <= l; m++) {
    states.push([l, m]);
  }
}

describe("sphericalHarmonicTheta", () => {
  it("matches closed forms with the Condon–Shortley phase", () => {
    const x = 0.3;
    const s = Math.sqrt(1 - x * x);
    expect(sphericalHarmonicTheta(0, 0, x)).toBeCloseTo(1 / Math.sqrt(4 * Math.PI), 12);
    expect(sphericalHarmonicTheta(1, 0, x)).toBeCloseTo(Math.sqrt(3 / (4 * Math.PI)) * x, 12);
    expect(sphericalHarmonicTheta(1, 1, x)).toBeCloseTo(-Math.sqrt(3 / (8 * Math.PI)) * s, 12);
    expect(sphericalHarmonicTheta(1, -1, x)).toBeCloseTo(Math.sqrt(3 / (8 * Math.PI)) * s, 12);
    expect(sphericalHarmonicTheta(2, 0, x)).toBeCloseTo(Math.sqrt(5 / (16 * Math.PI)) * (3 * x * x - 1), 12);
    expect(sphericalHarmonicTheta(2, 2, x)).toBeCloseTo(0.25 * Math.sqrt(15 / (2 * Math.PI)) * s * s, 12);
  });

  it("obeys Y_l,−m = (−1)^m Y*_lm", () => {
    for (const [l, m] of states) {
      expect(sphericalHarmonicTheta(l, -m, 0.37)).toBeCloseTo(
        (-1) ** Math.abs(m) * sphericalHarmonicTheta(l, m, 0.37),
        12,
      );
    }
  });
});

describe("sphericalHarmonic", () => {
  it("is orthonormal on the sphere for l ≤ 4", () => {
    const a: ComplexSample = { re: 0, im: 0 };
    const b: ComplexSample = { re: 0, im: 0 };
    const pairs: [[number, number], [number, number]][] = [
      [
        [2, 1],
        [2, 1],
      ],
      [
        [4, -3],
        [4, -3],
      ],
      [
        [3, 2],
        [3, 2],
      ],
      [
        [2, 1],
        [3, 1],
      ],
      [
        [1, 1],
        [1, -1],
      ],
      [
        [4, 0],
        [2, 0],
      ],
    ];
    for (const [[l1, m1], [l2, m2]] of pairs) {
      const re = integrateSphere((theta, phi) => {
        sphericalHarmonic(l1, m1, theta, phi, a);
        sphericalHarmonic(l2, m2, theta, phi, b);
        return a.re * b.re + a.im * b.im; // Re(a* b)
      });
      expect(re).toBeCloseTo(l1 === l2 && m1 === m2 ? 1 : 0, 5);
    }
  });
});
