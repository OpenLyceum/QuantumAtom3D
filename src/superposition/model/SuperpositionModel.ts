/**
 * SuperpositionModel.ts
 *
 * Model for the Superposition screen: a mixture of hydrogenic eigenstates
 * evolving as ψ(t) = Σ_k c_k e^{−iE_k t/ħ} ψ_k. The clock is a composed
 * TimeModel; the state terms and their phases are added with the shared
 * wavefunction model.
 */
import type { TModel } from "scenerystack/joist";
import { TimeModel } from "../../common/TimeModel.js";

export class SuperpositionModel implements TModel {
  /** Play/pause and elapsed wall-clock time; the model maps it to atomic time units. */
  public readonly timer = new TimeModel();

  /** Resets all model state to initial values. Called by Reset All. */
  public reset(): void {
    this.timer.reset();
  }

  /**
   * Steps the model forward by dt seconds of wall-clock time.
   *
   * @param dt - elapsed time in seconds since the last frame
   */
  public step(dt: number): void {
    this.timer.step(dt);
  }

  public dispose(): void {
    this.timer.dispose();
  }
}
