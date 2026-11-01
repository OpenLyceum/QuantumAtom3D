/**
 * OrbitalsScreenSummaryContent.ts
 *
 * The screen summary a screen-reader user hears first. The current-details
 * sentence follows the state live: its name, the ion, the energy, ⟨r⟩ and the
 * node counts.
 */

import { DerivedProperty, type TReadOnlyProperty } from "scenerystack/axon";
import { StringUtils } from "scenerystack/phetcommon";
import { hydrogenicIonSymbol } from "../../common/model/hydrogen/HydrogenicIons.js";
import { realOrbitalSubscript, spectroscopicLetter } from "../../common/model/orbital/OrbitalCatalog.js";
import { DEFAULT_LENGTH_UNIT_PROPERTY } from "../../common/view/DisplayDefaults.js";
import { DisposableScreenSummaryContent } from "../../common/view/DisposableScreenSummaryContent.js";
import {
  formatAngles,
  formatEnergyEv,
  formatLength,
  formatSigned,
  lengthUnitSymbol,
} from "../../common/view/formatters.js";
import { StringManager } from "../../i18n/StringManager.js";
import type { LengthUnit } from "../../preferences/QuantumAtom3DPreferencesModel.js";
import type { OrbitalsModel } from "../model/OrbitalsModel.js";

export class OrbitalsScreenSummaryContent extends DisposableScreenSummaryContent {
  private readonly currentDetailsProperty: TReadOnlyProperty<string>;

  public constructor(model: OrbitalsModel, unitProperty: TReadOnlyProperty<LengthUnit> = DEFAULT_LENGTH_UNIT_PROPERTY) {
    const a11y = StringManager.getInstance().getOrbitalsA11yStrings();

    const readouts = StringManager.getInstance().getOrbitalStrings().readouts;
    const currentDetailsProperty = new DerivedProperty(
      [
        model.summaryProperty,
        a11y.currentDetailsStringProperty,
        unitProperty,
        readouts.conesValueStringProperty,
        readouts.planesValueStringProperty,
        readouts.polarPlaneValueStringProperty,
      ],
      (summary, pattern, unit, conePattern, planePattern, equator) => {
        const { n, l, m, basis, nodes } = summary;
        const letter = spectroscopicLetter(l);
        // Plain text for speech: "3d xz", "2p, m = +1", "1s".
        const state =
          l === 0
            ? `${n}${letter}`
            : basis === "real"
              ? `${n}${letter} ${realOrbitalSubscript(l, m)}`
              : `${n}${letter}, m = ${formatSigned(m)}`;
        return StringUtils.fillIn(pattern, {
          state,
          ion: hydrogenicIonSymbol(summary.nuclearCharge),
          energy: formatEnergyEv(summary.energy),
          radius: formatLength(summary.meanRadius, unit),
          unit: lengthUnitSymbol(unit),
          nodeDetails: [
            nodes.polarNodeAngles.some((a) => Math.abs(a - Math.PI / 2) < 1e-6) ? equator : "",
            nodes.polarNodeAngles.some((a) => Math.abs(a - Math.PI / 2) >= 1e-6)
              ? StringUtils.fillIn(conePattern, {
                  angles: formatAngles(nodes.polarNodeAngles.filter((a) => Math.abs(a - Math.PI / 2) >= 1e-6)),
                })
              : "",

            nodes.azimuthalNodeAngles.length > 0
              ? StringUtils.fillIn(planePattern, { angles: formatAngles(nodes.azimuthalNodeAngles) })
              : "",
          ]
            .filter(Boolean)
            .join(". "),
          radialNodes: nodes.radialNodeRadii.length,
          angularNodes: nodes.polarNodeAngles.length + nodes.azimuthalNodeAngles.length,
        });
      },
    );

    super({
      playAreaContent: a11y.screenSummary.playAreaStringProperty,
      controlAreaContent: a11y.screenSummary.controlAreaStringProperty,
      currentDetailsContent: currentDetailsProperty,
      interactionHintContent: a11y.screenSummary.interactionHintStringProperty,
    });
    this.currentDetailsProperty = currentDetailsProperty;
  }

  public override dispose(): void {
    super.dispose();
    this.currentDetailsProperty.dispose();
  }
}
