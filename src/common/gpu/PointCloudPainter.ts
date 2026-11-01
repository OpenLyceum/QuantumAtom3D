/** CPU reference for probability dots. Samples are static measurements, never trajectories. */
import { Wavefunction } from "../model/orbital/Wavefunction.js";
import { COLOR_LUT_SIZE } from "../view/Colormaps.js";
import { type CameraFrame, projectToScreen, type Vec3 } from "../view/OrbitCamera.js";
import type { OrbitalScene } from "./OrbitalScene.js";
import { compositeSurfaces, surfaceEvents } from "./SurfaceOverlays.js";

function paintSurfaceBackground(
  context: CanvasRenderingContext2D,
  resolution: number,
  scene: OrbitalScene,
  frame: CameraFrame,
  luts: Float32Array,
  wavefunction: Wavefunction,
): void {
  if (scene.nodes || scene.cuttingPlane) {
    const background = context.createImageData(resolution, resolution);
    for (let y = 0; y < resolution; y++) {
      for (let x = 0; x < resolution; x++) {
        const u = ((2 * (x + 0.5)) / resolution - 1) * scene.radius;
        const v = (1 - (2 * (y + 0.5)) / resolution) * scene.radius;
        const chord = Math.sqrt(Math.max(0, scene.radius ** 2 - u * u - v * v));
        const rgb = [0, 0, 0];
        if (chord > 0) {
          const origin: Vec3 = [0, 1, 2].map(
            (i) => (frame.right[i] ?? 0) * u + (frame.up[i] ?? 0) * v,
          ) as unknown as Vec3;
          compositeSurfaces(surfaceEvents(scene, origin, frame.forward, chord, wavefunction, luts), chord, rgb);
        }
        const offset = 4 * (y * resolution + x);
        for (let c = 0; c < 3; c++) {
          background.data[offset + c] = 255 * (rgb[c] ?? 0);
        }
        background.data[offset + 3] = 255;
      }
    }
    context.putImageData(background, 0, 0);
  }
}

export function paintPointCloud(
  context: CanvasRenderingContext2D,
  resolution: number,
  scene: OrbitalScene,
  frame: CameraFrame,
  luts: Float32Array,
): void {
  context.fillStyle = "rgb(0,0,0)";
  context.fillRect(0, 0, resolution, resolution);
  const points = scene.points ?? new Float32Array();
  const wavefunction = new Wavefunction(scene.terms, scene.nuclearCharge);
  paintSurfaceBackground(context, resolution, scene, frame, luts, wavefunction);
  const sample = { re: 0, im: 0 };
  const depth = (i: number) =>
    frame.forward[0] * (points[i] ?? 0) +
    frame.forward[1] * (points[i + 1] ?? 0) +
    frame.forward[2] * (points[i + 2] ?? 0);
  const indices = Array.from({ length: points.length / 3 }, (_, i) => 3 * i).sort((a, b) => depth(b) - depth(a));
  for (const index of indices) {
    const point: Vec3 = [points[index] ?? 0, points[index + 1] ?? 0, points[index + 2] ?? 0];
    if (Math.hypot(...point) > scene.radius) {
      continue;
    }
    const [u, v] = projectToScreen(frame, point);
    wavefunction.evaluate(...point, sample);
    const relative = Math.min(1, (sample.re ** 2 + sample.im ** 2) * scene.inversePeakAmplitude ** 2);
    const lutIndex =
      scene.coloring === "phase"
        ? Math.min(
            COLOR_LUT_SIZE - 1,
            Math.floor(((Math.atan2(sample.im, sample.re) + Math.PI) / (2 * Math.PI)) * COLOR_LUT_SIZE),
          )
        : COLOR_LUT_SIZE + Math.round(relative * (COLOR_LUT_SIZE - 1));
    const offset = 4 * lutIndex;
    const rgb = [luts[offset] ?? 0, luts[offset + 1] ?? 0, luts[offset + 2] ?? 0];
    if (scene.nodes || scene.cuttingPlane) {
      const origin: Vec3 = [0, 1, 2].map((i) => (frame.right[i] ?? 0) * u + (frame.up[i] ?? 0) * v) as unknown as Vec3;
      const chord = Math.sqrt(Math.max(0, scene.radius ** 2 - u * u - v * v));
      compositeSurfaces(surfaceEvents(scene, origin, frame.forward, chord, wavefunction, luts), depth(index), rgb);
    }
    context.fillStyle = `rgb(${255 * (rgb[0] ?? 0)},${255 * (rgb[1] ?? 0)},${255 * (rgb[2] ?? 0)})`;
    context.beginPath();
    context.arc(
      ((u / scene.radius + 1) * resolution) / 2,
      ((1 - v / scene.radius) * resolution) / 2,
      resolution / 400,
      0,
      2 * Math.PI,
    );
    context.fill();
  }
}
