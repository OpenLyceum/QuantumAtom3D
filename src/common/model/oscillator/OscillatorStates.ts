/** Isotropic oscillator in reduced coordinates x/sqrt(hbar/m omega), energy in hbar omega. */
import { associatedLaguerre, factorial } from "../math/specialFunctions.js";
import { type ComplexSample, sphericalHarmonic } from "../math/sphericalHarmonics.js";
import type { OrbitalTerm } from "../orbital/OrbitalTerm.js";
export type CartesianState = readonly [number, number, number];
export type SphericalState = { readonly nr: number; readonly l: number; readonly m: number };
export const oscillatorDegeneracy = (N: number): number => ((N + 1) * (N + 2)) / 2;
export const oscillatorEnergy = (N: number): number => N + 1.5;
export function cartesianStates(N: number): CartesianState[] {
  const states: CartesianState[] = [];
  for (let x = 0; x <= N; x++) {
    for (let y = 0; y <= N - x; y++) {
      states.push([x, y, N - x - y]);
    }
  }
  return states;
}
export function sphericalStates(N: number): SphericalState[] {
  const states: SphericalState[] = [];
  for (let l = N; l >= 0; l -= 2) {
    for (let m = -l; m <= l; m++) {
      states.push({ nr: (N - l) / 2, l, m });
    }
  }
  return states;
}
function hermite(n: number, x: number): number {
  let a = 1;
  let b = 2 * x;
  if (n === 0) {
    return a;
  }
  for (let k = 1; k < n; k++) {
    const c = 2 * x * b - 2 * k * a;
    a = b;
    b = c;
  }
  return b;
}
function gammaHalf(k: number): number {
  let result = Math.sqrt(Math.PI);
  for (let i = 0; i < k; i++) {
    result *= i + 0.5;
  }
  return result;
}
export function oscillatorRadial(nr: number, l: number, r: number): number {
  return (
    Math.sqrt((2 * factorial(nr)) / gammaHalf(nr + l + 1)) *
    r ** l *
    associatedLaguerre(nr, l + 0.5, r * r) *
    Math.exp((-r * r) / 2)
  );
}
function cartesianPolynomial(state: CartesianState, x: number, y: number, z: number): number {
  return state.reduce(
    (value, n, index) => (value * hermite(n, [x, y, z][index] ?? 0)) / Math.sqrt(2 ** n * factorial(n)),
    Math.PI ** -0.75,
  );
}
export function cartesianWavefunction(state: CartesianState, x: number, y: number, z: number): number {
  return cartesianPolynomial(state, x, y, z) * Math.exp(-(x * x + y * y + z * z) / 2);
}
/** Polynomial multiplying exp(-r²/2), avoiding divisions by tiny Gaussian tails. */
function sphericalPolynomial(state: SphericalState, x: number, y: number, z: number, out: ComplexSample): void {
  const r = Math.hypot(x, y, z);
  sphericalHarmonic(state.l, state.m, r === 0 ? 0 : Math.acos(z / r), Math.atan2(y, x), out);
  const radial =
    Math.sqrt((2 * factorial(state.nr)) / gammaHalf(state.nr + state.l + 1)) *
    r ** state.l *
    associatedLaguerre(state.nr, state.l + 0.5, r * r);
  out.re *= radial;
  out.im *= radial;
}
const SQRT_PI = Math.sqrt(Math.PI);
const a = Math.sqrt((5 - Math.sqrt(10)) / 2),
  b = Math.sqrt((5 + Math.sqrt(10)) / 2);
const GH_NODES = [-b, -a, 0, a, b];
const small = (SQRT_PI * (7 - 2 * Math.sqrt(10))) / 60,
  large = (SQRT_PI * (7 + 2 * Math.sqrt(10))) / 60;
const GH_WEIGHTS = [small, large, (8 * SQRT_PI) / 15, large, small];
const expansionCache = new Map<string, readonly OrbitalTerm[]>();
/** Five-point Gauss-Hermite per axis is exact for the degree <=8 overlap polynomials at N<=4. */
export function cartesianExpansion(state: CartesianState): readonly OrbitalTerm[] {
  const key = state.join(",");
  const cached = expansionCache.get(key);
  if (cached) {
    return cached;
  }
  const N = state[0] + state[1] + state[2];
  const scratch = { re: 0, im: 0 };
  const terms = sphericalStates(N)
    .map((s) => {
      let re = 0,
        im = 0;
      GH_NODES.forEach((x, i) => {
        GH_NODES.forEach((y, j) => {
          GH_NODES.forEach((z, k) => {
            sphericalPolynomial(s, x, y, z, scratch);
            const weight =
              (GH_WEIGHTS[i] ?? 0) * (GH_WEIGHTS[j] ?? 0) * (GH_WEIGHTS[k] ?? 0) * cartesianPolynomial(state, x, y, z);
            re += weight * scratch.re;
            im -= weight * scratch.im;
          });
        });
      });
      return { n: s.nr, l: s.l, m: s.m, re: Math.abs(re) < 1e-12 ? 0 : re, im: Math.abs(im) < 1e-12 ? 0 : im };
    })
    .filter((term) => term.re !== 0 || term.im !== 0);
  expansionCache.set(key, terms);
  return terms;
}
export const OSCILLATOR_RADIAL_STATES = Array.from({ length: 5 }, (_, N) =>
  sphericalStates(N).filter((s) => s.m === 0),
).flat();
export function oscillatorRowIndex(nr: number, l: number): number {
  return OSCILLATOR_RADIAL_STATES.findIndex((s) => s.nr === nr && s.l === l);
}

const cartesianPeaks = new Map<number, number>();
/** Product of independent one-dimensional maxima; avoids a 3D normalization grid on shell changes. */
export function cartesianPeakDensity(state: CartesianState): number {
  return state.reduce((peak, n) => {
    let one = cartesianPeaks.get(n);
    if (one === undefined) {
      one = 0;
      const samples = 4000;
      for (let i = 0; i <= samples; i++) {
        const x = (6 * i) / samples;
        const h = hermite(n, x);
        one = Math.max(one, (h * h * Math.exp(-x * x)) / (Math.sqrt(Math.PI) * 2 ** n * factorial(n)));
      }
      cartesianPeaks.set(n, one);
    }
    return peak * one;
  }, 1);
}
