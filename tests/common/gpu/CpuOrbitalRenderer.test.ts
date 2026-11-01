import { afterEach, describe, expect, it, vi } from "vitest";
import { CPU_RESOLUTIONS, CpuOrbitalRenderer } from "../../../src/common/gpu/CpuOrbitalRenderer.js";
import type { OrbitalScene } from "../../../src/common/gpu/OrbitalScene.js";
import { orbitalTerms } from "../../../src/common/model/orbital/OrbitalCatalog.js";
import { OrbitCamera } from "../../../src/common/view/OrbitCamera.js";

const scene: OrbitalScene = {
  terms: orbitalTerms(1, 0, 0, "complex"),
  nuclearCharge: 1,
  inversePeakAmplitude: Math.sqrt(Math.PI),
  radius: 5,
  coloring: "phase",
  phaseColormap: "hsv",
};

afterEach(() => vi.restoreAllMocks());

describe("progressive CPU volume", () => {
  it("time slices, finishes every refinement, then idles; camera edits restart rendering", () => {
    // One row per time slice, independent of machine speed.
    let time = 0;
    vi.spyOn(performance, "now").mockImplementation(() => {
      time += 6;
      return time;
    });
    const renderer = new CpuOrbitalRenderer();
    const camera = new OrbitCamera();
    renderer.setScene(scene);
    renderer.setCamera(camera.frame);
    let updates = 0;
    const rows = CPU_RESOLUTIONS.reduce((sum, n) => sum + n, 0);
    for (let i = 0; i < rows; i++) {
      if (renderer.render()) {
        updates++;
      }
    }
    expect(updates).toBe(CPU_RESOLUTIONS.length);
    expect(renderer.render()).toBe(false);
    camera.orbit(0.1, 0.1);
    renderer.setCamera(camera.frame);
    for (let i = 0; i < CPU_RESOLUTIONS[0] - 1; i++) {
      expect(renderer.render()).toBe(false);
    }
    expect(renderer.render()).toBe(true);
    renderer.dispose();
    expect(renderer.render()).toBe(false);
    camera.dispose();
  });
  it("wraps yaw, clamps pitch and resets the camera", () => {
    const camera = new OrbitCamera();
    const initial = camera.frame;
    camera.orbit(100 * Math.PI, 100);
    expect(camera.pitchProperty.value).toBeLessThan(Math.PI / 2);
    expect(Math.abs(camera.yawProperty.value)).toBeLessThanOrEqual(Math.PI);
    camera.reset();
    expect(camera.frame).toEqual(initial);
    camera.dispose();
  });
});
