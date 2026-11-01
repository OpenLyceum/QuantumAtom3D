/**
 * Colormaps.ts
 *
 * Data colours for ψ. They are computed from the physics and deliberately not
 * themed: the same phase must map to the same colour in every profile, or the
 * legend would lie.
 *
 *   phase wheels   arg ψ ∈ (−π, π] → hue. "hsv" is the familiar rainbow
 *                  wheel with red at phase 0. "uniform" walks the OKLCH hue
 *                  circle at constant lightness and chroma, so no phase looks
 *                  brighter than another. That matters here because the
 *                  heatmap multiplies the hue by |ψ|: a wheel with dark hues
 *                  (twilight, for instance) would hide whole lobes.
 *   density ramp   |ψ|²/max → "inferno" (black → purple → orange → yellow).
 *
 * The writers fill an RGBA byte array in place so the heatmap allocates
 * nothing per pixel.
 */

import type { PhaseColormap } from "../../QuantumAtom3DConstants.js";

type Rgb = readonly [number, number, number];

/** OKLCH lightness and chroma of the uniform wheel; this chroma stays inside sRGB at every hue. */
const UNIFORM_LIGHTNESS = 0.72;
const UNIFORM_CHROMA = 0.11;

/** OKLCH hue (radians) shown at phase 0: a warm red, like the HSV wheel. */
const UNIFORM_HUE_AT_ZERO_PHASE = 0.5;

/** Entries in the precomputed uniform wheel. */
const UNIFORM_TABLE_SIZE = 720;

/** sRGB transfer function (linear → encoded), clamped to [0, 1]. */
function encodeSrgb(linear: number): number {
  const clamped = Math.max(0, Math.min(1, linear));
  return clamped <= 0.0031308 ? 12.92 * clamped : 1.055 * clamped ** (1 / 2.4) - 0.055;
}

/** OKLab → encoded sRGB (Björn Ottosson's matrices). */
export function oklabToSrgb(lightness: number, a: number, b: number): Rgb {
  const lPrime = lightness + 0.3963377774 * a + 0.2158037573 * b;
  const mPrime = lightness - 0.1055613458 * a - 0.0638541728 * b;
  const sPrime = lightness - 0.0894841775 * a - 1.291485548 * b;
  const l = lPrime ** 3;
  const m = mPrime ** 3;
  const s = sPrime ** 3;
  return [
    encodeSrgb(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    encodeSrgb(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    encodeSrgb(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  ];
}

const UNIFORM_TABLE: readonly Rgb[] = Array.from({ length: UNIFORM_TABLE_SIZE }, (_, i) => {
  const hue = UNIFORM_HUE_AT_ZERO_PHASE + (2 * Math.PI * i) / UNIFORM_TABLE_SIZE;
  return oklabToSrgb(UNIFORM_LIGHTNESS, UNIFORM_CHROMA * Math.cos(hue), UNIFORM_CHROMA * Math.sin(hue));
});

/** Nine evenly spaced samples of matplotlib's "inferno". */
const INFERNO_ANCHORS: readonly Rgb[] = [
  [0.001462, 0.000466, 0.013866],
  [0.087411, 0.044556, 0.224813],
  [0.258234, 0.038571, 0.406485],
  [0.416331, 0.090203, 0.432943],
  [0.578304, 0.148039, 0.404411],
  [0.735683, 0.215906, 0.330245],
  [0.865006, 0.316822, 0.226055],
  [0.954506, 0.468744, 0.099874],
  [0.988362, 0.998364, 0.644924],
];

const TWO_PI = 2 * Math.PI;
const BYTE = 255;

/** Linear interpolation along a list of anchors, t ∈ [0, 1]. */
function sampleAnchors(anchors: readonly Rgb[], t: number, out: number[]): void {
  const scaled = Math.max(0, Math.min(1, t)) * (anchors.length - 1);
  const index = Math.min(Math.floor(scaled), anchors.length - 2);
  const fraction = scaled - index;
  const a = anchors[index] ?? anchors[0] ?? [0, 0, 0];
  const b = anchors[index + 1] ?? a;
  out[0] = a[0] + (b[0] - a[0]) * fraction;
  out[1] = a[1] + (b[1] - a[1]) * fraction;
  out[2] = a[2] + (b[2] - a[2]) * fraction;
}

/** Fully saturated hue wheel, hue = phase, red at 0, through yellow, green, cyan, blue, magenta. */
function sampleHsv(phase: number, out: number[]): void {
  const sector = ((((phase % TWO_PI) + TWO_PI) % TWO_PI) / TWO_PI) * 6;
  const i = Math.floor(sector) % 6;
  const f = sector - Math.floor(sector);
  const rising = f;
  const falling = 1 - f;
  const table: readonly Rgb[] = [
    [1, rising, 0],
    [falling, 1, 0],
    [0, 1, rising],
    [0, falling, 1],
    [rising, 0, 1],
    [1, 0, falling],
  ];
  const rgb = table[i] ?? [1, 0, 0];
  out[0] = rgb[0];
  out[1] = rgb[1];
  out[2] = rgb[2];
}

/** Writes the colour of `phase` into `out` as linear 0–1 components. */
export function phaseColor(phase: number, colormap: PhaseColormap, out: number[]): void {
  if (colormap === "hsv") {
    sampleHsv(phase, out);
  } else {
    const wrapped = (((phase % TWO_PI) + TWO_PI) % TWO_PI) / TWO_PI;
    const rgb = UNIFORM_TABLE[Math.floor(wrapped * UNIFORM_TABLE_SIZE) % UNIFORM_TABLE_SIZE] ?? [0, 0, 0];
    out[0] = rgb[0];
    out[1] = rgb[1];
    out[2] = rgb[2];
  }
}

/** Writes the inferno colour for t ∈ [0, 1] into `out`. */
export function densityColor(t: number, out: number[]): void {
  sampleAnchors(INFERNO_ANCHORS, t, out);
}

/** A CSS colour string for `phase`, for legends drawn with ordinary scenery nodes. */
export function phaseCssColor(phase: number, colormap: PhaseColormap): string {
  const rgb = [0, 0, 0];
  phaseColor(phase, colormap, rgb);
  return toCss(rgb);
}

/** A CSS colour string for the inferno ramp at t, for the density legend gradient. */
export function densityCssColor(t: number): string {
  const rgb = [0, 0, 0];
  densityColor(t, rgb);
  return toCss(rgb);
}

function toCss(rgb: readonly number[]): string {
  const channel = (value: number | undefined) => Math.round((value ?? 0) * BYTE);
  return `rgb(${channel(rgb[0])}, ${channel(rgb[1])}, ${channel(rgb[2])})`;
}

/** Writes (rgb · brightness) as opaque bytes at `offset` in an RGBA array. */
export function writePixel(data: Uint8ClampedArray, offset: number, rgb: readonly number[], brightness: number): void {
  data[offset] = (rgb[0] ?? 0) * brightness * BYTE;
  data[offset + 1] = (rgb[1] ?? 0) * brightness * BYTE;
  data[offset + 2] = (rgb[2] ?? 0) * brightness * BYTE;
  data[offset + 3] = BYTE;
}

/** Entries per colour lookup table handed to the 3D renderers. */
export const COLOR_LUT_SIZE = 256;

/**
 * The two lookup tables the 3D renderers share, as RGBA floats: entries
 * 0 … COLOR_LUT_SIZE − 1 are the phase wheel over [−π, π), and the next
 * COLOR_LUT_SIZE entries are the density ramp over [0, 1]. The GPU gets this
 * buffer verbatim and the CPU renderer reads the same one, so both colour alike.
 */
export function createColorLuts(colormap: PhaseColormap): Float32Array {
  const lut = new Float32Array(2 * COLOR_LUT_SIZE * 4);
  const rgb = [0, 0, 0];
  for (let i = 0; i < COLOR_LUT_SIZE; i++) {
    phaseColor(-Math.PI + (2 * Math.PI * i) / COLOR_LUT_SIZE, colormap, rgb);
    lut.set([rgb[0] ?? 0, rgb[1] ?? 0, rgb[2] ?? 0, 1], 4 * i);
    densityColor(i / (COLOR_LUT_SIZE - 1), rgb);
    lut.set([rgb[0] ?? 0, rgb[1] ?? 0, rgb[2] ?? 0, 1], 4 * (COLOR_LUT_SIZE + i));
  }
  return lut;
}
