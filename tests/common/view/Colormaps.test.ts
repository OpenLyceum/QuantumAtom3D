import { describe, expect, it } from "vitest";
import { densityColor, phaseColor } from "../../../src/common/view/Colormaps.js";

/** Relative luminance (WCAG) of encoded sRGB components. */
function luminance(rgb: readonly number[]): number {
  const linear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * linear(rgb[0] ?? 0) + 0.7152 * linear(rgb[1] ?? 0) + 0.0722 * linear(rgb[2] ?? 0);
}

describe("Colormaps", () => {
  it("the uniform wheel stays in gamut with nearly constant luminance", () => {
    const rgb = [0, 0, 0];
    const luminances: number[] = [];
    for (let k = 0; k < 360; k++) {
      phaseColor((k * Math.PI) / 180 - Math.PI, "uniform", rgb);
      for (const c of rgb) {
        expect(c).toBeGreaterThanOrEqual(0);
        expect(c).toBeLessThanOrEqual(1);
      }
      luminances.push(luminance(rgb));
    }
    // Constant OKLab lightness keeps the WCAG luminance within a narrow band (the HSV wheel spans ~0.07–0.93).
    expect(Math.max(...luminances) - Math.min(...luminances)).toBeLessThan(0.12);
  });

  it("the HSV wheel is red at phase 0 and cyan at π", () => {
    const rgb = [0, 0, 0];
    phaseColor(0, "hsv", rgb);
    expect(rgb).toEqual([1, 0, 0]);
    phaseColor(Math.PI, "hsv", rgb);
    expect(rgb[0]).toBeCloseTo(0, 12);
    expect(rgb[1]).toBeCloseTo(1, 12);
    expect(rgb[2]).toBeCloseTo(1, 12);
  });

  it("the density ramp runs from near black to bright yellow", () => {
    const rgb = [0, 0, 0];
    densityColor(0, rgb);
    expect(luminance(rgb)).toBeLessThan(0.01);
    densityColor(1, rgb);
    expect(luminance(rgb)).toBeGreaterThan(0.8);
  });
});
