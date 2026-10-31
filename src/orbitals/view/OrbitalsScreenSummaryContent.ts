/**
 * OrbitalsScreenSummaryContent.ts
 *
 * The screen summary a screen-reader user hears first. The current-details
 * sentence follows the state live: its name, the ion, the energy, ⟨r⟩ and the
 * node counts.
 */

import { DerivedProperty, type TReadOnlyProperty } from "scenerystack/axon";
import { StringUtils } from "scenerystack/phetcommon";
import { ScreenSummaryContent } from "scenerystack/sim";
import { hydrogenicIonSymbol } from "../../common/model/hydrogen/HydrogenicIons.js";
import { realOrbitalSubscript, spectroscopicLetter } from "../../common/model/orbital/OrbitalCatalog.js";
import { formatEnergyEv, formatLength, formatSigned } from "../../common/view/formatters.js";
import { StringManager } from "../../i18n/StringManager.js";
import type { OrbitalsModel } from "../model/OrbitalsModel.js";

export class OrbitalsScreenSummaryContent extends ScreenSummaryContent {
  private readonly currentDetailsProperty: TReadOnlyProperty<string>;

  public constructor(model: OrbitalsModel) {
    const a11y = StringManager.getInstance().getOrbitalsA11yStrings();

    const currentDetailsProperty = new DerivedProperty(
      [model.summaryProperty, a11y.currentDetailsStringProperty],
      (summary, pattern) => {
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
          radius: formatLength(summary.meanRadius),
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
    this.currentDetailsProperty.dispose();
    super.dispose();
  }
}
