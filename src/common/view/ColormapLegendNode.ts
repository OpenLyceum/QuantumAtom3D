/**
 * ColormapLegendNode.ts
 *
 * Legends for the two ways ψ is coloured:
 *
 *   phase    a ring of hues around the complex plane, with 0 at the right
 *            and π/2 at the top, matching arg ψ = atan2(Im ψ, Re ψ)
 *   density  a horizontal inferno bar from 0 to the maximum |ψ|²
 *
 * The phase ring is rebuilt when the phase-wheel preference changes.
 */

import { Multilink, type TReadOnlyProperty, type UnknownMultilink } from "scenerystack/axon";
import { Shape } from "scenerystack/kite";
import { LinearGradient, Node, type NodeOptions, Path, Rectangle, Text, VBox } from "scenerystack/scenery";
import { PhetFont } from "scenerystack/scenery-phet";
import QuantumAtom3DColors from "../../QuantumAtom3DColors.js";
import type { PhaseColormap } from "../../QuantumAtom3DConstants.js";
import { densityCssColor, phaseCssColor } from "./Colormaps.js";

const RING_SEGMENTS = 72;
const RING_OUTER_RADIUS = 24;
const RING_INNER_RADIUS = 13;
const BAR_WIDTH = 90;
const BAR_HEIGHT = 12;
const GRADIENT_STOPS = 16;
const LABEL_FONT = new PhetFont(11);
const AXIS_LABEL_GAP = 3;

/** Ring of hue wedges; wedge k spans phase [k, k + 1]·2π/N, drawn counter-clockwise from +x. */
function createPhaseRing(colormap: PhaseColormap): Node {
  const wedges: Node[] = [];
  for (let k = 0; k < RING_SEGMENTS; k++) {
    const start = (2 * Math.PI * k) / RING_SEGMENTS;
    const end = (2 * Math.PI * (k + 1)) / RING_SEGMENTS;
    // Scenery's y axis points down, so a counter-clockwise phase sweeps negative screen angles.
    const shape = new Shape()
      .arc(0, 0, RING_OUTER_RADIUS, -start, -end, true)
      .arc(0, 0, RING_INNER_RADIUS, -end, -start, false)
      .close();
    const color = phaseCssColor((start + end) / 2, colormap);
    wedges.push(new Path(shape, { fill: color, stroke: color, lineWidth: 0.5 }));
  }
  return new Node({ children: wedges });
}

export type ColormapLegendNodeOptions = NodeOptions & {
  readonly coloringProperty: TReadOnlyProperty<"phase" | "density">;
  readonly phaseColormapProperty: TReadOnlyProperty<PhaseColormap>;
  readonly phaseCaptionProperty: TReadOnlyProperty<string>;
  readonly densityCaptionProperty: TReadOnlyProperty<string>;
};

export class ColormapLegendNode extends Node {
  private readonly multilink: UnknownMultilink;

  public constructor(options: ColormapLegendNodeOptions) {
    const { coloringProperty, phaseColormapProperty, phaseCaptionProperty, densityCaptionProperty, ...nodeOptions } =
      options;

    const textOptions = { font: LABEL_FONT, fill: QuantumAtom3DColors.textColorProperty };
    const ringHolder = new Node();
    const ringLabels = new Node({
      children: [
        new Text("0", { ...textOptions, left: RING_OUTER_RADIUS + AXIS_LABEL_GAP, centerY: 0 }),
        new Text("π/2", { ...textOptions, centerX: 0, bottom: -RING_OUTER_RADIUS - AXIS_LABEL_GAP }),
        new Text("π", { ...textOptions, right: -RING_OUTER_RADIUS - AXIS_LABEL_GAP, centerY: 0 }),
      ],
    });
    const phaseLegend = new VBox({
      spacing: AXIS_LABEL_GAP,
      children: [new Node({ children: [ringHolder, ringLabels] }), new Text(phaseCaptionProperty, textOptions)],
    });

    const gradient = new LinearGradient(0, 0, BAR_WIDTH, 0);
    for (let i = 0; i <= GRADIENT_STOPS; i++) {
      gradient.addColorStop(i / GRADIENT_STOPS, densityCssColor(i / GRADIENT_STOPS));
    }
    const densityLegend = new VBox({
      spacing: AXIS_LABEL_GAP,
      children: [
        new Rectangle(0, 0, BAR_WIDTH, BAR_HEIGHT, {
          fill: gradient,
          stroke: QuantumAtom3DColors.sliceFrameColorProperty,
        }),
        new Text(densityCaptionProperty, textOptions),
      ],
    });

    super({ children: [phaseLegend, densityLegend], ...nodeOptions });

    this.multilink = Multilink.multilink([coloringProperty, phaseColormapProperty], (coloring, colormap) => {
      phaseLegend.visible = coloring === "phase";
      densityLegend.visible = coloring === "density";
      if (coloring === "phase") {
        for (const child of ringHolder.children) {
          child.dispose();
        }
        ringHolder.children = [createPhaseRing(colormap)];
      }
    });
  }

  public override dispose(): void {
    this.multilink.dispose();
    super.dispose();
  }
}
