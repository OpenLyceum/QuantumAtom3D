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
test("orbital and coupled constraints, half-integer values, playback and reset", async ({ page }) => {
  await page.goto("/?screens=3&forceCpu=true&ea");
  const l = page.getByRole("slider", { name: "Orbital quantum number l", exact: true });
  await l.press("End");
  await page.getByRole("slider", { name: "Magnetic quantum number m", exact: true }).press("End");
  expect(await page.evaluate(`${model}.mProperty.value`)).toBe(4);
  await l.press("Home");
  expect(await page.evaluate(`${model}.mProperty.value`)).toBe(0);
  await page.getByRole("checkbox").press("Space");
  const mj = page.getByRole("slider", { name: "Total projection mⱼ", exact: true });
  await expect(mj).toHaveAttribute("aria-valuenow", "0.5");
  await mj.press("ArrowLeft");
  expect(await page.evaluate(`${model}.mjProperty.value`)).toBe(-0.5);
  await l.press("End");
  await mj.press("End");
  await page.getByRole("radio", { name: "j = |l − ½|", exact: true }).press("Space");
  expect(await page.evaluate(`${model}.mjProperty.value`)).toBe(3.5);
  await page.getByRole("button", { name: "Play", exact: true }).press("Space");
  await expect.poll(() => page.evaluate<number>(`${model}.phaseProperty.value`)).toBeGreaterThan(0);
  await page.getByRole("button", { name: "Pause", exact: true }).press("Space");
  await page.getByRole("slider", { name: "Precession phase", exact: true }).press("End");
  expect(await page.evaluate(`${model}.phaseProperty.value`)).toBeCloseTo(2 * Math.PI);
  await page.getByRole("button", { name: "Reset All" }).press("Space");
  expect(await page.evaluate(`${model}.lProperty.value`)).toBe(1);
  expect(await page.evaluate(`${model}.spinProperty.value`)).toBe(false);
  expect(await page.evaluate(`${model}.phaseProperty.value`)).toBe(0);
  await page.getByRole("button", { name: "Keyboard Shortcuts", exact: true }).press("Space");
  await expect(page.getByRole("dialog")).toBeAttached();
});
for (const mode of ["fuzz", "fuzzBoard"]) {
  test(`Angular Momentum ${mode} smoke`, async ({ page }) => {
    await page.goto(`/?screens=3&forceCpu=true&ea&${mode}&randomSeed=731902`);
    await page.waitForTimeout(10000);
  });
}
