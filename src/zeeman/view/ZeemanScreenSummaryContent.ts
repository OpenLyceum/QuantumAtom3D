import { DerivedProperty } from "scenerystack/axon";
import { StringUtils } from "scenerystack/phetcommon";
import { ScreenSummaryContent } from "scenerystack/sim";
import { atomicFieldToTesla } from "../../common/model/AtomicUnits.js";
import { distinctPhotonEnergies } from "../../common/model/angular/ZeemanLevels.js";
import { StringManager } from "../../i18n/StringManager.js";
import type { ZeemanModel } from "../model/ZeemanModel.js";
export class ZeemanScreenSummaryContent extends ScreenSummaryContent {
  public constructor(model: ZeemanModel) {
    const s = StringManager.getInstance().getZeemanA11yStrings();
    const details = new DerivedProperty(
      [model.fieldProperty, model.capProperty, model.transitionsProperty, s.currentDetailsStringProperty],
      (field, cap, transitions, pattern) =>
        StringUtils.fillIn(pattern, {
          field: atomicFieldToTesla(field).toPrecision(4),
          cap: atomicFieldToTesla(cap).toPrecision(4),
          count: distinctPhotonEnergies(transitions).length,
        }),
    );
    super({
      playAreaContent: s.screenSummary.playAreaStringProperty,
      controlAreaContent: s.screenSummary.controlAreaStringProperty,
      interactionHintContent: s.screenSummary.interactionHintStringProperty,
      currentDetailsContent: details,
    });
  }
}
