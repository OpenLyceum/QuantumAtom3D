/** Seeded inverse-CDF sampling of separable hydrogenic eigenstates and real orbitals. */
import { Random } from "scenerystack/dot";
import { hydrogenRadialCutoff, hydrogenRadialDistribution } from "../hydrogen/HydrogenRadial.js";
import { sphericalHarmonicTheta } from "../math/sphericalHarmonics.js";
import type { OrbitalBasis } from "./OrbitalCatalog.js";

const CDF_BINS = 4096;

/** Piecewise-linear density integrated by trapezoids; invert its piecewise-linear CDF. */
export class InverseCdf {
  private readonly cumulative = new Float64Array(CDF_BINS + 1);
  private readonly coordinates = new Float64Array(CDF_BINS + 1);
  public constructor(coordinate: (fraction: number) => number, density: (x: number) => number) {
    let previousX = coordinate(0);
    let previousDensity = density(previousX);
    this.coordinates[0] = previousX;
    for (let i = 1; i <= CDF_BINS; i++) {
      const x = coordinate(i / CDF_BINS);
      const d = density(x);
      this.coordinates[i] = x;
      this.cumulative[i] = (this.cumulative[i - 1] ?? 0) + ((x - previousX) * (d + previousDensity)) / 2;
      previousX = x;
      previousDensity = d;
    }
    const norm = this.cumulative[CDF_BINS] ?? 0;
    if (!(norm > 0)) {
      throw new Error("Cannot sample a zero probability distribution");
    }
    for (let i = 1; i <= CDF_BINS; i++) {
      this.cumulative[i] = (this.cumulative[i] ?? 0) / norm;
    }
  }
  public sample(u: number): number {
    let low = 0;
    let high = CDF_BINS;
    while (high - low > 1) {
      const mid = (low + high) >>> 1;
      if ((this.cumulative[mid] ?? 0) < u) {
        low = mid;
      } else {
        high = mid;
      }
    }
    const a = this.cumulative[low] ?? 0;
    const b = this.cumulative[high] ?? 1;
    const fraction = b > a ? Math.max(0, Math.min(1, (u - a) / (b - a))) : 0;
    return (this.coordinates[low] ?? 0) + fraction * ((this.coordinates[high] ?? 0) - (this.coordinates[low] ?? 0));
  }
}

/** Reusable distribution tables for independent draws from one eigenstate. */
export class EigenstateSampler {
  private readonly radial: InverseCdf;
  private readonly polar: InverseCdf;
  private readonly azimuth: InverseCdf | null;
  public constructor(n: number, l: number, m: number, basis: OrbitalBasis, z: number) {
    this.radial = new InverseCdf(
      (s) => s * s * hydrogenRadialCutoff(n, z),
      (r) => hydrogenRadialDistribution(n, l, z, r),
    );
    this.polar = new InverseCdf(
      (s) => 2 * s - 1,
      (cos) => sphericalHarmonicTheta(l, m, cos) ** 2,
    );
    this.azimuth =
      basis === "real" && m !== 0
        ? new InverseCdf(
            (s) => 2 * Math.PI * s,
            (phi) => (m > 0 ? Math.cos(m * phi) : Math.sin(m * phi)) ** 2,
          )
        : null;
  }
  public sample(random: Random): readonly [number, number, number] {
    const r = this.radial.sample(random.nextDouble());
    const cos = this.polar.sample(random.nextDouble());
    const phi = this.azimuth ? this.azimuth.sample(random.nextDouble()) : 2 * Math.PI * random.nextDouble();
    const sin = Math.sqrt(Math.max(0, 1 - cos * cos));
    return [r * sin * Math.cos(phi), r * sin * Math.sin(phi), r * cos];
  }
}

/** Packed xyz positions in a0. They are probability samples, not electron trajectories. */
export function sampleEigenstate(
  n: number,
  l: number,
  m: number,
  basis: OrbitalBasis,
  z: number,
  count: number,
  seed: number,
): Float32Array {
  const random = new Random({ seed });
  const sampler = new EigenstateSampler(n, l, m, basis, z);
  const points = new Float32Array(3 * count);
  for (let i = 0; i < count; i++) {
    points.set(sampler.sample(random), 3 * i);
  }
  return points;
}
