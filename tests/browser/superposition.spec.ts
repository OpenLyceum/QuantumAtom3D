import { expect, test } from "@playwright/test";

test.use({
  launchOptions: {
    args: ["--enable-unsafe-webgpu", "--enable-features=Vulkan"],
    ...(process.env["QUANTUM_CHROME"] && { executablePath: process.env["QUANTUM_CHROME"] }),
  },
});
const model = "window.phet.joist.sim.selectedScreenProperty.value.model";
const viewport = "window.phet.joist.sim.selectedScreenProperty.value.view.viewport";
test.beforeEach(({ page }) => {
  page.on("pageerror", (error) => {
    throw error;
  });
  page.on("console", (message) => {
    if (message.type() === "error") {
      throw new Error(message.text());
    }
  });
});

for (const mode of ["fuzz", "fuzzBoard"]) {
  test(`Superposition ${mode} smoke`, async ({ page }) => {
    await page.goto(`/?screens=2&forceCpu=true&ea&${mode}&randomSeed=731902`);
    // biome-ignore lint/suspicious/noPlaywrightWaitForTimeout: seeded fuzz runs for a fixed duration by design.
    await page.waitForTimeout(10000);
  });
}

for (const cpu of [true, false]) {
  test(`coherent mixing, playback, modes and reset (${cpu ? "CPU" : "GPU"})`, async ({ page }) => {
    await page.goto(`/?screens=2&forceCpu=${cpu}&ea`);
    await page.getByRole("button", { name: "Reset All" }).waitFor();
    if (!cpu && process.env["QUANTUM_REQUIRE_GPU"]) {
      expect(await page.evaluate(`${viewport}.engine.backend`)).toBe("gpu");
    }
    await page.getByRole("button", { name: "Step Forward", exact: true }).press("Space");
    expect(await page.evaluate<number>(`${model}.timeProperty.value`)).toBeGreaterThan(0);
    await page.getByRole("button", { name: "Play", exact: true }).press("Space");
    await expect.poll(() => page.evaluate<number>(`${model}.timeProperty.value`)).toBeGreaterThan(0.4);
    await page.getByRole("button", { name: "Pause", exact: true }).press("Space");
    const time = await page.evaluate(`${model}.timeProperty.value`);
    // biome-ignore lint/suspicious/noPlaywrightWaitForTimeout: proving the paused clock stays still needs time to pass.
    await page.waitForTimeout(100);
    expect(await page.evaluate(`${model}.timeProperty.value`)).toBe(time);
    await page.getByRole("slider", { name: "Terms", exact: true }).press("End");
    await expect(page.getByRole("slider", { name: "Term 6: Phase (rad)", exact: true })).toBeAttached();
    await page.getByRole("button", { name: "sp³", exact: true }).press("Space");
    const coefficients = await page.evaluate(`${model}.wavefunctionProperty.value.terms`);
    await page.getByRole("button", { name: "Step Forward", exact: true }).press("Space");
    expect(await page.evaluate(`${model}.wavefunctionProperty.value.terms`)).toEqual(coefficients);
    for (const mode of ["Dots", "Isosurface", "Volume"]) {
      await page.getByRole("radio", { name: mode, exact: true }).press("Space");
      await expect
        .poll(() =>
          page.evaluate(
            `(() => { const c=${viewport}.engine.canvas;return c.getContext('2d').getImageData(0,0,c.width,c.height).data.some((v,i)=>i%4!==3&&v>30); })()`,
          ),
        )
        .toBe(true);
    }
    await page.getByRole("button", { name: "Dipole", exact: true }).press("Space");
    await page.getByRole("slider", { name: "Term 1: Magnitude |c|", exact: true }).press("Home");
    await page.getByRole("slider", { name: "Term 2: Magnitude |c|", exact: true }).press("Home");
    expect(await page.evaluate(`${model}.termsProperty.value.length`)).toBe(0);
    await page.getByRole("button", { name: "Reset All" }).press("Space");
    expect(await page.evaluate(`${model}.termsProperty.value.length`)).toBe(2);
    expect(await page.evaluate(`${model}.timeProperty.value`)).toBe(0);
    await page.getByRole("button", { name: "Keyboard Shortcuts", exact: true }).press("Space");
    await expect(page.getByRole("dialog")).toContainText("Zoom the focused 3D view");
  });
}

test("GPU coherent wavefunctions match the CPU at multiple phases", async ({ page }) => {
  await page.goto("/?screens=2&ea");
  await page.getByRole("button", { name: "Reset All" }).waitFor();
  const error = await page.evaluate(async () => {
    const load = (file: string) => import(`/src/${file}.ts`);
    const [
      { getGpuInitializationResult },
      { WebGpuOrbitalRenderer },
      { OrbitalRayMarcher },
      { SUPERPOSITION_PRESETS },
      { evolveTerms },
      { createColorLuts },
      { orbitCameraFrame },
    ] = await Promise.all([
      load("common/gpu/GpuContext"),
      load("common/gpu/WebGpuOrbitalRenderer"),
      load("common/gpu/OrbitalRayMarcher"),
      load("common/model/orbital/SuperpositionPresets"),
      load("common/model/orbital/SuperpositionState"),
      load("common/view/Colormaps"),
      load("common/view/OrbitCamera"),
    ]);
    const context = getGpuInitializationResult().context;
    if (!context) {
      return null;
    }
    const renderer = new WebGpuOrbitalRenderer(context, 65);
    const frame = orbitCameraFrame(0.43, 0.27);
    const rgb = [0, 0, 0];
    let worst = 0;
    for (const terms of Object.values(SUPERPOSITION_PRESETS)) {
      for (const time of [0, 4, 8, 1e8]) {
        for (const mode of ["volume", "isosurface"]) {
          const scene = {
            mode,
            isoLevel: 0.0000882032715104129,
            terms: evolveTerms(terms, 1, time),
            nuclearCharge: 1,
            radius: 15,
            inversePeakAmplitude: 5,
            coloring: "phase",
            phaseColormap: "uniform",
            opacityGain: 16,
          };
          renderer.setScene(scene);
          renderer.setCamera(frame);
          renderer.render();
          const data = renderer.canvas.getContext("2d").getImageData(0, 0, 65, 65).data;
          const cpu = new OrbitalRayMarcher(scene, frame, createColorLuts("uniform"));
          for (let y = 0; y < 65; y += 4) {
            for (let x = 0; x < 65; x += 4) {
              cpu.shade(x, y, 65, rgb);
              for (let c = 0; c < 3; c++) {
                worst = Math.max(worst, Math.abs(data[4 * (65 * y + x) + c] / 255 - (rgb[c] ?? 0)));
              }
            }
          }
        }
      }
    }
    renderer.dispose();
    return worst;
  });
  if (process.env["QUANTUM_REQUIRE_GPU"]) {
    expect(error).not.toBeNull();
  }
  test.skip(error === null, "WebGPU presentation unavailable");
  expect(error).toBeLessThan(0.045);
});
