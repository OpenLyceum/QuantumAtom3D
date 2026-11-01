/** Independence Metropolis-Hastings with the incoherent eigenstate mixture as proposal density. */
import { Random } from "scenerystack/dot";
import type { OrbitalTerm } from "./OrbitalTerm.js";
import { EigenstateSampler } from "./ProbabilitySampler.js";
import type { Point3 } from "./RaySurfaces.js";
import { Wavefunction } from "./Wavefunction.js";

export class MetropolisSampler {
  private readonly random: Random;
  private readonly proposals: { sampler: EigenstateSampler; wave: Wavefunction; weight: number }[];
  private readonly positions: Float32Array;
  private readonly sample = { re: 0, im: 0 };
  public constructor(terms: readonly OrbitalTerm[], nuclearCharge: number, count: number, seed: number) {
    this.random = new Random({ seed });
    this.proposals = terms.map((term) => ({
      sampler: new EigenstateSampler(term.n, term.l, term.m, "complex", nuclearCharge),
      wave: new Wavefunction([{ ...term, re: 1, im: 0 }], nuclearCharge),
      weight: term.re ** 2 + term.im ** 2,
    }));
    this.positions = new Float32Array(terms.length > 0 ? count * 3 : 0);
    for (let i = 0; i < this.positions.length; i += 3) {
      this.positions.set(this.propose(), i);
    }
  }
  private propose(): Point3 {
    let u = this.random.nextDouble();
    for (const proposal of this.proposals) {
      u -= proposal.weight;
      if (u <= 0) {
        return proposal.sampler.sample(this.random);
      }
    }
    return this.proposals[this.proposals.length - 1]?.sampler.sample(this.random) ?? [0, 0, 0];
  }
  private proposalDensity(point: Point3): number {
    return this.proposals.reduce(
      (sum, proposal) => sum + proposal.weight * proposal.wave.density(...point, this.sample),
      0,
    );
  }
  /** Target can change in time; recompute old densities so acceptance always uses the current state. */
  public update(wavefunction: Wavefunction, sweeps = 1): Float32Array {
    for (let sweep = 0; sweep < sweeps; sweep++) {
      for (let i = 0; i < this.positions.length; i += 3) {
        const old: Point3 = [this.positions[i] ?? 0, this.positions[i + 1] ?? 0, this.positions[i + 2] ?? 0];
        const next = this.propose();
        const previousDensity = wavefunction.density(...old, this.sample);
        const targetDensity = wavefunction.density(...next, this.sample);
        const denominator = previousDensity * this.proposalDensity(next);
        const numerator = targetDensity * this.proposalDensity(old);
        if (denominator === 0 || this.random.nextDouble() * denominator < numerator) {
          this.positions.set(next, i);
        }
      }
    }
    // A new identity makes the renderer upload the evolved cloud.
    return this.positions.slice();
  }
}
