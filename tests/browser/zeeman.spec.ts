import { expect, test } from "@playwright/test";

test.use({
  launchOptions: { ...(process.env["QUANTUM_CHROME"] && { executablePath: process.env["QUANTUM_CHROME"] }) },
});
const model = "window.phet.joist.sim.selectedScreenProperty.value.model";
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
test("Zeeman modes, field units/cap, polarization, series, precession and reset", async ({ page }) => {
  await page.goto("/?screens=4&forceCpu=true&ea");
  const field = page.getByRole("slider", { name: "Magnetic field", exact: true });
  await expect(field).toHaveAttribute("aria-valuenow", "0.5");
  await field.press("End");
  await expect(field).toHaveAttribute("aria-valuenow", "1");
  await page.getByRole("radio", { name: "Anomalous (fine structure)", exact: true }).press("Space");
  await field.press("End");
  expect(await page.evaluate(`${model}.fieldFractionProperty.value`)).toBe(1);
  expect(Number(await field.getAttribute("max"))).toBeLessThan(0.01);
  await page.getByRole("radio", { name: "Along B (σ only)", exact: true }).press("Space");
  expect(await page.evaluate(`${model}.transitionsProperty.value.every(t=>t.polarization!=='pi')`)).toBe(true);
  await page.getByRole("slider", { name: "Upper level", exact: true }).press("End");
  await page.getByRole("radio", { name: "Lyα (2 → 1)", exact: true }).press("Space");
  expect(await page.evaluate(`${model}.selectedIndexProperty.value < ${model}.upperLevelsProperty.value.length`)).toBe(
    true,
  );
  const cap = Number(await field.getAttribute("max"));
  await page.getByRole("slider", { name: "Nuclear charge Z", exact: true }).press("ArrowRight");
  expect(Number(await field.getAttribute("max")) / cap).toBeCloseTo(16, 1);
  await field.press("Home");
  expect(await page.evaluate(`${model}.fieldProperty.value`)).toBe(0);
  await page.getByRole("button", { name: "Play", exact: true }).press("Space");
  await page.waitForTimeout(100);
  expect(await page.evaluate(`${model}.phaseProperty.value`)).toBe(0);
  await field.press("End");
  await expect.poll(() => page.evaluate<number>(`${model}.phaseProperty.value`)).toBeGreaterThan(0);
  await page.getByRole("button", { name: "Reset All" }).press("Space");
  expect(await page.evaluate(`${model}.modeProperty.value`)).toBe("normal");
  expect(await page.evaluate(`${model}.fieldFractionProperty.value`)).toBe(0.5);
  await page.getByRole("button", { name: "Keyboard Shortcuts", exact: true }).press("Space");
  await expect(page.getByRole("dialog")).toBeAttached();
});
for (const mode of ["fuzz", "fuzzBoard"]) {
  test(`Zeeman ${mode} smoke`, async ({ page }) => {
    await page.goto(`/?screens=4&forceCpu=true&ea&${mode}&randomSeed=731902`);
    await page.waitForTimeout(10000);
  });
}
