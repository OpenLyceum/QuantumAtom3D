/**
 * WebGpuSupport.ts
 *
 * Device acquisition, kept separate from the renderers so that "can we draw on
 * the GPU?" has one answer in one place. Adapted from HeatTransfer
 * (src/common/field/gpu/WebGpuSupport.ts).
 *
 * Nothing here throws. Every failure (no `navigator.gpu`, no adapter, a device
 * request that rejects) resolves to `null`, and the sim falls back to the CPU
 * renderer.
 */

export type WebGpuContext = {
  readonly adapter: GPUAdapter;
  readonly device: GPUDevice;
  /** The format the canvases are configured with. */
  readonly presentationFormat: GPUTextureFormat;
};

/** Requests a WebGPU context and narrows the DOM library's generic getContext result. */
export function requestCanvasContext(canvas: HTMLCanvasElement): GPUCanvasContext | null {
  const context = canvas.getContext("webgpu");
  return typeof GPUCanvasContext !== "undefined" && context instanceof GPUCanvasContext ? context : null;
}

/** Whether this browser exposes the WebGPU entry point at all. */
function isWebGpuAvailable(): boolean {
  return typeof navigator !== "undefined" && "gpu" in navigator && Boolean(navigator.gpu);
}

/** Requests an adapter and a device, or resolves to null. */
export async function requestWebGpuContext(): Promise<WebGpuContext | null> {
  if (!isWebGpuAvailable()) {
    return null;
  }
  try {
    const adapter = await navigator.gpu.requestAdapter({ powerPreference: "high-performance" });
    if (!adapter) {
      return null;
    }
    const device = await adapter.requestDevice();
    return { adapter, device, presentationFormat: navigator.gpu.getPreferredCanvasFormat() };
  } catch {
    // Adapter or device request failed (blocklisted driver, headless, …).
    return null;
  }
}
