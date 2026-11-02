/**
 * SliceHeatmapNode.ts
 *
 * The 2D cross-section of ψ on a coordinate plane, drawn as an image:
 *
 *   phase coloring    hue = arg ψ (from the phase-wheel preference),
 *                     brightness ∝ |ψ| / max|ψ| on the slice
 *   density coloring  inferno(|ψ|² / max|ψ|²), linear in the density
 *
 * The samples come from SliceSampler at SLICE_RESOLUTION² and are painted into
 * an offscreen canvas, which a CanvasNode scales up with smoothing (the
 * pattern of Resonance's DisplacementColormapNode). Optional dashed curves mark
 * where nodal surfaces cut the plane.
 */

import { Multilink, type TReadOnlyProperty, type UnknownMultilink } from "scenerystack/axon";
import { Bounds2 } from "scenerystack/dot";
import { Shape } from "scenerystack/kite";
import { ModelViewTransform2 } from "scenerystack/phetcommon";
import { CanvasNode, Node, type NodeOptions, Path, Rectangle } from "scenerystack/scenery";
import QuantumAtom3DColors from "../../QuantumAtom3DColors.js";
import { type PhaseColormap, SLICE_RESOLUTION } from "../../QuantumAtom3DConstants.js";
import type { OrbitalSummary } from "../model/orbital/OrbitalSummary.js";
import { sliceNodalCurves } from "../model/orbital/SliceNodalCurves.js";
import { type SlicePlane, type SliceSamples, sampleSlice } from "../model/orbital/SliceSampler.js";
import type { Wavefunction } from "../model/orbital/Wavefunction.js";
import { densityColor, phaseColor, writePixel } from "./Colormaps.js";

type SliceColoringMode = "phase" | "density";

export type SliceHeatmapNodeOptions = NodeOptions & {
  readonly wavefunctionProperty: TReadOnlyProperty<Wavefunction>;
  readonly summaryProperty: TReadOnlyProperty<OrbitalSummary>;
  readonly slicePlaneProperty: TReadOnlyProperty<SlicePlane>;
  readonly sliceOffsetProperty: TReadOnlyProperty<number>;
  readonly halfWidthProperty: TReadOnlyProperty<number>;
  readonly coloringProperty: TReadOnlyProperty<SliceColoringMode>;
  readonly phaseColormapProperty: TReadOnlyProperty<PhaseColormap>;
  readonly nodesVisibleProperty: TReadOnlyProperty<boolean>;
};

const FRAME_LINE_WIDTH = 1.5;
const NODE_LINE_WIDTH = 1.2;
const NODE_LINE_DASH = [4, 3];

/** Paints the latest samples into an offscreen canvas and draws it scaled to the node's size. */
class HeatmapCanvasNode extends CanvasNode {
  private readonly size: number;
  private readonly offscreen: HTMLCanvasElement;
  private imageData: ImageData | null = null;

  public constructor(size: number) {
    super({ canvasBounds: new Bounds2(0, 0, size, size) });
    this.size = size;
    this.offscreen = document.createElement("canvas");
    this.offscreen.width = SLICE_RESOLUTION;
    this.offscreen.height = SLICE_RESOLUTION;
  }

  /** Recolours the offscreen image from new samples. */
  public update(samples: SliceSamples, coloring: SliceColoringMode, colormap: PhaseColormap): void {
    const context = this.offscreen.getContext("2d");
    if (!context) {
      return;
    }
    const { resolution, re, im, maxDensity } = samples;
    if (!this.imageData || this.imageData.width !== resolution) {
      this.imageData = context.createImageData(resolution, resolution);
    }
    const data = this.imageData.data;
    const rgb = [0, 0, 0];
    const inverseMax = maxDensity > 0 ? 1 / maxDensity : 0;
    for (let i = 0; i < resolution * resolution; i++) {
      const a = re[i] ?? 0;
      const b = im[i] ?? 0;
      const relativeDensity = (a * a + b * b) * inverseMax;
      if (coloring === "phase") {
        phaseColor(Math.atan2(b, a), colormap, rgb);
        writePixel(data, 4 * i, rgb, Math.sqrt(relativeDensity));
      } else {
        densityColor(relativeDensity, rgb);
        writePixel(data, 4 * i, rgb, 1);
      }
    }
    context.putImageData(this.imageData, 0, 0);
    this.invalidatePaint();
  }

  public override paintCanvas(context: CanvasRenderingContext2D): void {
    context.imageSmoothingEnabled = true;
    context.drawImage(this.offscreen, 0, 0, this.size, this.size);
  }
}

export class SliceHeatmapNode extends Node {
  private readonly multilink: UnknownMultilink;
  private readonly nodesMultilink: UnknownMultilink;

  public constructor(size: number, options: SliceHeatmapNodeOptions) {
    const {
      wavefunctionProperty,
      summaryProperty,
      slicePlaneProperty,
      sliceOffsetProperty,
      halfWidthProperty,
      coloringProperty,
      phaseColormapProperty,
      nodesVisibleProperty,
      ...nodeOptions
    } = options;

    const viewBounds = new Bounds2(0, 0, size, size);
    const canvasNode = new HeatmapCanvasNode(size);
    const nodesPath = new Path(null, {
      stroke: QuantumAtom3DColors.sliceNodeOverlayColorProperty,
      lineWidth: NODE_LINE_WIDTH,
      lineDash: NODE_LINE_DASH,
      clipArea: Shape.bounds(viewBounds),
    });
    const frame = new Rectangle(viewBounds, {
      stroke: QuantumAtom3DColors.sliceFrameColorProperty,
      lineWidth: FRAME_LINE_WIDTH,
    });

    super({ children: [canvasNode, nodesPath, frame], ...nodeOptions });

    this.multilink = Multilink.multilink(
      [
        wavefunctionProperty,
        slicePlaneProperty,
        sliceOffsetProperty,
        halfWidthProperty,
        coloringProperty,
        phaseColormapProperty,
      ],
      (wavefunction, plane, offset, halfWidth, coloring, colormap) => {
        canvasNode.update(sampleSlice(wavefunction, plane, offset, halfWidth, SLICE_RESOLUTION), coloring, colormap);
      },
    );

    this.nodesMultilink = Multilink.multilink(
      [summaryProperty, slicePlaneProperty, sliceOffsetProperty, halfWidthProperty, nodesVisibleProperty],
      (summary, plane, offset, halfWidth, visible) => {
        nodesPath.visible = visible;
        if (!visible) {
          return;
        }
        const transform = ModelViewTransform2.createRectangleInvertedYMapping(
          new Bounds2(-halfWidth, -halfWidth, halfWidth, halfWidth),
          viewBounds,
        );
        const shape = new Shape();
        for (const curve of sliceNodalCurves(summary.nodes, plane, offset, halfWidth)) {
          curve.forEach(([u, v], index) => {
            const x = transform.modelToViewX(u);
            const y = transform.modelToViewY(v);
            if (index === 0) {
              shape.moveTo(x, y);
            } else {
              shape.lineTo(x, y);
            }
          });
        }
        nodesPath.shape = shape;
      },
    );
  }

  public override dispose(): void {
    this.multilink.dispose();
    this.nodesMultilink.dispose();
    super.dispose();
  }
}
