import { DerivedProperty } from "scenerystack/axon";
import { StringUtils } from "scenerystack/phetcommon";
import { atomicFieldToTesla, wavelengthNmForEnergy } from "../../common/model/AtomicUnits.js";
import { distinctPhotonEnergies } from "../../common/model/angular/ZeemanLevels.js";
import { DisposableScreenSummaryContent } from "../../common/view/DisposableScreenSummaryContent.js";
import { StringManager } from "../../i18n/StringManager.js";
import type { ZeemanModel } from "../model/ZeemanModel.js";
export class ZeemanScreenSummaryContent extends DisposableScreenSummaryContent {
  public constructor(model: ZeemanModel) {
    const s = StringManager.getInstance().getZeemanA11yStrings();
    const details = new DerivedProperty(
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
          field: atomicFieldToTesla(field).toPrecision(4),
          cap: atomicFieldToTesla(cap).toPrecision(4),
          count: distinctPhotonEnergies(transitions).length,
          minimum: wavelengths.length > 0 ? Math.min(...wavelengths).toFixed(6) : "—",
          maximum: wavelengths.length > 0 ? Math.max(...wavelengths).toFixed(6) : "—",
          state: selected
            ? `n=${selected.n}, l=${selected.l}, m=${selected.m}${mode === "anomalous" ? `, j=${selected.j}, g=${selected.g.toFixed(4)}` : ""}`
            : "—",
        });
      },
    );
    super(s.screenSummary, details);
  }
}
