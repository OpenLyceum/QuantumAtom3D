/** Hysteresis on completed GPU frame latency, excluding idle gaps. */
import type { RenderQuality } from "../../preferences/QuantumAtom3DPreferencesModel.js";
import { RENDER_QUALITY_CONTROLLER_SETTINGS } from "../../QuantumAtom3DConstants.js";

const SLOW_FRAME_MS: number = RENDER_QUALITY_CONTROLLER_SETTINGS.SLOW_FRAME_MS;
const FAST_FRAME_MS: number = RENDER_QUALITY_CONTROLLER_SETTINGS.FAST_FRAME_MS;
const SLOW_FRAME_COUNT: number = RENDER_QUALITY_CONTROLLER_SETTINGS.SLOW_FRAME_COUNT;
const FAST_FRAME_COUNT: number = RENDER_QUALITY_CONTROLLER_SETTINGS.FAST_FRAME_COUNT;
const RESOLUTIONS = [128, 256, 512] as const;
export class RenderQualityController {
  public quality: RenderQuality = "high";
  private level = 2;
  private slow = 0;
  private fast = 0;
  public get resolution(): number {
    return RESOLUTIONS[this.level] ?? 512;
  }
  public setQuality(quality: RenderQuality): void {
    if (quality === this.quality) {
      return;
    }
    this.quality = quality;
    this.level = quality === "low" ? 0 : quality === "medium" ? 1 : 2;
    this.slow = 0;
    this.fast = 0;
  }
  public observe(milliseconds: number): void {
    if (this.quality !== "auto" || !Number.isFinite(milliseconds) || milliseconds < 0) {
      return;
    }
    this.slow = milliseconds > SLOW_FRAME_MS ? this.slow + 1 : 0;
    this.fast = milliseconds < FAST_FRAME_MS ? this.fast + 1 : 0;
    if (this.slow >= SLOW_FRAME_COUNT && this.level > 0) {
      this.level--;
      this.slow = 0;
      this.fast = 0;
    }
    if (this.fast >= FAST_FRAME_COUNT && this.level < 2) {
      this.level++;
      this.fast = 0;
      this.slow = 0;
    }
  }
}
