/**
 * SliceSampler.ts
 *
 * Samples ψ on a square patch of a coordinate plane, for the 2D cross-section.
 * The plane is named by the two axes it contains. The patch spans
 * [−halfWidth, halfWidth] in both in-plane directions, and the plane sits at
 * `offset` along its normal:
 *
 *   "xy": (u, v, offset)    normal z
 *   "xz": (u, offset, v)    normal y (the default: z points up the page)
 *   "yz": (offset, u, v)    normal x
 *
 * Row 0 of the output is the top of the patch (v = +halfWidth), so the arrays
 * map straight onto an image.
 */

import type { ComplexSample } from "../math/sphericalHarmonics.js";
import type { Wavefunction } from "./Wavefunction.js";

export const SLICE_PLANE_VALUES = ["xy", "xz", "yz"] as const;
export type SlicePlane = (typeof SLICE_PLANE_VALUES)[number];

export type SliceSamples = {
  readonly resolution: number;
  /** Re ψ, row-major, resolution × resolution. */
  readonly re: Float32Array;
  /** Im ψ, row-major, resolution × resolution. */
  readonly im: Float32Array;
  /** The largest |ψ|² in the patch (0 if ψ vanishes everywhere on it). */
  readonly maxDensity: number;
};

/** Maps in-plane coordinates (u, v) and the normal offset to (x, y, z). */
export function slicePoint(plane: SlicePlane, u: number, v: number, offset: number): readonly [number, number, number] {
  if (plane === "xy") {
    return [u, v, offset];
  }
  if (plane === "xz") {
    return [u, offset, v];
  }
  return [offset, u, v];
}

/** Samples ψ at the centres of a resolution × resolution grid of cells. */
export function sampleSlice(
  wavefunction: Wavefunction,
  plane: SlicePlane,
  offset: number,
  halfWidth: number,
  resolution: number,
): SliceSamples {
  const re = new Float32Array(resolution * resolution);
  const im = new Float32Array(resolution * resolution);
  const sample: ComplexSample = { re: 0, im: 0 };
  const cell = (2 * halfWidth) / resolution;
  let maxDensity = 0;
  for (let row = 0; row < resolution; row++) {
    const v = halfWidth - (row + 0.5) * cell;
    for (let column = 0; column < resolution; column++) {
      const u = -halfWidth + (column + 0.5) * cell;
      const [x, y, z] = slicePoint(plane, u, v, offset);
      wavefunction.evaluate(x, y, z, sample);
      const index = row * resolution + column;
      re[index] = sample.re;
      im[index] = sample.im;
      maxDensity = Math.max(maxDensity, sample.re * sample.re + sample.im * sample.im);
    }
  }
  return { resolution, re, im, maxDensity };
}
