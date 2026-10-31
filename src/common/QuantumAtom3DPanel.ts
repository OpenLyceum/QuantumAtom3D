/**
 * QuantumAtom3DPanel.ts
 *
 * A pre-themed Panel that automatically uses QuantumAtom3DColors for background and
 * border. Use this for all control panels and info boxes in the sim so that
 * default / projector mode switching is handled automatically.
 *
 * ── Basic usage ───────────────────────────────────────────────────────────────
 *
 *   import { QuantumAtom3DPanel } from "../../common/QuantumAtom3DPanel.js";
 *   import { VBox, Text } from "scenerystack/scenery";
 *
 *   const content = new VBox({
 *     children: [ new Text("label"), slider ],
 *     spacing: 8,
 *   });
 *   const panel = new QuantumAtom3DPanel(content);
 *
 * ── Overriding defaults ───────────────────────────────────────────────────────
 *
 *   // Wider margins, sharper corners, custom stroke
 *   const panel = new QuantumAtom3DPanel(content, { xMargin: 20, cornerRadius: 0 });
 *
 *   // Transparent background (decorative border only)
 *   const panel = new QuantumAtom3DPanel(content, { fill: "transparent" });
 */

import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import type { Node } from "scenerystack/scenery";
import { Panel, type PanelOptions } from "scenerystack/sun";
import QuantumAtom3DColors from "../QuantumAtom3DColors.js";
import { PANEL_CORNER_RADIUS } from "../QuantumAtom3DConstants.js";

export type QuantumAtom3DPanelOptions = PanelOptions;

export class QuantumAtom3DPanel extends Panel {
  public constructor(content: Node, providedOptions?: QuantumAtom3DPanelOptions) {
    const options = optionize<QuantumAtom3DPanelOptions, EmptySelfOptions, PanelOptions>()(
      {
        fill: QuantumAtom3DColors.panelBackgroundColorProperty,
        stroke: QuantumAtom3DColors.panelBorderColorProperty,
        cornerRadius: PANEL_CORNER_RADIUS,
        xMargin: 12,
        yMargin: 10,
      },
      providedOptions,
    );
    super(content, options);
  }
}
