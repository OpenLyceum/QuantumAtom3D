import { expect, test } from "@playwright/test";
import type { OrbitalsModel } from "../../src/orbitals/model/OrbitalsModel.js";
import type { OrbitalsScreenView } from "../../src/orbitals/view/OrbitalsScreenView.js";

// Optional Windows Chrome path allows a real GPU check when WSL cannot present WebGPU.
test.use({
  launchOptions: {
    args: ["--enable-unsafe-webgpu", "--enable-features=Vulkan"],
    ...(process.env["QUANTUM_CHROME"] && { executablePath: process.env["QUANTUM_CHROME"] }),
  },
});

function screen() {
  return (
    window as unknown as {
      phet: {
        joist: {
          sim: {
            selectedScreenProperty: {
              value: { model: OrbitalsModel; view: OrbitalsScreenView };
            };
          };
        };
      };
    }
  ).phet.joist.sim.selectedScreenProperty.value;
}

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

test("CPU volume, keyboard orbit/zoom, slider parity, slice panel and Reset All", async ({ page }) => {
  await page.goto("/?screens=1&forceCpu=true&ea");
  await page.getByRole("button", { name: "Reset All" }).waitFor();
  // Read only scalar state; Scenery's graph is cyclic.
  const read = async () =>
    page.evaluate<{
      yaw: number;
      pitch: number;
      zoom: number;
      backend: string;
    }>(`(() => { const s = (${screen.toString()})(); return {
    yaw: s.view.viewport.camera.yawProperty.value, pitch: s.view.viewport.camera.pitchProperty.value,
    zoom: s.model.zoomLevelProperty.value, backend: s.view.viewport.engine.backend
  }; })()`);
  const before = await read();
  expect(before.backend).toBe("cpu");
  const view = page.getByRole("application", { name: "3D orbital" });
  await view.focus();
  await view.press("ArrowRight");
  await view.press("ArrowUp");
  await view.press("+");
  const after = await read();
  expect(after.yaw).toBeGreaterThan(before.yaw);
  expect(after.pitch).toBeGreaterThan(before.pitch);
  expect(after.zoom).toBe(before.zoom + 1);
  await page.getByRole("slider", { name: "Azimuth", exact: true }).press("ArrowLeft");
  expect((await read()).yaw).toBeLessThan(after.yaw);
  await page.getByRole("radio", { name: "Cross-section", exact: true }).press("Space");
  await expect(page.getByRole("slider", { name: "Offset", exact: true })).toBeAttached();
  await page.getByRole("button", { name: "Reset All" }).press("Space");
  expect(await read()).toEqual(before);
  await expect(page.getByRole("slider", { name: "Offset", exact: true })).not.toBeAttached();
  await expect
    .poll(async () =>
      page.evaluate(`(() => {
    const c = (${screen.toString()})().view.viewport.engine.canvas;
    return c.getContext('2d').getImageData(0,0,c.width,c.height).data.some((x,i) => i%4 !== 3 && x > 30);
  })()`),
    )
    .toBe(true);
});

test("keyboard help opens with orbit and zoom shortcuts", async ({ page }) => {
  await page.goto("/?screens=1&forceCpu=true&ea");
  await page.getByRole("button", { name: "Keyboard Shortcuts", exact: true }).press("Space");
  await expect(page.getByRole("dialog")).toBeAttached();
  await expect(page.getByRole("dialog")).toContainText("Zoom the focused 3D view");
});

for (const forceCpu of [true, false]) {
  test(`render modes, enclosed fraction and linked radial probe (${forceCpu ? "CPU" : "GPU"})`, async ({ page }) => {
    await page.goto(`/?screens=1&forceCpu=${forceCpu}&ea`);
    await page.getByRole("button", { name: "Reset All" }).waitFor();
    const readPixels = () => page.evaluate<string>(`(${screen.toString()})().view.viewport.engine.canvas.toDataURL()`);
    const nextFrames = () =>
      page.evaluate(
        () => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))),
      );
    /** The canvas once two reads a couple of frames apart agree, i.e. rendering has settled. */
    const settledPixels = async (): Promise<string> => {
      let previous = await readPixels();
      await expect
        .poll(async () => {
          await nextFrames();
          const current = await readPixels();
          const settled = current === previous;
          previous = current;
          return settled;
        })
        .toBe(true);
      return previous;
    };
    await page.getByRole("radio", { name: "Dots", exact: true }).press("Space");
    await expect.poll(() => page.evaluate(`(${screen.toString()})().model.renderModeProperty.value`)).toBe("dots");
    const dots = await settledPixels();
    await page.getByRole("radio", { name: "Isosurface", exact: true }).press("Space");
    await expect.poll(readPixels).not.toBe(dots);
    const iso90 = await settledPixels();
    expect(iso90).not.toBe(dots);
    await page.getByRole("radio", { name: "95%", exact: true }).press("Space");
    await expect.poll(readPixels).not.toBe(iso90);
    await page.getByRole("radio", { name: "Dots", exact: true }).press("Space");
    await expect.poll(readPixels).toBe(dots);
    await expect(page.getByRole("radio", { name: "95%", exact: true })).not.toBeAttached();
    const probe = page.getByRole("slider", { name: "Probe radius", exact: true });
    await probe.press("Home");
    await probe.press("ArrowRight");
    expect(await page.evaluate(`(${screen.toString()})().model.probeFractionProperty.value`)).toBeCloseTo(0.01);
    const position = await page.evaluate<{ x: number; y: number }>(`(() => {
      const v = (${screen.toString()})().view.viewport;
      const p = v.localToGlobalPoint(v.localBounds.center.copy().setXY(0.75 * 340, 0.5 * 340));
      return {x:p.x,y:p.y};
    })()`);
    await page.mouse.move(position.x, position.y);
    await expect
      .poll(() => page.evaluate<number>(`(${screen.toString()})().model.probeFractionProperty.value`))
      .toBeCloseTo(0.5, 2);
    await page.getByRole("button", { name: "Reset All" }).press("Space");
    expect(await page.evaluate(`(${screen.toString()})().model.probeFractionProperty.value`)).toBe(0);
    expect(await page.evaluate(`(${screen.toString()})().model.renderModeProperty.value`)).toBe("volume");
    await page.getByRole("button", { name: "1s", exact: true }).press("Space");
    expect(await page.evaluate(`(${screen.toString()})().model.quantumNumbers.nProperty.value`)).toBe(1);
    await page.getByRole("button", { name: "2p, m = +1", exact: true }).press("Space");
    expect(await page.evaluate(`(${screen.toString()})().model.quantumNumbers.mProperty.value`)).toBe(1);
    await page.getByRole("checkbox", { name: "3D nodes", exact: true }).press("Space");
    await page.getByRole("radio", { name: "Cross-section", exact: true }).press("Space");
    await page.getByRole("checkbox", { name: "Show cutting plane in 3D", exact: true }).press("Space");
    const center = await page.evaluate<{ x: number; y: number; yaw: number }>(`(() => {
      const v=(${screen.toString()})().view.viewport;
      const p=v.localToGlobalPoint(v.localBounds.center.copy().setXY(170,170));
      return {x:p.x,y:p.y,yaw:v.camera.yawProperty.value};
    })()`);
    await page.mouse.move(center.x, center.y);
    await page.mouse.down();
    await page.mouse.move(center.x + 25, center.y, { steps: 4 });
    await page.mouse.up();
    expect(await page.evaluate(`(${screen.toString()})().model.sliceOffsetFractionProperty.value`)).toBeGreaterThan(0);
    expect(await page.evaluate(`(${screen.toString()})().view.viewport.camera.yawProperty.value`)).toBe(center.yaw);
    await page.getByRole("slider", { name: "Offset", exact: true }).press("Home");
    expect(await page.evaluate(`(${screen.toString()})().model.sliceOffsetFractionProperty.value`)).toBe(-1);
    await page.getByRole("radio", { name: "Dots", exact: true }).press("Space");
    await expect.poll(() => page.evaluate(`(${screen.toString()})().model.renderModeProperty.value`)).toBe("dots");
    await page.getByRole("button", { name: "Reset All" }).press("Space");
    expect(await page.evaluate(`(${screen.toString()})().model.cuttingPlaneVisibleProperty.value`)).toBe(false);
  });
}

test("GPU volume and isosurface pixels match the CPU reference", async ({ page }) => {
  await page.goto("/?screens=1&ea");
  await page.getByRole("button", { name: "Reset All" }).waitFor();
  const status = await page.evaluate(async () => {
    const path = "/src/common/gpu/GpuContext.ts";
    const { getGpuInitializationResult } = await import(path);
    const { context, reason, diagnostics } = getGpuInitializationResult();
    return { available: !!context, reason, diagnostics };
  });
  if (process.env["QUANTUM_REQUIRE_GPU"]) {
    expect(status, `GPU must be available for this run: ${JSON.stringify(status)}`).toMatchObject({ available: true });
  }
  test.skip(!status.available, `WebGPU presentation unavailable: ${status.reason}`);
  const result = await page.evaluate(async () => {
    const load = (file: string) => import(`/src/${file}.ts`);
    const [
      { getGpuInitializationResult },
      { WebGpuOrbitalRenderer },
      { OrbitalRayMarcher },
      { orbitalTerms },
      { Wavefunction },
      { peakDensity },
      { orbitCameraFrame },
      { createColorLuts },
      { buildDensityGrid, enclosedProbabilityLevel },
      { hydrogenEnclosingRadius },
      { nodalSurfaces },
    ] = await Promise.all([
      load("common/gpu/GpuContext"),
      load("common/gpu/WebGpuOrbitalRenderer"),
      load("common/gpu/OrbitalRayMarcher"),
      load("common/model/orbital/OrbitalCatalog"),
      load("common/model/orbital/Wavefunction"),
      load("common/model/orbital/PeakDensity"),
      load("common/view/OrbitCamera"),
      load("common/view/Colormaps"),
      load("common/model/orbital/EnclosedProbability"),
      load("common/model/hydrogen/HydrogenRadial"),
      load("common/model/orbital/NodalSurfaces"),
    ]);
    const context = getGpuInitializationResult().context;
    const resolution = 65;
    const renderer = new WebGpuOrbitalRenderer(context, resolution);
    const errors: number[] = [];
    const centers: number[] = [];
    const overlayErrors: number[] = [];
    const sampledError = (
      cpu: { shade(x: number, y: number, resolution: number, out: number[]): void },
      data: Uint8ClampedArray,
    ) => {
      const rgb = [0, 0, 0];
      let worst = 0;
      for (let y = 0; y < resolution; y += 4) {
        for (let x = 0; x < resolution; x += 4) {
          cpu.shade(x, y, resolution, rgb);
          for (let c = 0; c < 3; c++) {
            worst = Math.max(worst, Math.abs((data[4 * (y * resolution + x) + c] ?? 0) / 255 - (rgb[c] ?? 0)));
          }
        }
      }
      return worst;
    };
    for (const [n, l, m, z, basis] of [
      [1, 0, 0, 1, "complex"],
      [2, 1, 0, 1, "complex"],
      [3, 2, 0, 1, "real"],
      [3, 2, -2, 1, "real"],
      [2, 1, -1, 6, "complex"],
      [5, 4, 4, 1, "complex"],
    ] as const) {
      const terms = orbitalTerms(n, l, m, basis);
      const wavefunction = new Wavefunction(terms, z);
      const grid = buildDensityGrid(wavefunction, hydrogenEnclosingRadius(n, l, z, 0.9999));
      for (const mode of ["volume", "isosurface"]) {
        for (const phaseColormap of ["hsv", "uniform"]) {
          for (const coloring of ["phase", "density"]) {
            const scene = {
              mode,
              isoLevel: enclosedProbabilityLevel(grid, 0.9),
              terms,
              nuclearCharge: z,
              inversePeakAmplitude: 1 / Math.sqrt(peakDensity(new Wavefunction(terms, z))),
              radius: (3 * n * n) / z,
              coloring,
              phaseColormap,
            };
            const frame = orbitCameraFrame(0, 0);
            renderer.setScene(scene);
            renderer.setCamera(frame);
            renderer.render();
            const data = renderer.canvas.getContext("2d").getImageData(0, 0, resolution, resolution).data;
            const cpu = new OrbitalRayMarcher(scene, frame, createColorLuts(phaseColormap));
            errors.push(sampledError(cpu, data));
            const overlayScene = {
              ...scene,
              nodes: nodalSurfaces(n, l, m, z, basis),
              cuttingPlane: { normal: [1, 0, 0], offset: 0.17 * scene.radius },
            };
            renderer.setScene(overlayScene);
            const overlayFrame = orbitCameraFrame(0.43, 0.27);
            renderer.setCamera(overlayFrame);
            renderer.render();
            const overlayPixels = renderer.canvas.getContext("2d").getImageData(0, 0, resolution, resolution).data;
            overlayErrors.push(
              sampledError(
                new OrbitalRayMarcher(overlayScene, overlayFrame, createColorLuts(phaseColormap)),
                overlayPixels,
              ),
            );
            if (mode === "volume" && phaseColormap === "hsv" && coloring === "phase") {
              centers.push(Math.max(...data.slice(4 * (32 * resolution + 32), 4 * (32 * resolution + 32) + 3)));
            }
          }
        }
      }
    }
    renderer.dispose();
    return { errors, centers, overlayErrors };
  });
  expect(Math.max(...result.errors)).toBeLessThan(0.045);
  expect(Math.max(...result.overlayErrors)).toBeLessThan(0.045);
  expect(result.centers[0]).toBeGreaterThan(40); // 1s filled centre
  expect(result.centers[1]).toBeLessThan(2); // 2p_z plane edge-on
});

test("GPU device loss switches an existing viewport to the CPU", async ({ page }) => {
  await page.goto("/?screens=1&ea");
  await page.getByRole("button", { name: "Reset All" }).waitFor();
  const available = await page.evaluate(async () => {
    const path = "/src/common/gpu/GpuContext.ts";
    const { getGpuInitializationResult } = await import(path);
    const { context } = getGpuInitializationResult();
    if (!context) {
      return false;
    }
    context.device.destroy();
    await context.device.lost;
    return true;
  });
  test.skip(!available, "Requires WebGPU presentation");
  await expect.poll(() => page.evaluate(`(${screen.toString()})().view.viewport.engine.backend`)).toBe("cpu");
  await expect
    .poll(() =>
      page.evaluate(`(() => {
    const c = (${screen.toString()})().view.viewport.engine.canvas;
    return c.getContext('2d').getImageData(0,0,c.width,c.height).data.some((x,i) => i%4 !== 3 && x > 30);
  })()`),
    )
    .toBe(true);
});

test("shader diagnostics select CPU without preventing startup", async ({ page }) => {
  await page.addInitScript(() => {
    if (typeof GPUShaderModule !== "undefined") {
      GPUShaderModule.prototype.getCompilationInfo = async () =>
        ({
          messages: [
            {
              type: "error",
              message: "Test shader rejection",
              lineNum: 1,
              linePos: 1,
              offset: 0,
              length: 1,
            },
          ],
        }) as GPUCompilationInfo;
    }
  });
  await page.goto("/?screens=1&ea");
  await page.getByRole("button", { name: "Reset All" }).waitFor();
  expect(await page.evaluate(`(${screen.toString()})().view.viewport.engine.backend`)).toBe("cpu");
  const reason = await page.evaluate(async () => {
    const path = "/src/common/gpu/GpuContext.ts";
    return (await import(path)).getGpuInitializationResult().reason;
  });
  if (process.env["QUANTUM_REQUIRE_GPU"]) {
    expect(reason).toBe("shaderError");
  }
});

test("browser without WebGPU still starts and draws a volume", async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, "gpu", { value: undefined }));
  await page.goto("/?screens=1&ea");
  await page.getByRole("button", { name: "Reset All" }).waitFor();
  expect(await page.evaluate(`(${screen.toString()})().view.viewport.engine.backend`)).toBe("cpu");
  await expect
    .poll(() =>
      page.evaluate(`(() => {
    const c = (${screen.toString()})().view.viewport.engine.canvas;
    return c.getContext('2d').getImageData(0,0,c.width,c.height).data.some((x,i) => i%4 !== 3 && x > 30);
  })()`),
    )
    .toBe(true);
});

test("pointer orbit and Z scaling keep their independent view state", async ({ page }) => {
  await page.goto("/?screens=1&forceCpu=true&ea");
  await page.getByRole("button", { name: "Reset All" }).waitFor();
  const point = (await page.evaluate(`(() => {
    const v = (${screen.toString()})().view.viewport;
    const p = v.localToGlobalPoint(v.localBounds.center);
    return { x: p.x, y: p.y, yaw: v.camera.yawProperty.value };
  })()`)) as { x: number; y: number; yaw: number };
  await page.mouse.move(point.x, point.y);
  await page.mouse.down();
  await page.mouse.move(point.x + 50, point.y + 25, { steps: 5 });
  await page.mouse.up();
  expect(await page.evaluate(`(${screen.toString()})().view.viewport.camera.yawProperty.value`)).not.toBe(point.yaw);
  const before = await page.evaluate(`(${screen.toString()})().model.viewHalfWidthProperty.value`);
  await page.getByRole("slider", { name: "Nuclear charge Z", exact: true }).press("End");
  expect(await page.evaluate(`(${screen.toString()})().model.nuclearChargeProperty.value`)).toBe(6);
  expect(await page.evaluate(`(${screen.toString()})().model.viewHalfWidthProperty.value`)).toBe(before);
});
