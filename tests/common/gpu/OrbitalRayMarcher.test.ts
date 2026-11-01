import { describe, expect, it } from "vitest";
import { OrbitalRayMarcher } from "../../../src/common/gpu/OrbitalRayMarcher.js";
import { type OrbitalScene, PARAMS_BYTES, packParams, pixelJitter } from "../../../src/common/gpu/OrbitalScene.js";
import { orbitalTerms } from "../../../src/common/model/orbital/OrbitalCatalog.js";
import { peakDensity } from "../../../src/common/model/orbital/PeakDensity.js";
import { Wavefunction } from "../../../src/common/model/orbital/Wavefunction.js";
import { createColorLuts } from "../../../src/common/view/Colormaps.js";
import { orbitCameraFrame, projectToScreen } from "../../../src/common/view/OrbitCamera.js";

function scene(n: number, l: number, m: number, coloring: "phase" | "density" = "phase"): OrbitalScene {
  const terms = orbitalTerms(n, l, m, "real");
  return {
    terms,
    nuclearCharge: 1,
    inversePeakAmplitude: 1 / Math.sqrt(peakDensity(new Wavefunction(terms, 1))),
    radius: 12,
    coloring,
    phaseColormap: "hsv",
  };
}

const brightness = (rgb: number[]) => (rgb[0] ?? 0) + (rgb[1] ?? 0) + (rgb[2] ?? 0);

describe("orbitCameraFrame", () => {
  it("is orthonormal and right-handed for any angles", () => {
    for (const [yaw, pitch] of [
      [0, 0],
      [0.7, -0.4],
      [3, 1.2],
    ] as const) {
      const { right, up, forward } = orbitCameraFrame(yaw, pitch);
      const dot = (a: readonly number[], b: readonly number[]) => a.reduce((s, x, i) => s + x * (b[i] ?? 0), 0);
      expect(dot(right, right)).toBeCloseTo(1, 12);
      expect(dot(up, up)).toBeCloseTo(1, 12);
      expect(dot(right, up)).toBeCloseTo(0, 12);
      expect(dot(right, forward)).toBeCloseTo(0, 12);
      expect(dot(up, forward)).toBeCloseTo(0, 12);
      // right × up = −forward
      const cross = [
        right[1] * up[2] - right[2] * up[1],
        right[2] * up[0] - right[0] * up[2],
        right[0] * up[1] - right[1] * up[0],
      ];
      expect(dot(cross, forward)).toBeCloseTo(-1, 12);
    }
  });

  it("at yaw 0 and pitch 0 looks along −x with y to the right and z up", () => {
    const frame = orbitCameraFrame(0, 0);
    expect(projectToScreen(frame, [0, 1, 0])).toEqual([1, 0]);
    expect(projectToScreen(frame, [0, 0, 1])).toEqual([0, 1]);
  });
});

describe("OrbitalRayMarcher", () => {
  const luts = createColorLuts("hsv");
  const rgb = [0, 0, 0];
  const centre = 32;
  const resolution = 65; // pixel 32 is the exact centre

  it("shows the 2p_z nodal plane edge-on as a dark centre, and a lobe above it", () => {
    const side = new OrbitalRayMarcher(scene(2, 1, 0), orbitCameraFrame(0, 0), luts);
    side.shade(centre, centre, resolution, rgb);
    expect(brightness(rgb)).toBeLessThan(1e-3);
    side.shade(centre, centre - 10, resolution, rgb); // above the plane: +z lobe, phase 0 → red
    expect(rgb[0]).toBeGreaterThan(0.2);
    expect(rgb[0]).toBeGreaterThan(5 * (rgb[2] ?? 0));
  });

  it("looking down z, the 2p_z centre ray crosses both lobes and is bright", () => {
    const top = new OrbitalRayMarcher(scene(2, 1, 0), orbitCameraFrame(0, Math.PI / 2 - 1e-6), luts);
    top.shade(centre, centre, resolution, rgb);
    expect(brightness(rgb)).toBeGreaterThan(0.3);
  });

  it("1s is brightest at the centre and black outside the sphere", () => {
    const marcher = new OrbitalRayMarcher(scene(1, 0, 0, "density"), orbitCameraFrame(0.3, 0.2), luts);
    marcher.shade(centre, centre, resolution, rgb);
    const middle = brightness(rgb);
    marcher.shade(centre + 12, centre, resolution, rgb);
    expect(middle).toBeGreaterThan(brightness(rgb));
    marcher.shade(0, 0, resolution, rgb); // corner: outside the sphere
    expect(brightness(rgb)).toBe(0);
  });
});

describe("packParams", () => {
  it("fills exactly PARAMS_BYTES and places the terms after six vec4s", () => {
    const buffer = new ArrayBuffer(PARAMS_BYTES);
    packParams(scene(3, 2, 1), orbitCameraFrame(0, 0), 512, buffer);
    expect(PARAMS_BYTES).toBe(352);
    const floats = new Float32Array(buffer);
    const ints = new Int32Array(buffer);
    expect(floats[19]).toBe(2); // two terms for a real d orbital
    expect(ints[28]).toBe(3); // n of term 0
    expect(ints[29]).toBe(2); // l of term 0
    expect(Math.abs(ints[30] ?? 0)).toBe(1); // m of term 0
  });

  it("pixelJitter is in [0, 1) and deterministic", () => {
    for (let i = 0; i < 100; i++) {
      const j = pixelJitter(i, 3 * i + 7);
      expect(j).toBeGreaterThanOrEqual(0);
      expect(j).toBeLessThan(1);
      expect(pixelJitter(i, 3 * i + 7)).toBe(j);
    }
  });
});
