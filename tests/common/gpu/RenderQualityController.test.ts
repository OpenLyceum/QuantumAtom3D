import { expect, it } from "vitest";
import { RenderQualityController } from "../../../src/common/gpu/RenderQualityController.js";

it("adapts only after sustained GPU latency, with bounded resolution and slower recovery", () => {
  const quality = new RenderQualityController();
  quality.setQuality("auto");
  for (let i = 0; i < 5; i++) {
    quality.observe(70);
  }
  expect(quality.resolution).toBe(512);
  quality.observe(70);
  expect(quality.resolution).toBe(256);
  for (let i = 0; i < 60; i++) {
    quality.observe(70);
  }
  expect(quality.resolution).toBe(128);
  for (let i = 0; i < 47; i++) {
    quality.observe(10);
  }
  expect(quality.resolution).toBe(128);
  quality.observe(10);
  expect(quality.resolution).toBe(256);
  quality.observe(NaN);
  quality.setQuality("high");
  for (let i = 0; i < 100; i++) {
    quality.observe(100);
  }
  expect(quality.resolution).toBe(512);
  quality.setQuality("low");
  expect(quality.resolution).toBe(128);
  quality.setQuality("medium");
  expect(quality.resolution).toBe(256);
});
