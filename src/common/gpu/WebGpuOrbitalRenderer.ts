/**
 * WebGpuOrbitalRenderer.ts
 *
 * Draws the volume with the full-screen shader in shaders/orbitalRender.ts.
 * Frames are rendered on demand: only when the scene or camera has changed
 * since the last one. Each frame is copied into a 2D canvas straight away (see
 * OrbitalRenderer.ts).
 *
 * The bind-group layout is explicit, as in HeatTransfer: float storage buffers
 * and a uniform block, all fragment-only.
 */

import { RadialLookupTable } from "../model/orbital/RadialLookupTable.js";
import { createColorLuts } from "../view/Colormaps.js";
import type { CameraFrame } from "../view/OrbitCamera.js";
import type { OrbitalRenderer } from "./OrbitalRenderer.js";
import { type OrbitalScene, PARAMS_BYTES, packParams } from "./OrbitalScene.js";
import { ORBITAL_RENDER_SHADER } from "./shaders/orbitalRender.js";
import { requestCanvasContext, type WebGpuContext } from "./WebGpuSupport.js";

/** One table serves every renderer: it depends on nothing but n and l. */
let sharedRadialTable: RadialLookupTable | null = null;
function getRadialTable(): RadialLookupTable {
  sharedRadialTable ??= new RadialLookupTable();
  return sharedRadialTable;
}

export class WebGpuOrbitalRenderer implements OrbitalRenderer {
  public readonly canvas: HTMLCanvasElement;
  public readonly backend = "gpu";

  private readonly device: GPUDevice;
  private readonly gpuCanvas: HTMLCanvasElement;
  private readonly gpuContext: GPUCanvasContext;
  private readonly displayContext: CanvasRenderingContext2D;
  private readonly pipeline: GPURenderPipeline;
  private readonly bindGroup: GPUBindGroup;
  private readonly paramsBuffer: GPUBuffer;
  private readonly colorLutBuffer: GPUBuffer;
  private readonly ownedBuffers: GPUBuffer[];
  private readonly paramsData = new ArrayBuffer(PARAMS_BYTES);
  private readonly resolution: number;

  private scene: OrbitalScene | null = null;
  private frame: CameraFrame | null = null;
  private dirty = true;

  public constructor(context: WebGpuContext, resolution: number) {
    const { device, presentationFormat } = context;
    this.device = device;
    this.resolution = resolution;

    this.gpuCanvas = document.createElement("canvas");
    this.gpuCanvas.width = resolution;
    this.gpuCanvas.height = resolution;
    const gpuContext = requestCanvasContext(this.gpuCanvas);
    if (!gpuContext) {
      throw new Error("WebGPU canvas context unavailable after a successful device probe");
    }
    this.gpuContext = gpuContext;
    this.gpuContext.configure({ device, format: presentationFormat, alphaMode: "opaque" });

    this.canvas = document.createElement("canvas");
    this.canvas.width = resolution;
    this.canvas.height = resolution;
    const displayContext = this.canvas.getContext("2d");
    if (!displayContext) {
      throw new Error("2D canvas context unavailable");
    }
    this.displayContext = displayContext;

    const table = getRadialTable();
    const storage = (label: string, data: Float32Array) => {
      const buffer = device.createBuffer({
        label,
        size: data.byteLength,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
      });
      device.queue.writeBuffer(buffer, 0, data);
      return buffer;
    };
    this.paramsBuffer = device.createBuffer({
      label: "orbitalParams",
      size: PARAMS_BYTES,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    const radialTableBuffer = storage("radialTable", table.values);
    const radialMaxBuffer = storage("radialMax", table.rowMaxRadius);
    this.colorLutBuffer = storage("colorLut", createColorLuts("hsv"));
    this.ownedBuffers = [this.paramsBuffer, radialTableBuffer, radialMaxBuffer, this.colorLutBuffer];

    const fragment = GPUShaderStage.FRAGMENT;
    const layout = device.createBindGroupLayout({
      label: "orbitalRenderLayout",
      entries: [
        { binding: 0, visibility: fragment, buffer: { type: "uniform" } },
        { binding: 1, visibility: fragment, buffer: { type: "read-only-storage" } },
        { binding: 2, visibility: fragment, buffer: { type: "read-only-storage" } },
        { binding: 3, visibility: fragment, buffer: { type: "read-only-storage" } },
      ],
    });
    this.bindGroup = device.createBindGroup({
      label: "orbitalRenderBindGroup",
      layout,
      entries: [
        { binding: 0, resource: { buffer: this.paramsBuffer } },
        { binding: 1, resource: { buffer: radialTableBuffer } },
        { binding: 2, resource: { buffer: radialMaxBuffer } },
        { binding: 3, resource: { buffer: this.colorLutBuffer } },
      ],
    });
    const module = device.createShaderModule({ label: "orbitalRender", code: ORBITAL_RENDER_SHADER });
    this.pipeline = device.createRenderPipeline({
      label: "orbitalRender",
      layout: device.createPipelineLayout({ bindGroupLayouts: [layout] }),
      vertex: { module, entryPoint: "vertexMain" },
      fragment: { module, entryPoint: "fragmentMain", targets: [{ format: presentationFormat }] },
      primitive: { topology: "triangle-list" },
    });
  }

  public setScene(scene: OrbitalScene): void {
    if (scene.phaseColormap !== this.scene?.phaseColormap) {
      this.device.queue.writeBuffer(this.colorLutBuffer, 0, createColorLuts(scene.phaseColormap));
    }
    this.scene = scene;
    this.dirty = true;
  }

  public setCamera(frame: CameraFrame): void {
    this.frame = frame;
    this.dirty = true;
  }

  public render(): boolean {
    if (!(this.dirty && this.scene && this.frame)) {
      return false;
    }
    packParams(this.scene, this.frame, this.resolution, this.paramsData);
    this.device.queue.writeBuffer(this.paramsBuffer, 0, this.paramsData);
    const encoder = this.device.createCommandEncoder({ label: "orbitalFrame" });
    const pass = encoder.beginRenderPass({
      colorAttachments: [
        {
          view: this.gpuContext.getCurrentTexture().createView(),
          clearValue: { r: 0, g: 0, b: 0, a: 1 },
          loadOp: "clear",
          storeOp: "store",
        },
      ],
    });
    pass.setPipeline(this.pipeline);
    pass.setBindGroup(0, this.bindGroup);
    pass.draw(3);
    pass.end();
    this.device.queue.submit([encoder.finish()]);
    this.displayContext.drawImage(this.gpuCanvas, 0, 0);
    this.dirty = false;
    return true;
  }

  public dispose(): void {
    for (const buffer of this.ownedBuffers) {
      buffer.destroy();
    }
    this.gpuContext.unconfigure();
  }
}
