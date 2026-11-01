import { expect, test } from "@playwright/test";

test.use({
  viewport: { width: 1440, height: 900 },
  trace: "off",
  video: "off",
  launchOptions: {
    args: ["--enable-unsafe-webgpu", "--enable-features=Vulkan"],
    ...(process.env["QUANTUM_CHROME"] && { executablePath: process.env["QUANTUM_CHROME"] }),
  },
});
const model = "window.phet.joist.sim.selectedScreenProperty.value.model";
const viewport = "window.phet.joist.sim.selectedScreenProperty.value.view.viewport";
for (const profile of ["default", "projector"]) {
  test(`displayed isosurface preserves both phase colours (${profile})`, async ({ page }) => {
    await page.goto(`/?screens=5&ea&colorProfile=${profile}${profile === "projector" ? "&locale=es" : "&locale=fr"}`);
    await page.getByRole("button", { name: "Reset All" }).waitFor();
    await page.evaluate(
      `${model}.shellProperty.value=4;${model}.cartesianIndexProperty.value=14;${model}.modeProperty.value='isosurface'`,
    );
    await page.waitForTimeout(500);
    const clip = await page.evaluate<{ x: number; y: number; width: number; height: number }>(
      `(()=>{const v=${viewport};const a=v.localToGlobalPoint(v.localBounds.center.copy().setXY(0,0));const b=v.localToGlobalPoint(v.localBounds.center.copy().setXY(320,320));return {x:a.x,y:a.y,width:b.x-a.x,height:b.y-a.y};})()`,
    );
    // Capture the display before reading renderer pixels so this check includes the presentation path.
    const png = await page.screenshot({ clip });
    const displayed = await page.evaluate(async (base64) => {
      const img = new Image();
      img.src = `data:image/png;base64,${base64}`;
      await img.decode();
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        throw new Error("No 2D context");
      }
      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let cyan = 0;
      for (let i = 0; i < data.length; i += 4) {
        if ((data[i] ?? 0) < 50 && (data[i + 1] ?? 0) > 80 && (data[i + 2] ?? 0) > 80) {
          cyan++;
        }
      }
      return cyan;
    }, png.toString("base64"));
    const rendered = await page.evaluate<{ count: number; width: number }>(
      `(()=>{const c=${viewport}.engine.canvas;const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let count=0;for(let i=0;i<d.length;i+=4){if(d[i]<50&&d[i+1]>80&&d[i+2]>80){count++;}}return {count,width:c.width};})()`,
    );
    expect(rendered.count).toBeGreaterThan(1000);
    expect(displayed / (rendered.count * (clip.width / rendered.width) ** 2)).toBeGreaterThan(0.9);
    expect(displayed / (rendered.count * (clip.width / rendered.width) ** 2)).toBeLessThan(1.1);
  });
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
for (const cpu of [true, false]) {
  test(`oscillator bases, nine terms, modes and reset (${cpu ? "CPU" : "GPU"})`, async ({ page }) => {
    await page.goto(`/?screens=5&forceCpu=${cpu}&ea`);
    await page.getByRole("button", { name: "Reset All" }).waitFor();
    if (!cpu && process.env["QUANTUM_REQUIRE_GPU"]) {
      expect(await page.evaluate(`${viewport}.engine.backend`)).toBe("gpu");
    }
    await page.getByRole("slider", { name: "Shell N", exact: true }).press("End");
    await page.getByRole("slider", { name: "Cartesian state (nₓ,nᵧ,n_z)", exact: true }).press("End");
    expect(await page.evaluate(`${model}.wavefunctionProperty.value.terms.length`)).toBe(9);
    await page.getByRole("radio", { name: "Isosurface", exact: true }).press("Space");
    await expect
      .poll(() =>
        page.evaluate(
          `(()=>{const c=${viewport}.engine.canvas;return c.getContext('2d').getImageData(0,0,c.width,c.height).data.some((v,i)=>i%4!==3&&v>30);})()`,
        ),
      )
      .toBe(true);
    await page.getByRole("radio", { name: "Spherical", exact: true }).press("Space");
    expect(await page.evaluate(`${model}.wavefunctionProperty.value.terms.length`)).toBe(1);
    await page.getByRole("slider", { name: "Spherical state (nᵣ,l,m)", exact: true }).press("End");
    await page.getByRole("slider", { name: "Shell N", exact: true }).press("Home");
    expect(await page.evaluate(`${model}.cartesianIndexProperty.value`)).toBe(0);
    expect(await page.evaluate(`${model}.sphericalIndexProperty.value`)).toBe(0);
    await page.getByRole("application").focus();
    await page.getByRole("application").press("+");
    expect(await page.evaluate(`${model}.zoomProperty.value`)).toBe(1);
    await page.getByRole("button", { name: "Reset All" }).press("Space");
    expect(await page.evaluate(`${model}.shellProperty.value`)).toBe(1);
    expect(await page.evaluate(`${model}.zoomProperty.value`)).toBe(0);
    await page.getByRole("button", { name: "Keyboard Shortcuts", exact: true }).press("Space");
    await expect(page.getByRole("dialog")).toContainText("Zoom the focused 3D view");
  });
}
for (const mode of ["fuzz", "fuzzBoard"]) {
  test(`Oscillator ${mode} smoke`, async ({ page }) => {
    await page.goto(`/?screens=5&forceCpu=true&ea&${mode}&randomSeed=731902`);
    await page.waitForTimeout(10000);
  });
}
test("GPU oscillator fields agree with independent CPU evaluation across both complete bases", async ({ page }) => {
  await page.goto("/?screens=5&ea");
  await page.getByRole("button", { name: "Reset All" }).waitFor();
  const result = await page.evaluate(async () => {
    const load = (file: string) => import(`/src/${file}.ts`);
    const [
      { getGpuInitializationResult },
      { WebGpuOrbitalRenderer },
      { OrbitalRayMarcher },
      { cartesianStates, cartesianExpansion, sphericalStates },
      { createColorLuts },
      { orbitCameraFrame },
    ] = await Promise.all([
      load("common/gpu/GpuContext"),
      load("common/gpu/WebGpuOrbitalRenderer"),
      load("common/gpu/OrbitalRayMarcher"),
      load("common/model/oscillator/OscillatorStates"),
      load("common/view/Colormaps"),
      load("common/view/OrbitCamera"),
    ]);
    const context = getGpuInitializationResult().context;
    if (!context) {
      return null;
    }
    const renderer = new WebGpuOrbitalRenderer(context, 33);
    const frame = orbitCameraFrame(0.43, 0.27);
    const rgb = [0, 0, 0];
    let worst = 0;
    const compare = (
      cpu: { shade(x: number, y: number, resolution: number, out: number[]): void },
      data: Uint8ClampedArray,
    ) => {
      let error = 0;
      for (let y = 0; y < 33; y += 4) {
        for (let x = 0; x < 33; x += 4) {
          cpu.shade(x, y, 33, rgb);
          for (let c = 0; c < 3; c++) {
            error = Math.max(error, Math.abs((data[4 * (33 * y + x) + c] ?? 0) / 255 - (rgb[c] ?? 0)));
          }
        }
      }
      return error;
    };
    for (let N = 0; N <= 4; N++) {
      const states = [
        ...cartesianStates(N).map(cartesianExpansion),
        ...sphericalStates(N).map((s: { nr: number; l: number; m: number }) => [
          { n: s.nr, l: s.l, m: s.m, re: 1, im: 0 },
        ]),
      ];
      for (const terms of states) {
        const scene = {
          family: "oscillator",
          terms,
          nuclearCharge: 1,
          radius: 5.5,
          inversePeakAmplitude: 5,
          coloring: "phase",
          phaseColormap: "uniform",
        };
        renderer.setScene(scene);
        renderer.setCamera(frame);
        renderer.render();
        const data = renderer.canvas.getContext("2d").getImageData(0, 0, 33, 33).data;
        worst = Math.max(worst, compare(new OrbitalRayMarcher(scene, frame, createColorLuts("uniform")), data));
      }
    }
    renderer.dispose();
    return worst;
  });
  if (process.env["QUANTUM_REQUIRE_GPU"]) {
    expect(result).not.toBeNull();
  }
  test.skip(result === null, "WebGPU unavailable");
  expect(result).toBeLessThan(0.045);
});
