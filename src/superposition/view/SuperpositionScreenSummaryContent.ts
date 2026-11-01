import { DerivedProperty } from "scenerystack/axon";
import { StringUtils } from "scenerystack/phetcommon";
import { ScreenSummaryContent } from "scenerystack/sim";
import { atomicTimeToFs } from "../../common/model/AtomicUnits.js";
import { StringManager } from "../../i18n/StringManager.js";
import type { SuperpositionModel } from "../model/SuperpositionModel.js";

export class SuperpositionScreenSummaryContent extends ScreenSummaryContent {
  public constructor(model: SuperpositionModel) {
    const strings = StringManager.getInstance().getSuperpositionA11yStrings();
    const details = new DerivedProperty(
      [model.termsProperty, model.timeProperty, model.expectationsProperty, strings.currentDetailsStringProperty],
      (terms, time, values, pattern) =>
        StringUtils.fillIn(pattern, {
          count: terms.length,
          time: atomicTimeToFs(time).toFixed(3),
          z: values.z.toFixed(2),
          r: values.r.toFixed(2),
        }),
    );
    super({
      playAreaContent: strings.screenSummary.playAreaStringProperty,
      controlAreaContent: strings.screenSummary.controlAreaStringProperty,
      interactionHintContent: strings.screenSummary.interactionHintStringProperty,
      currentDetailsContent: details,
    });
  }
}
