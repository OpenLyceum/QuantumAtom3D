/**
 * RadialLookupTable.ts
 *
 * Tabulated hydrogenic R_nl for Z = 1, one row per (n, l) with n ≤ MAX_N, for
 * the GPU field shader. A row samples r on a square-root axis,
 * r = s² · r_max(n) with s ∈ [0, 1], which packs samples near the nucleus where
 * R changes fastest. Any Z follows from the scaling R_nl(Z, r) = Z^{3/2} R_nl(1, Zr),
 * so the table never changes when Z does.
 *
 * `evaluate` is the CPU twin of the WGSL lookup (linear interpolation, zero past
 * r_max); tests compare it with the exact radial function.
 */

import { MAX_N } from "../../../QuantumAtom3DConstants.js";
import { hydrogenRadial, hydrogenRadialCutoff } from "../hydrogen/HydrogenRadial.js";

/** Samples per row. */
export const RADIAL_TABLE_SAMPLES = 1024;

/** Row of (n, l) in the table: rows for n = 1 come first, then n = 2, … */
export function radialRowIndex(n: number, l: number): number {
  return (n * (n - 1)) / 2 + l;
}

export class RadialLookupTable {
  public readonly rowCount: number;
  public readonly samplesPerRow = RADIAL_TABLE_SAMPLES;

  /** R_nl(1, r) values, row-major. */
  public readonly values: Float32Array;

  /** r_max of each row, in a0 (Z = 1). */
  public readonly rowMaxRadius: Float32Array;

  public constructor(maxN = MAX_N) {
    this.rowCount = radialRowIndex(maxN + 1, 0);
    this.values = new Float32Array(this.rowCount * RADIAL_TABLE_SAMPLES);
    this.rowMaxRadius = new Float32Array(this.rowCount);
    for (let n = 1; n <= maxN; n++) {
      const maxRadius = hydrogenRadialCutoff(n, 1);
      for (let l = 0; l < n; l++) {
        const row = radialRowIndex(n, l);
        this.rowMaxRadius[row] = maxRadius;
        for (let i = 0; i < RADIAL_TABLE_SAMPLES; i++) {
          const s = i / (RADIAL_TABLE_SAMPLES - 1);
          this.values[row * RADIAL_TABLE_SAMPLES + i] = hydrogenRadial(n, l, 1, s * s * maxRadius);
        }
      }
    }
  }

  /** R_nl(Z, r) from the table, exactly as the shader computes it. */
  public evaluate(n: number, l: number, nuclearCharge: number, r: number): number {
    const row = radialRowIndex(n, l);
    const maxRadius = this.rowMaxRadius[row] ?? 0;
    const s = Math.sqrt((nuclearCharge * r) / maxRadius);
    if (!(s < 1)) {
      return 0;
    }
    const position = s * (RADIAL_TABLE_SAMPLES - 1);
    const index = Math.floor(position);
    const fraction = position - index;
    const base = row * RADIAL_TABLE_SAMPLES + index;
    const a = this.values[base] ?? 0;
    const b = this.values[base + 1] ?? a;
    return nuclearCharge ** 1.5 * (a + (b - a) * fraction);
  }
}
