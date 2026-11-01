/** Exact surface events, composited in depth order with the sampled field. */
import { nodalRayHits, type Point3, planeHit } from "../model/orbital/RaySurfaces.js";
import type { Wavefunction } from "../model/orbital/Wavefunction.js";
import { COLOR_LUT_SIZE } from "../view/Colormaps.js";
import type { OrbitalScene } from "./OrbitalScene.js";

export type SurfaceEvent = { readonly t: number; readonly color: Point3; readonly alpha: number };

export function surfaceEvents(
  scene: OrbitalScene,
  origin: Point3,
  direction: Point3,
  halfChord: number,
  wavefunction: Wavefunction,
  luts: Float32Array,
): SurfaceEvent[] {
  const color: Point3 = scene.overlayColor ?? [1, 1, 1];
  const events: SurfaceEvent[] = scene.nodes
    ? nodalRayHits(origin, direction, scene.nodes, scene.radius).map((t) => ({ t, color, alpha: 0.14 }))
    : [];
  if (scene.cuttingPlane) {
    const t = planeHit(origin, direction, scene.cuttingPlane.normal, scene.cuttingPlane.offset);
    if (t !== null && Math.abs(t) <= halfChord) {
      const sample = { re: 0, im: 0 };
      wavefunction.evaluate(
        origin[0] + t * direction[0],
        origin[1] + t * direction[1],
        origin[2] + t * direction[2],
        sample,
      );
      const amplitude = Math.min(1, Math.hypot(sample.re, sample.im) * scene.inversePeakAmplitude);
      const index =
        scene.coloring === "phase"
          ? Math.min(
              COLOR_LUT_SIZE - 1,
              Math.floor(((Math.atan2(sample.im, sample.re) + Math.PI) / (2 * Math.PI)) * COLOR_LUT_SIZE),
            )
          : COLOR_LUT_SIZE + Math.round(amplitude ** 2 * (COLOR_LUT_SIZE - 1));
      const gain = scene.coloring === "phase" ? amplitude : 1;
      events.push({
        t,
        alpha: 0.9,
        color: [0, 1, 2].map((c) => gain * (luts[4 * index + c] ?? 0)) as unknown as Point3,
      });
    }
  }
  return events.filter(({ t }) => t >= -halfChord && t <= halfChord).sort((a, b) => a.t - b.t);
}

/** Composite all surfaces in front of an opaque sample (isosurface or probability dot). */
export function compositeSurfaces(events: readonly SurfaceEvent[], limit: number, rgb: number[]): void {
  for (let i = events.length - 1; i >= 0; i--) {
    const event = events[i];
    if (event && event.t <= limit) {
      for (let c = 0; c < 3; c++) {
        rgb[c] = (1 - event.alpha) * (rgb[c] ?? 0) + event.alpha * (event.color[c] ?? 0);
      }
    }
  }
}
