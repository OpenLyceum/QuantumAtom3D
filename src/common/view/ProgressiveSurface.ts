/** Owns one bounded-work surface request. Superseded paused states can never publish stale thresholds. */
import { ProbabilitySurfaceTask } from "../model/orbital/ProbabilitySurfaceTask.js";
import type { Wavefunction } from "../model/orbital/Wavefunction.js";

const ANIMATION_REFRESH_MS = 250;
export class ProgressiveSurface {
  private task: ProbabilitySurfaceTask | null = null;
  private snapshot: Wavefunction | null = null;
  private radius = 0;
  private fraction = 0;
  private completedAt = -Infinity;
  public level = 0;
  public totalProbability = 0;
  public get pending(): boolean {
    return this.task !== null;
  }
  public reset(): void {
    this.task = null;
    this.snapshot = null;
    this.level = 0;
    this.totalProbability = 0;
    this.completedAt = -Infinity;
  }
  public step(wave: Wavefunction, radius: number, fraction = 0.9, playing = false): void {
    if (radius !== this.radius || fraction !== this.fraction || (!playing && this.snapshot !== wave)) {
      this.reset();
      this.radius = radius;
      this.fraction = fraction;
    }
    if (wave.terms.length === 0) {
      this.reset();
      this.snapshot = wave;
      return;
    }
    if (!this.task && wave !== this.snapshot && performance.now() - this.completedAt >= ANIMATION_REFRESH_MS) {
      this.snapshot = wave;
      this.task = new ProbabilitySurfaceTask(wave, radius, fraction);
    }
    if (this.task?.advance()) {
      this.level = this.task.level;
      this.totalProbability = this.task.totalProbability;
      this.task = null;
      this.completedAt = performance.now();
    }
  }
}
