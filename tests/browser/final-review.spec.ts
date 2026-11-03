import { expect, test } from "@playwright/test";

test.use({
  viewport: { width: 390, height: 844 },
  hasTouch: true,
  trace: "off",
  video: "off",
  launchOptions: {
    args: ["--enable-unsafe-webgpu", "--enable-features=Vulkan"],
    ...(process.env["QUANTUM_CHROME"] && { executablePath: process.env["QUANTUM_CHROME"] }),
  },
});
const screen = "window.phet.joist.sim.selectedScreenProperty.value";
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
for (const index of [1, 2, 3, 4, 5]) {
  test(`portrait scroll, focus reveal and rotation restore screen ${index}`, async ({ page }) => {
    await page.goto(`/?screens=${index}&ea&quality=low${index % 2 === 0 ? "&locale=fr&colorProfile=projector" : ""}`);
    await page.getByRole("button", { name: "Reset All" }).waitFor();
    expect(await page.evaluate(`${screen}.view.portraitProperty.value`)).toBe(true);
    const scroll = page.getByRole("slider", {
      name: index % 2 === 0 ? "Faire défiler la page" : "Scroll page",
      exact: true,
    });
    await scroll.focus();
    await scroll.press("ArrowDown");
    expect(await page.evaluate<number>(`${screen}.view.scrollProperty.value`)).toBeGreaterThan(0);
    await page.getByRole("button", { name: "Reset All" }).focus();
    expect(await page.evaluate<number>(`${screen}.view.scrollProperty.value`)).toBeGreaterThan(0.8);
    const resetBounds = await page.evaluate<{ top: number; bottom: number }>(
      `(()=>{const v=${screen}.view;const visit=n=>n.constructor.name==='ResetAllButton'?n:n.children.map(visit).find(Boolean);const n=visit(v);return {top:n.globalBounds.top,bottom:n.globalBounds.bottom};})()`,
    );
    expect(resetBounds.top).toBeGreaterThanOrEqual(0);
    expect(resetBounds.bottom).toBeLessThan(844);
    await page.setViewportSize({ width: 1440, height: 900 });
    await expect.poll(() => page.evaluate(`${screen}.view.portraitProperty.value`)).toBe(false);
    await expect(scroll).not.toBeAttached();
    if (index === 1 || index === 2 || index === 5) {
      expect(await page.evaluate<number>(`${screen}.view.viewport.globalBounds.width`)).toBeGreaterThan(400);
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await scroll.waitFor();
    expect(await page.evaluate(`${screen}.view.scrollProperty.value`)).toBe(0);
    // Swipe the margin, where no quantum-number or camera gesture competes with scrolling.
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: 5, y: 600 }] });
    for (const y of [550, 450, 350]) {
      await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: 5, y }] });
    }
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    expect(await page.evaluate<number>(`${screen}.view.scrollProperty.value`)).toBeGreaterThan(0);
  });
}
test("surface work remains responsive under 4x CPU throttling and superseded requests finish on the latest state", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/?screens=5&ea&quality=low");
  await page.getByRole("button", { name: "Reset All" }).waitFor();
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  const duration = await page.evaluate<number>(
    `(()=>{const {model:m,view:v}=${screen};m.shellProperty.value=4;m.cartesianIndexProperty.value=14;const start=performance.now();m.modeProperty.value='isosurface';v.viewport.step();return performance.now()-start;})()`,
  );
  expect(duration).toBeLessThan(100);
  expect(await page.evaluate(`${screen}.view.viewport.surfacePendingProperty.value`)).toBe(true);
  await page.getByRole("application").focus();
  await page.getByRole("application").press("ArrowRight");
  await page.getByRole("slider", { name: "Shell N", exact: true }).press("Home");
  await expect
    .poll(() => page.evaluate(`${screen}.view.viewport.surfacePendingProperty.value`), { timeout: 20000 })
    .toBe(false);
  expect(
    await page.evaluate(`${screen}.view.viewport.surface.snapshot === ${screen}.model.wavefunctionProperty.value`),
  ).toBe(true);
  expect(await page.evaluate<number>(`${screen}.view.viewport.surface.totalProbability`)).toBeCloseTo(1, 2);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 1 });
});
test("native accessibility tree exposes live physical readouts", async ({ page }) => {
  await page.goto("/?screens=1&ea&quality=low");
  await page.getByRole("button", { name: "Reset All" }).waitFor();
  const cdp = await page.context().newCDPSession(page);
  const before = await cdp.send("Accessibility.getFullAXTree");
  expect(before.nodes.some((n) => n.name?.value?.includes("Mean radius 5.00"))).toBe(true);
  await page.getByRole("slider", { name: "Principal quantum number n", exact: true }).press("Home");
  const after = await cdp.send("Accessibility.getFullAXTree");
  expect(after.nodes.some((n) => n.name?.value?.includes("Mean radius 1.50"))).toBe(true);
});
test("portrait screen navigation and full-size display settings work without the small footer", async ({ page }) => {
  await page.goto("/?initialScreen=1&ea&quality=low");
  const selector = page.getByRole("button", { name: "Screen Orbitals", exact: true });
  await selector.press("Space");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await expect.poll(() => page.evaluate(`${screen}.nameProperty.value`)).toBe("Superposition");
  await page.getByRole("button", { name: "Display settings", exact: true }).press("Space");
  const dialog = page.getByRole("dialog", { name: "Display settings", exact: true });
  await expect(dialog).toBeVisible();
  const bounds = await page.evaluate<{ width: number; height: number }>(
    "(()=>{const s=window.phet.joist.sim;const find=n=>n.constructor.name==='Dialog'&&n.isShowingProperty?.value?n:n.children.map(find).find(Boolean);const d=find(s.display.rootNode);return {width:d.globalBounds.width,height:d.globalBounds.height};})()",
  );
  expect(bounds.width).toBeGreaterThan(250);
  expect(bounds.width).toBeLessThan(390);
  expect(bounds.height).toBeLessThan(844);
  await page.getByRole("radio", { name: "Picometres (pm)", exact: true }).press("Space");
  await page.getByRole("button", { name: "Close", exact: true }).press("Space");
  await expect(page.locator("body")).toContainText("pm");
});
test("all five screens survive randomized listener order and seeded pointer fuzz", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  for (const index of [1, 2, 3, 4, 5]) {
    await page.goto(`/?screens=${index}&ea&listenerOrder=random&fuzz&fuzzRate=20&seed=731902&quality=low`);
    await page.getByRole("button", { name: "Reset All" }).waitFor();
    // biome-ignore lint/suspicious/noPlaywrightWaitForTimeout: seeded fuzz runs for a fixed duration by design.
    await page.waitForTimeout(4000);
  }
});
