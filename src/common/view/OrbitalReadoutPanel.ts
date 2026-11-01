/**
 * OrbitalReadoutPanel.ts
 *
 * The numbers behind the picture: the energy E_n in eV, ⟨r⟩, r_rms and the
 * peak of P(r) in a0, and the node counts with the cone and plane angles.
 * Driven by an OrbitalSummary, so every value is computed in the model.
 */

import { DerivedProperty, type TReadOnlyProperty } from "scenerystack/axon";
import { StringUtils } from "scenerystack/phetcommon";
import { GridBox, RichText, Text, VBox } from "scenerystack/scenery";
import { PhetFont } from "scenerystack/scenery-phet";
import { StringManager } from "../../i18n/StringManager.js";
import QuantumAtom3DColors from "../../QuantumAtom3DColors.js";
import type { OrbitalSummary } from "../model/orbital/OrbitalSummary.js";
import { QuantumAtom3DPanel, type QuantumAtom3DPanelOptions } from "../QuantumAtom3DPanel.js";
import { formatAngles, formatEnergyEv, formatLength } from "./formatters.js";

const TITLE_FONT = new PhetFont({ size: 14, weight: "bold" });
const READOUT_FONT = new PhetFont(13);
const DETAIL_FONT = new PhetFont(11);
const COLUMN_SPACING = 12;
const ROW_SPACING = 4;
const VALUE_MAX_WIDTH = 150;

/** A polar node within this of θ = 90° (radians) is the xy-plane. */
const EQUATORIAL_TOLERANCE = 1e-6;

export class OrbitalReadoutPanel extends QuantumAtom3DPanel {
  private readonly disposables: { dispose(): void }[];

  public constructor(summaryProperty: TReadOnlyProperty<OrbitalSummary>, options?: QuantumAtom3DPanelOptions) {
    const strings = StringManager.getInstance().getOrbitalStrings().readouts;
    const disposables: { dispose(): void }[] = [];

    const derive = <T>(
      dependency: TReadOnlyProperty<string>,
      compute: (summary: OrbitalSummary, pattern: string) => T,
    ): TReadOnlyProperty<T> => {
      const property = new DerivedProperty([summaryProperty, dependency], compute);
      disposables.push(property);
      return property;
    };

    const energyProperty = derive(strings.energyValueStringProperty, (summary, pattern) =>
      StringUtils.fillIn(pattern, { value: formatEnergyEv(summary.energy) }),
    );
    const lengthOf = (pick: (summary: OrbitalSummary) => number) =>
      derive(strings.lengthValueStringProperty, (summary, pattern) =>
        StringUtils.fillIn(pattern, { value: formatLength(pick(summary)) }),
      );
    const radialNodesProperty = derive(strings.nodeCountStringProperty, (summary, pattern) =>
      StringUtils.fillIn(pattern, { count: summary.nodes.radialNodeRadii.length }),
    );
    const angularNodesProperty = derive(strings.nodeCountStringProperty, (summary, pattern) =>
      StringUtils.fillIn(pattern, {
        count: summary.nodes.polarNodeAngles.length + summary.nodes.azimuthalNodeAngles.length,
      }),
    );
    // θ = 90° is the xy-plane, not a cone, so it is named separately. The detail
    // lines are joined into one RichText so absent lines leave no gap.
    const isEquatorial = (angle: number) => Math.abs(angle - Math.PI / 2) < EQUATORIAL_TOLERANCE;
    const nodeDetailsProperty = new DerivedProperty(
      [
        summaryProperty,
        strings.polarPlaneValueStringProperty,
        strings.conesValueStringProperty,
        strings.planesValueStringProperty,
      ],
      (summary, planeText, conesPattern, planesPattern) => {
        const { polarNodeAngles, azimuthalNodeAngles } = summary.nodes;
        const cones = polarNodeAngles.filter((angle) => !isEquatorial(angle));
        const lines: string[] = [];
        if (polarNodeAngles.some(isEquatorial)) {
          lines.push(planeText);
        }
        if (cones.length > 0) {
          lines.push(StringUtils.fillIn(conesPattern, { angles: formatAngles(cones) }));
        }
        if (azimuthalNodeAngles.length > 0) {
          lines.push(StringUtils.fillIn(planesPattern, { angles: formatAngles(azimuthalNodeAngles) }));
        }
        return lines.join("<br>");
      },
    );
    disposables.push(nodeDetailsProperty);

    const label = (text: TReadOnlyProperty<string>) =>
      new RichText(text, { font: READOUT_FONT, fill: QuantumAtom3DColors.textColorProperty });
    const value = (text: TReadOnlyProperty<string>) =>
      new RichText(text, {
        font: READOUT_FONT,
        fill: QuantumAtom3DColors.textColorProperty,
        maxWidth: VALUE_MAX_WIDTH,
      });
    const nodeDetails = new RichText(nodeDetailsProperty, {
      font: DETAIL_FONT,
      fill: QuantumAtom3DColors.nodeMarkerColorProperty,
      maxWidth: VALUE_MAX_WIDTH,
    });

    const rows: [TReadOnlyProperty<string>, TReadOnlyProperty<string>][] = [
      [strings.energyStringProperty, energyProperty],
      [strings.meanRadiusStringProperty, lengthOf((summary) => summary.meanRadius)],
      [strings.rmsRadiusStringProperty, lengthOf((summary) => summary.rmsRadius)],
      [strings.mostProbableRadiusStringProperty, lengthOf((summary) => summary.mostProbableRadius)],
      [strings.radialNodesStringProperty, radialNodesProperty],
      [strings.angularNodesStringProperty, angularNodesProperty],
    ];

    const grid = new GridBox({
      xSpacing: COLUMN_SPACING,
      ySpacing: ROW_SPACING,
      xAlign: "left",
      rows: rows.map(([name, text]) => [label(name), value(text)]),
    });

    const content = new VBox({
      spacing: ROW_SPACING,
      align: "left",
      children: [
        new Text(strings.titleStringProperty, { font: TITLE_FONT, fill: QuantumAtom3DColors.textColorProperty }),
        grid,
        nodeDetails,
      ],
    });

    super(content, options);
    this.disposables = disposables;
  }

  public override dispose(): void {
    // The nodes observe these Properties, so they go first.
    super.dispose();
    for (const disposable of this.disposables) {
      disposable.dispose();
    }
  }
}
