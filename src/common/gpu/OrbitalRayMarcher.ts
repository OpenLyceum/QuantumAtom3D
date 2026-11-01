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
import { compositeSurfaces, surfaceEvents } from "./SurfaceOverlays.js";

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
    const events = surfaceEvents(
      this.scene,
      [right[0] * u + up[0] * v, right[1] * u + up[1] * v, right[2] * u + up[2] * v],
      forward,
      halfChord,
      this.wavefunction,
      this.colorLuts,
    );
    if (this.scene.mode === "isosurface") {
      const hit = this.shadeSurface(u, v, halfChord, step, out);
      compositeSurfaces(events, hit, out);
      return;
    }
    const stepOpacity = ((this.scene.opacityGain ?? VOLUME_OPACITY_GAIN) * step) / radius;
    let transmittance = 1;
    let eventIndex = 0;
    const compositeUntil = (limit: number) => {
      while (eventIndex < events.length && (events[eventIndex]?.t ?? Infinity) <= limit) {
        const event = events[eventIndex++];
        if (event) {
          for (let c = 0; c < 3; c++) {
            out[c] = (out[c] ?? 0) + transmittance * event.alpha * (event.color[c] ?? 0);
          }
          transmittance *= 1 - event.alpha;
        }
      }
    };
    for (let t = -halfChord + pixelJitter(px, py) * step; t < halfChord; t += step) {
      compositeUntil(t);
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
    compositeUntil(halfChord);
  }

  private shadeSurface(u: number, v: number, halfChord: number, step: number, out: number[]): number {
    const { right, up, forward } = this.frame;
    const origin = [right[0] * u + up[0] * v, right[1] * u + up[1] * v, right[2] * u + up[2] * v];
    const level = this.scene.isoLevel ?? 0;
    if (!(level > 0)) {
      return Infinity;
    }
    const densityAt = (t: number) =>
      this.wavefunction.density(
        (origin[0] ?? 0) + forward[0] * t,
        (origin[1] ?? 0) + forward[1] * t,
        (origin[2] ?? 0) + forward[2] * t,
        this.sample,
      );
    let previous = -halfChord;
    for (let t = -halfChord; t <= halfChord; t += step) {
      if (densityAt(t) >= level) {
        let a = previous;
        let b = t;
        for (let i = 0; i < 8; i++) {
          const mid = (a + b) / 2;
          if (densityAt(mid) >= level) {
            b = mid;
          } else {
            a = mid;
          }
        }
        const hit = (a + b) / 2;
        const x = (origin[0] ?? 0) + forward[0] * hit;
        const y = (origin[1] ?? 0) + forward[1] * hit;
        const z = (origin[2] ?? 0) + forward[2] * hit;
        const e = this.scene.radius / 2000;
        const d = (px: number, py: number, pz: number) => this.wavefunction.density(px, py, pz, this.sample);
        const gradient = [
          d(x + e, y, z) - d(x - e, y, z),
          d(x, y + e, z) - d(x, y - e, z),
          d(x, y, z + e) - d(x, y, z - e),
        ];
        const norm = Math.hypot(...gradient);
        const facing =
          norm > 0 ? Math.abs(gradient.reduce((sum, value, i) => sum + value * (forward[i] ?? 0), 0)) / norm : 0;
        this.wavefunction.evaluate(x, y, z, this.sample);
        const index =
          this.scene.coloring === "phase"
            ? Math.min(
                COLOR_LUT_SIZE - 1,
                Math.floor(((Math.atan2(this.sample.im, this.sample.re) + Math.PI) / (2 * Math.PI)) * COLOR_LUT_SIZE),
              )
            : COLOR_LUT_SIZE +
              Math.round(Math.min(1, level * this.scene.inversePeakAmplitude ** 2) * (COLOR_LUT_SIZE - 1));
        for (let c = 0; c < 3; c++) {
          out[c] = (this.colorLuts[4 * index + c] ?? 0) * (0.35 + 0.65 * facing);
        }
        return hit;
      }
      previous = t;
    }
    return Infinity;
  }
}
