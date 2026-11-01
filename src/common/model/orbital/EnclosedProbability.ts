/** A density threshold encloses the highest-density cells containing the requested probability. */
import type { ComplexSample } from "../math/sphericalHarmonics.js";
import type { Wavefunction } from "./Wavefunction.js";

export type DensityGrid = {
  readonly densities: Float64Array;
  readonly cellVolume: number;
  readonly totalProbability: number;
};

/** Midpoint cubature on a physical box, independent of camera and zoom. */
export function buildDensityGrid(wavefunction: Wavefunction, halfWidth: number, resolution = 64): DensityGrid {
  const densities = new Float64Array(resolution ** 3);
  const step = (2 * halfWidth) / resolution;
  const sample: ComplexSample = { re: 0, im: 0 };
  let index = 0;
  let total = 0;
  for (let k = 0; k < resolution; k++) {
    for (let j = 0; j < resolution; j++) {
      for (let i = 0; i < resolution; i++) {
        const density = wavefunction.density(
          -halfWidth + (i + 0.5) * step,
          -halfWidth + (j + 0.5) * step,
          -halfWidth + (k + 0.5) * step,
          sample,
        );
        densities[index++] = density;
        total += density;
      }
    }
  }
  return { densities, cellVolume: step ** 3, totalProbability: total * step ** 3 };
}

/** Fraction refers to the grid's captured probability; report totalProbability with the approximation. */
export function enclosedProbabilityLevel(grid: DensityGrid, fraction: number): number {
  if (!(fraction > 0 && fraction < 1)) {
    throw new Error("Enclosed fraction must lie between zero and one");
  }
  const sorted = grid.densities.slice().sort().reverse();
  const target = (fraction * grid.totalProbability) / grid.cellVolume;
  let sum = 0;
  for (const density of sorted) {
    sum += density;
    if (sum >= target) {
      return density;
    }
  }
  return 0;
}
