import { ANGULAR_NUMERICS } from "../../../QuantumAtom3DConstants.js";
/** Quantum vector-model geometry in units of hbar; precession angles are schematic. */
export type AngularVector = readonly [number, number, number];
export const angularMagnitude = (q: number): number => Math.sqrt(q * (q + 1));

function mapAngularVector(vector: AngularVector, map: (value: number, axis: 0 | 1 | 2) => number): AngularVector {
  return [map(vector[0], 0), map(vector[1], 1), map(vector[2], 2)];
}

export function orbitalVector(l: number, m: number, phase: number): AngularVector {
  const transverse = Math.sqrt(Math.max(0, l * (l + 1) - m * m));
  return [transverse * Math.cos(phase), transverse * Math.sin(phase), m];
}

/** For |l,m>, Delta Lx Delta Ly / hbar². This formula does not describe a coupled |j,mj> state. */
export function orbitalUncertaintyProduct(l: number, m: number): number {
  return (l * (l + 1) - m * m) / 2;
}

export function allowedJ(l: number): readonly number[] {
  return l === 0 ? [0.5] : [l - 0.5, l + 0.5];
}

/** L and S close to J at every angle, preserving their quantum magnitudes and projections on J. */
export function coupledVectors(
  l: number,
  j: number,
  mj: number,
  outerPhase: number,
  innerPhase: number,
): {
  orbital: AngularVector;
  spin: AngularVector;
  total: AngularVector;
} {
  const lengthJ = angularMagnitude(j);
  const cos = mj / lengthJ;
  const sin = Math.sqrt(Math.max(0, 1 - cos * cos));
  const unit: AngularVector = [sin * Math.cos(outerPhase), sin * Math.sin(outerPhase), cos];
  const e1: AngularVector = [cos * Math.cos(outerPhase), cos * Math.sin(outerPhase), -sin];
  const e2: AngularVector = [-Math.sin(outerPhase), Math.cos(outerPhase), 0];
  const parallel = (j * (j + 1) + l * (l + 1) - 0.75) / (2 * lengthJ);
  const perpendicular = Math.sqrt(Math.max(0, l * (l + 1) - parallel * parallel));
  const J = mapAngularVector(unit, (value) => value * lengthJ);
  const L = mapAngularVector(
    unit,
    (value, axis) =>
      value * parallel + perpendicular * (e1[axis] * Math.cos(innerPhase) + e2[axis] * Math.sin(innerPhase)),
  );
  const S = mapAngularVector(J, (value, axis) => value - L[axis]);
  return { orbital: L, spin: S, total: J };
}

/** Spin-traced angular density weights: m_l=m_j∓1/2. Clebsch–Gordan probabilities. */
export function coupledAngularWeights(l: number, j: number, mj: number): readonly { m: number; weight: number }[] {
  const upper = j > l;
  const upWeight = (l + (upper ? mj : -mj) + 0.5) / (2 * l + 1);
  return [
    { m: mj - 0.5, weight: upWeight },
    { m: mj + 0.5, weight: 1 - upWeight },
  ].filter(({ m, weight }) => Math.abs(m) <= l && weight > ANGULAR_NUMERICS.MIN_WEIGHT);
}
