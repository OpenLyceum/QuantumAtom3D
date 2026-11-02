/** Cooperative spherical cubature: a square-root radial mesh resolves compact and diffuse terms together.
 * Unlike a uniform Cartesian box, its radial spacing does not discard the inner cloud in 1s + 5g.
 * The threshold search is also incremental; no large synchronous sort runs at completion.
 */
import type { Wavefunction } from "./Wavefunction.js";

const RADIAL_BINS = 128;
const POLAR_BINS = 48;
const AZIMUTH_BINS = 64;
/** Gauss-Legendre nodes integrate all supported angular norms exactly, including l=4. */
function polarQuadrature(): { nodes: number[]; weights: number[] } {
  const nodes: number[] = [],
    weights: number[] = [];
  for (let i = 0; i < POLAR_BINS; i++) {
    let x = Math.cos((Math.PI * (i + 0.75)) / (POLAR_BINS + 0.5));
    let derivative = 0;
    for (let iteration = 0; iteration < 20; iteration++) {
      let a = 1,
        b = x;
      for (let l = 2; l <= POLAR_BINS; l++) {
        const next = ((2 * l - 1) * x * b - (l - 1) * a) / l;
        a = b;
        b = next;
      }
      derivative = (POLAR_BINS * (x * b - a)) / (x * x - 1);
      const delta = b / derivative;
      x -= delta;
      if (Math.abs(delta) < 1e-15) {
        break;
      }
    }
    nodes.push(x);
    weights.push(2 / ((1 - x * x) * derivative * derivative));
  }
  return { nodes, weights };
}
const POLAR = polarQuadrature();
const CHECK_INTERVAL = 256;
const THRESHOLD_ITERATIONS = 26;
const SURFACE_WORK_BUDGET_MS = 4;

export class ProbabilitySurfaceTask {
  private readonly densities = new Float64Array(RADIAL_BINS * POLAR_BINS * AZIMUTH_BINS);
  private readonly shellVolumes = new Float64Array(RADIAL_BINS);
  private readonly sample = { re: 0, im: 0 };
  private index = 0;
  private sum = 0;
  private peak = 0;
  private low = 0;
  private high = 0;
  private threshold = 0;
  private iterations = 0;
  private searchIndex = 0;
  private searchMass = 0;
  private sampling = true;
  public complete = false;
  public level = 0;
  public totalProbability = 0;

  public constructor(privateWave: Wavefunction, radius: number, privateFraction = 0.9) {
    if (!(radius > 0 && Number.isFinite(radius) && privateFraction > 0 && privateFraction < 1)) {
      throw new Error("A surface requires a finite positive radius and a fraction between zero and one");
    }
    this.wave = privateWave;
    this.radius = radius;
    this.fraction = privateFraction;
    for (let r = 0; r < RADIAL_BINS; r++) {
      const a = radius * (r / RADIAL_BINS) ** 2;
      const b = radius * ((r + 1) / RADIAL_BINS) ** 2;
      this.shellVolumes[r] = ((b ** 3 - a ** 3) / 3) * ((2 * Math.PI) / AZIMUTH_BINS);
    }
  }
  private readonly wave: Wavefunction;
  private readonly radius: number;
  private readonly fraction: number;

  /** Uses wall time only for scheduling; physics time and sampling order are unchanged by the budget. */
  public advance(budget = SURFACE_WORK_BUDGET_MS): boolean {
    if (!(budget > 0 && Number.isFinite(budget)) || this.complete) {
      return this.complete;
    }
    const end = performance.now() + budget;
    do {
      if (this.sampling) {
        this.sampleBatch();
      } else {
        this.searchBatch();
      }
    } while (!this.complete && performance.now() < end);
    return this.complete;
  }
  private sampleBatch(): void {
    const end = Math.min(this.densities.length, this.index + CHECK_INTERVAL);
    for (; this.index < end; this.index++) {
      const shell = Math.floor(this.index / (POLAR_BINS * AZIMUTH_BINS));
      const polar = Math.floor(this.index / AZIMUTH_BINS) % POLAR_BINS;
      const azimuth = this.index % AZIMUTH_BINS;
      const a = this.radius * (shell / RADIAL_BINS) ** 2;
      const b = this.radius * ((shell + 1) / RADIAL_BINS) ** 2;
      const r = (a + b) / 2;
      const cos = POLAR.nodes[polar] ?? 0;
      const sin = Math.sqrt(1 - cos * cos);
      const phi = (2 * Math.PI * (azimuth + 0.5)) / AZIMUTH_BINS;
      const density = this.wave.density(r * sin * Math.cos(phi), r * sin * Math.sin(phi), r * cos, this.sample);
      this.densities[this.index] = density;
      this.sum += density * (this.shellVolumes[shell] ?? 0) * (POLAR.weights[polar] ?? 0);
      this.peak = Math.max(this.peak, density);
    }
    if (this.index === this.densities.length) {
      this.sampling = false;
      this.totalProbability = this.sum;
      this.high = this.peak;
      this.threshold = this.high / 2;
      if (this.peak === 0) {
        this.complete = true;
      }
    }
  }
  private searchBatch(): void {
    const end = Math.min(this.densities.length, this.searchIndex + CHECK_INTERVAL);
    for (; this.searchIndex < end; this.searchIndex++) {
      const density = this.densities[this.searchIndex] ?? 0;
      if (density >= this.threshold) {
        this.searchMass +=
          density *
          (this.shellVolumes[Math.floor(this.searchIndex / (POLAR_BINS * AZIMUTH_BINS))] ?? 0) *
          (POLAR.weights[Math.floor(this.searchIndex / AZIMUTH_BINS) % POLAR_BINS] ?? 0);
      }
    }
    if (this.searchIndex === this.densities.length) {
      if (this.searchMass >= this.fraction * this.totalProbability) {
        this.low = this.threshold;
      } else {
        this.high = this.threshold;
      }
      this.threshold = (this.low + this.high) / 2;
      this.searchMass = 0;
      this.searchIndex = 0;
      this.iterations++;
      if (this.iterations === THRESHOLD_ITERATIONS) {
        this.level = this.low;
        this.complete = true;
      }
    }
  }
}
