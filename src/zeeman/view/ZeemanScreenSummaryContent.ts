import { DerivedProperty } from "scenerystack/axon";
import { toFixed } from "scenerystack/dot";
import { StringUtils } from "scenerystack/phetcommon";
import { atomicFieldToTesla, wavelengthNmForEnergy } from "../../common/model/AtomicUnits.js";
import { distinctPhotonEnergies } from "../../common/model/angular/ZeemanLevels.js";
import { DisposableScreenSummaryContent } from "../../common/view/DisposableScreenSummaryContent.js";
import { StringManager } from "../../i18n/StringManager.js";
import { ZEEMAN_SCREEN_SUMMARY_CONTENT_SETTINGS } from "../../QuantumAtom3DConstants.js";
import type { ZeemanModel } from "../model/ZeemanModel.js";
export class ZeemanScreenSummaryContent extends DisposableScreenSummaryContent {
  public constructor(model: ZeemanModel) {
    const s = StringManager.getInstance().getZeemanA11yStrings();
    const detailsProperty = new DerivedProperty(
      [
        model.fieldProperty,
        model.capProperty,
        model.transitionsProperty,
        s.currentDetailsStringProperty,
        model.upperLevelsProperty,
        model.selectedIndexProperty,
        model.modeProperty,
      ],
      (field, cap, transitions, pattern, levels, index, mode) => {
        const selected = levels[index];
        const wavelengths = transitions.map((t) => wavelengthNmForEnergy(t.photonEnergy));
        return StringUtils.fillIn(pattern, {
          field: atomicFieldToTesla(field).toPrecision(
            ZEEMAN_SCREEN_SUMMARY_CONTENT_SETTINGS.DETAILS_SIGNIFICANT_FIGURES,
          ),
          cap: atomicFieldToTesla(cap).toPrecision(ZEEMAN_SCREEN_SUMMARY_CONTENT_SETTINGS.DETAILS_SIGNIFICANT_FIGURES),
          count: distinctPhotonEnergies(transitions).length,
          minimum:
            wavelengths.length > 0
              ? toFixed(Math.min(...wavelengths), ZEEMAN_SCREEN_SUMMARY_CONTENT_SETTINGS.DETAILS_DECIMAL_PLACES)
              : "—",
          maximum:
            wavelengths.length > 0
              ? toFixed(Math.max(...wavelengths), ZEEMAN_SCREEN_SUMMARY_CONTENT_SETTINGS.DETAILS_DECIMAL_PLACES)
              : "—",
          state: selected
            ? `n=${selected.n}, l=${selected.l}, m=${selected.m}${mode === "anomalous" ? `, j=${selected.j}, g=${toFixed(selected.g, ZEEMAN_SCREEN_SUMMARY_CONTENT_SETTINGS.G_FACTOR_DECIMAL_PLACES)}` : ""}`
            : "—",
        });
      },
    );
    super(s.screenSummary, detailsProperty);
  }
}
