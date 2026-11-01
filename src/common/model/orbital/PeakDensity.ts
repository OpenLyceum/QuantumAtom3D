/**
 * PeakDensity.ts
 *
 * The largest |ψ|² of a state, which the 3D renderers divide by so that the
 * brightest point of every orbital has the same brightness.
 *
 * When every term shares one (n, l), as for an eigenstate or a real orbital, ψ
 * factors into R_nl(r) times an angular function, and the peak is the product
 * of the two separate maxima. Both maxima are found on fine grids. Any other
 * mix of terms falls back to a coarse 3D grid.
 */

import { hydrogenRadial, hydrogenRadialCutoff } from "../hydrogen/HydrogenRadial.js";
import type { ComplexSample } from "../math/sphericalHarmonics.js";
import { sphericalHarmonicTheta } from "../math/sphericalHarmonics.js";
import type { Wavefunction } from "./Wavefunction.js";

const RADIAL_SAMPLES = 4000;
const POLAR_SAMPLES = 181;
const AZIMUTH_SAMPLES = 360;
const GRID_SAMPLES = 41;

/** max over the sphere of |Σ c_k Y_{l m_k}|², for terms sharing l. */
function angularPeak(wavefunction: Wavefunction): number {
  let peak = 0;
  for (let i = 0; i < POLAR_SAMPLES; i++) {
    const cosTheta = Math.cos((Math.PI * i) / (POLAR_SAMPLES - 1));
    for (let j = 0; j < AZIMUTH_SAMPLES; j++) {
      const phi = (2 * Math.PI * j) / AZIMUTH_SAMPLES;
      let re = 0;
      let im = 0;
      for (const term of wavefunction.terms) {
        const polar = sphericalHarmonicTheta(term.l, term.m, cosTheta);
        const c = Math.cos(term.m * phi);
        const s = Math.sin(term.m * phi);
        re += polar * (term.re * c - term.im * s);
        im += polar * (term.re * s + term.im * c);
      }
      peak = Math.max(peak, re * re + im * im);
    }
  }
  return peak;
}

/** max over r of R_nl(Z, r)². */
function radialPeak(n: number, l: number, nuclearCharge: number): number {
  const cutoff = hydrogenRadialCutoff(n, nuclearCharge);
  let peak = 0;
  for (let i = 0; i <= RADIAL_SAMPLES; i++) {
    const radial = hydrogenRadial(n, l, nuclearCharge, (cutoff * i) / RADIAL_SAMPLES);
    peak = Math.max(peak, radial * radial);
  }
  return peak;
}

/** The largest |ψ|² of the wavefunction. */
export function peakDensity(wavefunction: Wavefunction): number {
  const [first, ...rest] = wavefunction.terms;
  if (!first) {
    return 0;
  }
  if (rest.every((term) => term.n === first.n && term.l === first.l)) {
    return radialPeak(first.n, first.l, wavefunction.nuclearCharge) * angularPeak(wavefunction);
  }
  const maxN = Math.max(...wavefunction.terms.map((term) => term.n));
  const half = hydrogenRadialCutoff(maxN, wavefunction.nuclearCharge) / 2;
  const sample: ComplexSample = { re: 0, im: 0 };
  let peak = 0;
  for (let i = 0; i < GRID_SAMPLES; i++) {
    for (let j = 0; j < GRID_SAMPLES; j++) {
      for (let k = 0; k < GRID_SAMPLES; k++) {
        const step = (2 * half) / (GRID_SAMPLES - 1);
        peak = Math.max(peak, wavefunction.density(-half + i * step, -half + j * step, -half + k * step, sample));
      }
    }
  }
  return peak;
}
