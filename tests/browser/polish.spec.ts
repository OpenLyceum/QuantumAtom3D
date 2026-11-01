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
test("permalink constraints, unit conversion, angular section and preferences survive Reset All", async ({ page }) => {
  await page.goto("/?screens=1&ea&n=3&l=2&m=0&Z=2&basis=real&lengthUnit=pm&quality=low");
  await page.getByRole("button", { name: "Reset All" }).waitFor();
  await expect(page.locator("body")).toContainText("Mean radius 277.82 pm");
  const gpu = await page.evaluate(`${screen}.view.viewport.engine.backend === 'gpu'`);
  const qualityValue = gpu ? "renderer.canvas.width" : "maximumLevel";
  await expect.poll(() => page.evaluate(`${screen}.view.viewport.engine.${qualityValue}`)).toBe(gpu ? 128 : 1);
  if (process.env["QUANTUM_REQUIRE_GPU"]) {
    expect(await page.evaluate(`${screen}.view.viewport.engine.backend`)).toBe("gpu");
  }
  await page.getByRole("radio", { name: "Yₗₘ", exact: true }).press("Space");
  const azimuth = page.getByRole("slider", { name: "Angular section φ", exact: true });
  await azimuth.press("ArrowRight");
  await expect(page.locator("body")).toContainText("Polar section at φ = 5°");
  await page.getByRole("button", { name: "Preferences", exact: true }).press("Space");
  await page.getByRole("tab", { name: "Overview", exact: true }).press("ArrowRight");
  await page.getByRole("radio", { name: "Bohr radii (a₀)", exact: true }).press("Space");
  await page.getByRole("radio", { name: "High", exact: true }).press("Space");
  await page.getByRole("checkbox", { name: "Show wavefunction formula (Orbitals → Yₗₘ)", exact: true }).press("Space");
  await page.getByRole("button", { name: "Close", exact: true }).press("Space");
  await expect.poll(() => page.evaluate(`${screen}.view.viewport.engine.${qualityValue}`)).toBe(gpu ? 512 : 3);
  await expect(page.locator("body")).toContainText("Mean radius 5.25 a₀");
  await page.getByRole("radio", { name: "Radial probability", exact: true }).press("Space");
  // The radial tick cache must regenerate when only the unit changes.
  const tickLabels = await page.evaluate<string[]>(
    `(()=>{const v=${screen}.view;const labels=[];const visit=n=>{if(n.string)labels.push(n.string);for(const c of n.children)visit(c)};visit(v);return labels;})()`,
  );
  expect(tickLabels).toContain("5");
  expect(tickLabels).not.toContain("264.59");
  await page.getByRole("button", { name: "Reset All" }).press("Space");
  expect(await page.evaluate(`${screen}.model.quantumNumbers.nProperty.value`)).toBe(3);
  expect(await page.evaluate(`${screen}.model.nuclearChargeProperty.value`)).toBe(2);
  await expect(page.locator("body")).toContainText("Mean radius 5.25 a₀");
  await page.getByRole("radio", { name: "Yₗₘ", exact: true }).press("Space");
  await expect(azimuth).toHaveAttribute("aria-valuenow", "0");
  await page.goto("/?screens=1&ea&n=1&l=4&m=-4&forceCpu=true");
  await page.getByRole("button", { name: "Reset All" }).waitFor();
  expect(
    await page.evaluate(
      `[${screen}.model.quantumNumbers.lProperty.value,${screen}.model.quantumNumbers.mProperty.value]`,
    ),
  ).toEqual([0, 0]);
});

for (const locale of ["en", "fr", "es"]) {
  test(`all screens load with named controls, keyboard help and live descriptions (${locale})`, async ({ page }) => {
    for (let index = 1; index <= 5; index++) {
      await page.goto(
        `/?screens=${index}&locale=${locale}&colorProfile=projector&forceCpu=true&ea&quality=low&lengthUnit=pm`,
      );
      await page.getByRole("button", { name: "Reset All" }).waitFor();
      const summaryBefore = await page.locator("p").allTextContents();
      expect(summaryBefore.join(" ")).not.toMatch(/\{\{|undefined|NaN/);
      const unnamed = await page
        .locator("input,button,[role=slider],[role=radio],[role=checkbox]")
        .evaluateAll((nodes) =>
          nodes
            .filter(
              (node) =>
                node.getAttribute("tabindex") !== "-1" &&
                !(
                  node.getAttribute("aria-label") ||
                  node.getAttribute("aria-labelledby") ||
                  node.textContent?.trim() ||
                  (node instanceof HTMLInputElement && node.labels?.length)
                ),
            )
            .map((node) => node.outerHTML),
        );
      expect(unnamed).toEqual([]);
      const slider = page.getByRole("slider").first();
      await slider.press("End");
      const mutation =
        index === 1
          ? "m.quantumNumbers.nProperty.value=5"
          : index === 2
            ? "m.timeProperty.value=1"
            : index === 3
              ? "m.lProperty.value=4"
              : index === 4
                ? "m.fieldFractionProperty.value=0"
                : "m.shellProperty.value=4";
      await page.evaluate(`(()=>{const m=${screen}.model;${mutation};})()`);
      expect(await page.locator("p").allTextContents()).not.toEqual(summaryBefore);
      await page.getByRole("button", { name: "Keyboard Shortcuts", exact: true }).press("Space");
      await expect(page.getByRole("dialog")).toBeVisible();
      await page.keyboard.press("Escape");
      await page.getByRole("button", { name: "Reset All" }).press("Space");
    }
  });
}
