/**
 * OrbitalRenderer.ts
 *
 * What the 3D viewport needs from a renderer. Both backends draw into an
 * ordinary 2D canvas, which the viewport shows through one Scenery Image.
 * WebGPU canvases keep no drawing buffer between frames, and frames here are
 * rendered only on demand, so the GPU backend copies each frame out right away.
 */

import type { RenderQuality } from "../../preferences/QuantumAtom3DPreferencesModel.js";
import type { CameraFrame } from "../view/OrbitCamera.js";
import type { OrbitalScene } from "./OrbitalScene.js";

export type OrbitalRendererBackend = "gpu" | "cpu";

export type OrbitalRenderer = {
  /** A 2D canvas holding the latest finished frame. */
  readonly canvas: HTMLCanvasElement;
  readonly backend: OrbitalRendererBackend;
  setQuality?(quality: RenderQuality): void;
  setScene(scene: OrbitalScene): void;
  setCamera(frame: CameraFrame): void;
  /** Does pending work. Returns true if the canvas changed, so the Image must be invalidated. */
  render(): boolean;
  dispose(): void;
};
