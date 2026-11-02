import { expect, it, vi } from "vitest";
import { ProbabilitySurfaceTask } from "../../../../src/common/model/orbital/ProbabilitySurfaceTask.js";
import { Wavefunction } from "../../../../src/common/model/orbital/Wavefunction.js";
import { ProgressiveSurface } from "../../../../src/common/view/ProgressiveSurface.js";

const ground = new Wavefunction([{ n: 1, l: 0, m: 0, re: 1, im: 0 }], 1);
function finish(task: ProbabilitySurfaceTask): void {
  while (!task.advance(20)) {
    /* Keep scheduling until both cubature and threshold search finish. */
  }
}
it("resolves compact and diffuse components of a normalized 1s + 5g state", () => {
  const task = new ProbabilitySurfaceTask(
    new Wavefunction(
      [
        { n: 1, l: 0, m: 0, re: Math.SQRT1_2, im: 0 },
        { n: 5, l: 4, m: 0, re: Math.SQRT1_2, im: 0 },
      ],
      1,
    ),
    69.40575,
  );
  finish(task);
  // Orthogonal normalized eigenstates have unit norm; the box implementation captured only 0.837.
  expect(task.totalProbability).toBeCloseTo(1, 2);
  expect(task.level).toBeGreaterThan(0);
});
it("agrees with the closed-form 1s enclosing probability and yields on its work budget", () => {
  let clock = 0;
  const now = vi.spyOn(performance, "now").mockImplementation(() => ++clock);
  const task = new ProbabilitySurfaceTask(ground, 8);
  expect(task.advance(1)).toBe(false);
  now.mockRestore();
  finish(task);
  let low = 0,
    high = 10;
  for (let i = 0; i < 60; i++) {
    const r = (low + high) / 2;
    const probability = 1 - Math.exp(-2 * r) * (1 + 2 * r + 2 * r * r);
    if (probability < 0.9) {
      low = r;
    } else {
      high = r;
    }
  }
  const exact = Math.exp((-2 * (low + high)) / 2) / Math.PI;
  expect(Math.abs(task.level / exact - 1)).toBeLessThan(0.06);
  expect(task.totalProbability).toBeCloseTo(1, 2);
});
it("supersedes unfinished paused requests and releases pending work on reset", () => {
  const surface = new ProgressiveSurface();
  surface.step(ground, 8);
  expect(surface.pending).toBe(true);
  const empty = new Wavefunction([], 1);
  surface.step(empty, 8);
  expect(surface.pending).toBe(false);
  expect(surface.level).toBe(0);
  surface.step(ground, 8);
  expect(surface.pending).toBe(true);
  surface.reset();
  expect(surface.pending).toBe(false);
});
