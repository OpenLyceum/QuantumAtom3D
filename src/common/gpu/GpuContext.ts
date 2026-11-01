/**
 * GpuContext.ts
 *
 * One WebGPU device for the whole sim, acquired once before the first screen is
 * built. Adapted from HeatTransfer (src/common/field/gpu/GpuContext.ts).
 *
 * SceneryStack builds a screen's model and view lazily and synchronously, and
 * cannot wait for a GPU. So the one asynchronous question, "do we have a
 * working GPU?", is answered here during startup, while the splash screen is
 * up. Afterwards, creating a renderer is an ordinary synchronous call.
 *
 * "Working" means more than "a device came back":
 *   - Every shader is compiled and its diagnostics read. WGSL errors never
 *     throw, so a shader broken on one driver would otherwise just draw black.
 *   - A probe checks that a WebGPU canvas can be drawn into a 2D canvas. That
 *     is how the frames reach Scenery, and some software rasterizers compute
 *     correctly but present nothing.
 * Any failure sends the whole sim to the CPU renderer, and the 3D view says so.
 */

import { ORBITAL_RENDER_SHADER } from "./shaders/orbitalRender.js";
import { requestCanvasContext, requestWebGpuContext, type WebGpuContext } from "./WebGpuSupport.js";

/** Why the sim is not drawing on the GPU, when it is not. */
export const GpuUnavailableReason = {
  /** No `navigator.gpu`, or no adapter or device could be acquired. */
  NO_DEVICE: "noDevice",
  /** A shader failed to compile on this device. */
  SHADER_ERROR: "shaderError",
  /** The device works, but its canvas output cannot be composited into Scenery. */
  PRESENTATION: "presentation",
  /** The `forceCpu` query parameter asked for the CPU renderer. */
  FORCED: "forced",
  DEVICE_LOST: "deviceLost",
} as const;

export type GpuUnavailableReasonId = (typeof GpuUnavailableReason)[keyof typeof GpuUnavailableReason];

export type GpuInitializationResult = {
  readonly context: WebGpuContext | null;
  readonly reason: GpuUnavailableReasonId | null;
  /** Compiler diagnostics, when a shader failed. */
  readonly diagnostics: readonly string[];
};

let cached: GpuInitializationResult | null = null;

/** The startup result, or "no device" if initialization has not run (as under Vitest). */
export function getGpuInitializationResult(): GpuInitializationResult {
  return cached ?? { context: null, reason: GpuUnavailableReason.NO_DEVICE, diagnostics: [] };
}

/** Acquires and validates the device. The first result is cached and returned thereafter. */
export async function initializeGpuContext(forceCpu: boolean): Promise<GpuInitializationResult> {
  if (cached) {
    return cached;
  }
  if (forceCpu) {
    cached = { context: null, reason: GpuUnavailableReason.FORCED, diagnostics: [] };
    return cached;
  }
  const context = await requestWebGpuContext();
  if (!context) {
    cached = { context: null, reason: GpuUnavailableReason.NO_DEVICE, diagnostics: [] };
    return cached;
  }
  try {
    const diagnostics = await compileAllShaders(context.device);
    if (diagnostics.length > 0) {
      context.device.destroy();
      cached = { context: null, reason: GpuUnavailableReason.SHADER_ERROR, diagnostics };
    } else if (!canPresentToCanvas(context.device, context.presentationFormat)) {
      context.device.destroy();
      cached = { context: null, reason: GpuUnavailableReason.PRESENTATION, diagnostics: [] };
    } else {
      cached = { context, reason: null, diagnostics: [] };
      // Existing viewports see this on their next frame; future screens start on CPU.
      context.device.lost.then(() => demoteGpuContext(context));
      context.device.addEventListener("uncapturederror", (event) => {
        event.preventDefault();
        demoteGpuContext(context);
      });
    }
  } catch (error) {
    context.device.destroy();
    cached = { context: null, reason: GpuUnavailableReason.SHADER_ERROR, diagnostics: [String(error)] };
  }
  return cached;
}

/** Invalidates only this device, never a different initialization result. */
export function demoteGpuContext(context: WebGpuContext): void {
  if (cached?.context === context) {
    cached = { context: null, reason: GpuUnavailableReason.DEVICE_LOST, diagnostics: [] };
  }
}

/** Edge length of the throwaway canvas used by the presentation check. */
const PRESENTATION_PROBE_SIZE = 4;

/** Clears a tiny WebGPU canvas to red, draws it into a 2D canvas, and checks that the red arrived. */
function canPresentToCanvas(device: GPUDevice, format: GPUTextureFormat): boolean {
  let gpuContext: GPUCanvasContext | null = null;
  try {
    const source = document.createElement("canvas");
    source.width = PRESENTATION_PROBE_SIZE;
    source.height = PRESENTATION_PROBE_SIZE;
    gpuContext = requestCanvasContext(source);
    if (!gpuContext) {
      return false;
    }
    gpuContext.configure({ device, format, alphaMode: "opaque" });
    const encoder = device.createCommandEncoder({ label: "presentationProbe" });
    const pass = encoder.beginRenderPass({
      colorAttachments: [
        {
          view: gpuContext.getCurrentTexture().createView(),
          clearValue: { r: 1, g: 0, b: 0, a: 1 },
          loadOp: "clear",
          storeOp: "store",
        },
      ],
    });
    pass.end();
    device.queue.submit([encoder.finish()]);

    const destination = document.createElement("canvas");
    destination.width = PRESENTATION_PROBE_SIZE;
    destination.height = PRESENTATION_PROBE_SIZE;
    const context2d = destination.getContext("2d", { willReadFrequently: true });
    if (!context2d) {
      return false;
    }
    context2d.drawImage(source, 0, 0);
    const pixel = context2d.getImageData(1, 1, 1, 1).data;
    return (pixel[0] ?? 0) > 200 && (pixel[3] ?? 0) > 200;
  } catch {
    return false;
  } finally {
    gpuContext?.unconfigure();
  }
}

/** Compiles every shader and returns the error messages, if any. */
async function compileAllShaders(device: GPUDevice): Promise<string[]> {
  const sources: Record<string, string> = { orbitalRender: ORBITAL_RENDER_SHADER };
  const problems: string[] = [];
  await Promise.all(
    Object.entries(sources).map(async ([label, code]) => {
      const module = device.createShaderModule({ label, code });
      const info = await module.getCompilationInfo();
      for (const message of info.messages) {
        if (message.type === "error") {
          problems.push(`${label}:${message.lineNum}:${message.linePos} ${message.message}`);
        }
      }
    }),
  );
  return problems;
}
