/**
 * CpuOrbitalRenderer.ts
 *
 * The fallback renderer, and the reference the GPU is checked against. It runs
 * OrbitalRayMarcher pixel by pixel, which is far too slow for one frame, so the
 * work is split two ways:
 *
 *   - time-sliced: each render() call shades rows until CPU_FRAME_BUDGET_MS
 *     has passed, then yields to the animation frame;
 *   - progressive: the image is rendered at each of CPU_RESOLUTIONS in turn,
 *     and each finished level replaces the last. So a change shows coarsely
 *     within a few frames and sharpens while the view stays still.
 */

import { createColorLuts } from "../view/Colormaps.js";
import type { CameraFrame } from "../view/OrbitCamera.js";
import { OrbitalRayMarcher } from "./OrbitalRayMarcher.js";
import type { OrbitalRenderer } from "./OrbitalRenderer.js";
import type { OrbitalScene } from "./OrbitalScene.js";
import { paintPointCloud } from "./PointCloudPainter.js";

/** Square resolutions rendered in turn, coarse to fine. */
export const CPU_RESOLUTIONS = [32, 64, 128, 256] as const;

/** Wall-clock budget per animation frame, in milliseconds. */
const CPU_FRAME_BUDGET_MS = 12;

const BYTE = 255;

export class CpuOrbitalRenderer implements OrbitalRenderer {
  public readonly canvas: HTMLCanvasElement;
  public readonly backend = "cpu";

  private readonly displayContext: CanvasRenderingContext2D;
  private readonly levelCanvas: HTMLCanvasElement;
  private readonly rgb = [0, 0, 0];

  private scene: OrbitalScene | null = null;
  private frame: CameraFrame | null = null;
  private colorLuts: Float32Array | null = null;
  private marcher: OrbitalRayMarcher | null = null;
  private level = 0;
  private row = 0;
  private imageData: ImageData | null = null;
  private pointsDirty = true;

  public constructor() {
    const finest = CPU_RESOLUTIONS[CPU_RESOLUTIONS.length - 1] ?? 1;
    this.canvas = document.createElement("canvas");
    this.canvas.width = finest;
    this.canvas.height = finest;
    this.levelCanvas = document.createElement("canvas");
    const displayContext = this.canvas.getContext("2d");
    if (!displayContext) {
      throw new Error("2D canvas context unavailable");
    }
    this.displayContext = displayContext;
  }

  public setScene(scene: OrbitalScene): void {
    if (scene.phaseColormap !== this.scene?.phaseColormap) {
      this.colorLuts = createColorLuts(scene.phaseColormap);
    }
    this.scene = scene;
    this.restart();
  }

  public setCamera(frame: CameraFrame): void {
    this.frame = frame;
    this.restart();
  }

  private restart(): void {
    this.pointsDirty = true;
    this.marcher =
      this.scene && this.frame && this.colorLuts ? new OrbitalRayMarcher(this.scene, this.frame, this.colorLuts) : null;
    this.level = 0;
    this.row = 0;
    this.imageData = null;
  }

  public render(): boolean {
    if (this.scene?.mode === "dots" && this.frame && this.colorLuts) {
      if (!this.pointsDirty) {
        return false;
      }
      paintPointCloud(this.displayContext, this.canvas.width, this.scene, this.frame, this.colorLuts);
      this.pointsDirty = false;
      return true;
    }
    const resolution = CPU_RESOLUTIONS[this.level];
    if (!(this.marcher && resolution)) {
      return false;
    }
    const levelContext = this.levelCanvas.getContext("2d");
    if (!levelContext) {
      return false;
    }
    if (!this.imageData) {
      this.levelCanvas.width = resolution;
      this.levelCanvas.height = resolution;
      this.imageData = levelContext.createImageData(resolution, resolution);
    }
    const data = this.imageData.data;
    const start = performance.now();
    while (this.row < resolution && performance.now() - start < CPU_FRAME_BUDGET_MS) {
      for (let column = 0; column < resolution; column++) {
        this.marcher.shade(column, this.row, resolution, this.rgb);
        const offset = 4 * (this.row * resolution + column);
        data[offset] = (this.rgb[0] ?? 0) * BYTE;
        data[offset + 1] = (this.rgb[1] ?? 0) * BYTE;
        data[offset + 2] = (this.rgb[2] ?? 0) * BYTE;
        data[offset + 3] = BYTE;
      }
      this.row++;
    }
    if (this.row < resolution) {
      return false;
    }
    levelContext.putImageData(this.imageData, 0, 0);
    this.displayContext.imageSmoothingEnabled = true;
    this.displayContext.drawImage(this.levelCanvas, 0, 0, this.canvas.width, this.canvas.height);
    this.level++;
    this.row = 0;
    this.imageData = null;
    return true;
  }

  public dispose(): void {
    this.marcher = null;
    this.scene = null;
    this.frame = null;
    this.colorLuts = null;
    this.imageData = null;
    this.canvas.width = 0;
    this.canvas.height = 0;
    this.levelCanvas.width = 0;
    this.levelCanvas.height = 0;
  }
}
