/**
 * OrbitalScene.ts
 *
 * Everything a 3D renderer needs to draw one frame, and its packing into the
 * shader's uniform block. Both renderers (WebGPU and the CPU reference) consume
 * the same OrbitalScene and run the same ray-march:
 *
 *   - Orthographic rays, one per pixel centre, through the sphere |r| < R
 *     (R = the view half-width, so the view fits the sphere).
 *   - RENDER_STEPS samples spaced 2R/RENDER_STEPS apart, the first offset by a
 *     per-pixel jitter in [0, 1) steps, which hides banding.
 *   - At each sample, a = |ψ|/max|ψ|. The sample's opacity is
 *     1 − exp(−VOLUME_OPACITY_GAIN · a · ds/R), and its colour is the phase
 *     wheel at arg ψ (phase colouring) or the density ramp at a² (density
 *     colouring). Samples are composited front to back over black.
 *
 * Brightness follows |ψ|, as on the 2D cross-section, so the outer lobes stay
 * visible.
 */

import type { PhaseColormap } from "../../QuantumAtom3DConstants.js";
import { sphericalHarmonicPrefactor } from "../model/math/sphericalHarmonics.js";
import type { OrbitalTerm } from "../model/orbital/OrbitalTerm.js";
import { radialRowIndex } from "../model/orbital/RadialLookupTable.js";
import type { CameraFrame } from "../view/OrbitCamera.js";

/** Most terms a scene can carry (the uniform block has room for exactly this many). */
export const MAX_RENDER_TERMS = 8;

/** Ray-march samples across the sphere's diameter. */
export const RENDER_STEPS = 128;

/** Optical depth per unit amplitude across one sphere radius. */
export const VOLUME_OPACITY_GAIN = 4;

/** Size of the `Params` uniform block, in bytes: six vec4s, then MAX_RENDER_TERMS terms of two vec4s. */
export const PARAMS_BYTES = 6 * 16 + MAX_RENDER_TERMS * 2 * 16;

export type OrbitalColoring = "phase" | "density";

export type OrbitalScene = {
  readonly terms: readonly OrbitalTerm[];
  readonly nuclearCharge: number;
  /** 1 / max|ψ|. */
  readonly inversePeakAmplitude: number;
  /** Radius of the rendered sphere, in a0. */
  readonly radius: number;
  readonly coloring: OrbitalColoring;
  readonly phaseColormap: PhaseColormap;
};

/** A per-pixel offset in [0, 1), from an integer hash that gives identical results in TypeScript and WGSL. */
export function pixelJitter(px: number, py: number): number {
  let h = (Math.imul(px, 1973) + Math.imul(py, 9277)) >>> 0;
  h = Math.imul(h ^ (h >>> 16), 0x7feb352d) >>> 0;
  h = Math.imul(h ^ (h >>> 15), 0x846ca68b) >>> 0;
  h = (h ^ (h >>> 16)) >>> 0;
  return h / 4294967296;
}

/**
 * Writes the uniform block for one frame into `out` (PARAMS_BYTES long). The
 * layout mirrors `struct Params` in shaders/orbitalRender.ts; a change to one
 * must be made in the other.
 */
export function packParams(scene: OrbitalScene, frame: CameraFrame, resolution: number, out: ArrayBuffer): void {
  const floats = new Float32Array(out);
  const ints = new Int32Array(out);
  const uints = new Uint32Array(out);
  floats.fill(0);
  floats.set([...frame.right, 0], 0);
  floats.set([...frame.up, 0], 4);
  floats.set([...frame.forward, 0], 8);
  floats.set([scene.nuclearCharge, scene.inversePeakAmplitude, VOLUME_OPACITY_GAIN, scene.radius], 12);
  const termCount = Math.min(scene.terms.length, MAX_RENDER_TERMS);
  floats.set([scene.radius, resolution, RENDER_STEPS, termCount], 16);
  uints.set([scene.coloring === "phase" ? 0 : 1, 0, 0, 0], 20);
  for (let k = 0; k < termCount; k++) {
    const term = scene.terms[k];
    if (!term) {
      continue;
    }
    const base = 24 + 8 * k;
    floats.set([term.re, term.im, sphericalHarmonicPrefactor(term.l, term.m), 0], base);
    ints.set([term.n, term.l, term.m, radialRowIndex(term.n, term.l)], base + 4);
  }
}
