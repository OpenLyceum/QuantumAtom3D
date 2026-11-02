/**
 * createOrbitalRenderer.ts
 *
 * Picks the backend that startup settled on (see GpuContext.ts): WebGPU when a
 * validated device exists, the CPU reference otherwise.
 */

import type { RenderQuality } from "../../preferences/QuantumAtom3DPreferencesModel.js";
import type { CameraFrame } from "../view/OrbitCamera.js";
import { CpuOrbitalRenderer } from "./CpuOrbitalRenderer.js";
import { demoteGpuContext, getGpuInitializationResult } from "./GpuContext.js";
import type { OrbitalRenderer } from "./OrbitalRenderer.js";
import type { OrbitalScene } from "./OrbitalScene.js";
import { RenderQualityController } from "./RenderQualityController.js";
import { WebGpuOrbitalRenderer } from "./WebGpuOrbitalRenderer.js";
import type { WebGpuContext } from "./WebGpuSupport.js";

/** Square resolution of GPU frames, in device pixels. */
const GPU_RENDER_RESOLUTION = 512;

export function createOrbitalRenderer(): OrbitalRenderer {
  const { context } = getGpuInitializationResult();
  if (!context) {
    return new CpuOrbitalRenderer();
  }
  try {
    return new RecoverableOrbitalRenderer(context);
  } catch {
    demoteGpuContext(context);
    return new CpuOrbitalRenderer();
  }
}

/** Keeps a stable canvas and current state when a GPU disappears after startup. */
class RecoverableOrbitalRenderer implements OrbitalRenderer {
  public readonly canvas = document.createElement("canvas");
  private readonly display: CanvasRenderingContext2D;
  private readonly context: WebGpuContext;
  private renderer: OrbitalRenderer;
  private readonly quality = new RenderQualityController();
  private measuring = false;
  private disposed = false;
  private scene: OrbitalScene | null = null;
  private frame: CameraFrame | null = null;

  public constructor(context: WebGpuContext) {
    this.context = context;
    this.canvas.width = GPU_RENDER_RESOLUTION;
    this.canvas.height = GPU_RENDER_RESOLUTION;
    const display = this.canvas.getContext("2d");
    if (!display) {
      throw new Error("2D canvas context unavailable");
    }
    this.display = display;
    this.renderer = new WebGpuOrbitalRenderer(context, GPU_RENDER_RESOLUTION);
  }
  public get backend() {
    return this.renderer.backend;
  }
  public setQuality(quality: RenderQuality): void {
    this.quality.setQuality(quality);
    this.renderer.setQuality?.(quality);
  }
  public setScene(scene: OrbitalScene): void {
    this.scene = scene;
  }
  public setCamera(frame: CameraFrame): void {
    this.frame = frame;
  }

  private fallback(): void {
    demoteGpuContext(this.context);
    this.renderer.dispose();
    this.renderer = new CpuOrbitalRenderer();
    this.renderer.setQuality?.(this.quality.quality);
    this.scene ??= this.lastScene;
    this.frame ??= this.lastFrame;
  }
  private lastScene: OrbitalScene | null = null;
  private lastFrame: CameraFrame | null = null;

  public render(): boolean {
    if (this.backend === "gpu" && getGpuInitializationResult().context !== this.context) {
      this.fallback();
    }
    try {
      if (this.scene) {
        this.renderer.setScene(this.scene);
        this.lastScene = this.scene;
        this.scene = null;
      }
      if (this.frame) {
        this.renderer.setCamera(this.frame);
        this.lastFrame = this.frame;
        this.frame = null;
      }
      if (this.renderer instanceof WebGpuOrbitalRenderer) {
        this.renderer.setResolution(this.quality.resolution);
      }
      const started = performance.now();
      if (!this.renderer.render()) {
        return false;
      }
      if (this.backend === "gpu" && this.quality.quality === "auto" && !this.measuring) {
        this.measuring = true;
        this.context.device.queue.onSubmittedWorkDone().then(
          () => {
            if (!this.disposed) {
              this.quality.observe(performance.now() - started);
            }
            this.measuring = false;
          },
          () => {
            this.measuring = false;
          },
        );
      }
      this.display.drawImage(this.renderer.canvas, 0, 0, this.canvas.width, this.canvas.height);
      return true;
    } catch (error) {
      if (this.backend !== "gpu") {
        throw error;
      }
      this.fallback();
      return false;
    }
  }
  public dispose(): void {
    this.disposed = true;
    this.renderer.dispose();
    this.canvas.width = 0;
    this.canvas.height = 0;
  }
}
