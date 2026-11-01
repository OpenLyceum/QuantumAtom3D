/**
 * Wavefunction.ts
 *
 * An immutable hydrogenic or reduced-oscillator wavefunction ψ = Σ_k c_k R_{n_k l_k}(r) Y_{l_k m_k}(θ, φ)
 * for nuclear charge Z (hydrogen only), evaluated at Cartesian points. Oscillator lengths are
 * in sqrt(hbar/m omega); hydrogen lengths are in a0. Physics z is the
 * quantization axis). This is the CPU reference for everything drawn: the
 * slice heatmap now, and the CPU 3D renderer and the GPU comparison later.
 */

import { hydrogenRadial } from "../hydrogen/HydrogenRadial.js";
import { type ComplexSample, sphericalHarmonicTheta } from "../math/sphericalHarmonics.js";
import { oscillatorRadial } from "../oscillator/OscillatorStates.js";
import type { OrbitalTerm } from "./OrbitalTerm.js";

export class Wavefunction {
  public readonly terms: readonly OrbitalTerm[];
  public readonly nuclearCharge: number;
  public readonly family: "hydrogen" | "oscillator";

  public constructor(
    terms: readonly OrbitalTerm[],
    nuclearCharge: number,
    family: "hydrogen" | "oscillator" = "hydrogen",
  ) {
    this.terms = terms;
    this.nuclearCharge = nuclearCharge;
    this.family = family;
  }

  /** Writes ψ(x, y, z) into `out`. */
  public evaluate(x: number, y: number, z: number, out: ComplexSample): void {
    const r = Math.sqrt(x * x + y * y + z * z);
    const cosTheta = r === 0 ? 1 : z / r;
    const phi = Math.atan2(y, x);
    let re = 0;
    let im = 0;
    for (const term of this.terms) {
      const amplitude =
        (this.family === "oscillator"
          ? oscillatorRadial(term.n, term.l, r)
          : hydrogenRadial(term.n, term.l, this.nuclearCharge, r)) * sphericalHarmonicTheta(term.l, term.m, cosTheta);
      const cosMPhi = Math.cos(term.m * phi);
      const sinMPhi = Math.sin(term.m * phi);
      // c · e^{imφ} = (re + i im)(cos + i sin)
      re += amplitude * (term.re * cosMPhi - term.im * sinMPhi);
      im += amplitude * (term.re * sinMPhi + term.im * cosMPhi);
    }
    out.re = re;
    out.im = im;
  }

  /** |ψ(x, y, z)|². */
  public density(x: number, y: number, z: number, scratch: ComplexSample): number {
    this.evaluate(x, y, z, scratch);
    return scratch.re * scratch.re + scratch.im * scratch.im;
  }
}
