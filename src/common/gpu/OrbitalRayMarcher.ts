/**
 * OrbitalRayMarcher.ts
 *
 * The CPU reference for the volume render: one pixel at a time, the exact
 * algorithm described in OrbitalScene.ts, with ψ evaluated by the CPU
 * Wavefunction. The WebGPU fragment shader must reproduce this to within
 * float32 and lookup-table error. The browser comparison spec holds it to that.
 */

import type { ComplexSample } from "../model/math/sphericalHarmonics.js";
import { Wavefunction } from "../model/orbital/Wavefunction.js";
import { COLOR_LUT_SIZE } from "../view/Colormaps.js";
import type { CameraFrame } from "../view/OrbitCamera.js";
import { type OrbitalScene, pixelJitter, RENDER_STEPS, VOLUME_OPACITY_GAIN } from "./OrbitalScene.js";

/** Accumulated opacity past which the march stops; the rest cannot show. */
const OPAQUE_ENOUGH = 0.99;

export class OrbitalRayMarcher {
  private readonly scene: OrbitalScene;
  private readonly frame: CameraFrame;
  private readonly colorLuts: Float32Array;
  private readonly wavefunction: Wavefunction;
  private readonly sample: ComplexSample = { re: 0, im: 0 };

  public constructor(scene: OrbitalScene, frame: CameraFrame, colorLuts: Float32Array) {
    this.scene = scene;
    this.frame = frame;
    this.colorLuts = colorLuts;
    this.wavefunction = new Wavefunction(scene.terms, scene.nuclearCharge);
  }

  /** Writes the colour (0–1 RGB over black) of pixel (px, py) of a resolution × resolution image into `out`. */
  public shade(px: number, py: number, resolution: number, out: number[]): void {
    const { radius, inversePeakAmplitude, coloring } = this.scene;
    const { right, up, forward } = this.frame;
    const u = (((px + 0.5) / resolution) * 2 - 1) * radius;
    const v = (1 - ((py + 0.5) / resolution) * 2) * radius;
    out[0] = 0;
    out[1] = 0;
    out[2] = 0;
    const chordSquared = radius * radius - u * u - v * v;
    if (chordSquared <= 0) {
      return;
    }
    const halfChord = Math.sqrt(chordSquared);
    const step = (2 * radius) / RENDER_STEPS;
    const stepOpacity = (VOLUME_OPACITY_GAIN * step) / radius;
    let transmittance = 1;
    for (let t = -halfChord + pixelJitter(px, py) * step; t < halfChord; t += step) {
      const x = right[0] * u + up[0] * v + forward[0] * t;
      const y = right[1] * u + up[1] * v + forward[1] * t;
      const z = right[2] * u + up[2] * v + forward[2] * t;
      this.wavefunction.evaluate(x, y, z, this.sample);
      const re = this.sample.re;
      const im = this.sample.im;
      const amplitude = Math.min(1, Math.sqrt(re * re + im * im) * inversePeakAmplitude);
      const alpha = 1 - Math.exp(-stepOpacity * amplitude);
      if (alpha <= 0) {
        continue;
      }
      const lutIndex =
        coloring === "phase"
          ? Math.min(COLOR_LUT_SIZE - 1, Math.floor(((Math.atan2(im, re) + Math.PI) / (2 * Math.PI)) * COLOR_LUT_SIZE))
          : COLOR_LUT_SIZE + Math.round(amplitude * amplitude * (COLOR_LUT_SIZE - 1));
      const weight = transmittance * alpha;
      out[0] += weight * (this.colorLuts[4 * lutIndex] ?? 0);
      out[1] += weight * (this.colorLuts[4 * lutIndex + 1] ?? 0);
      out[2] += weight * (this.colorLuts[4 * lutIndex + 2] ?? 0);
      transmittance *= 1 - alpha;
      if (transmittance < 1 - OPAQUE_ENOUGH) {
        break;
      }
    }
  }
}
