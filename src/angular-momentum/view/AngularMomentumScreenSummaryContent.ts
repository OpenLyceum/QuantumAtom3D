import { DerivedProperty } from "scenerystack/axon";
import { StringUtils } from "scenerystack/phetcommon";
import { ScreenSummaryContent } from "scenerystack/sim";
import { StringManager } from "../../i18n/StringManager.js";
import type { AngularMomentumModel } from "../model/AngularMomentumModel.js";
export class AngularMomentumScreenSummaryContent extends ScreenSummaryContent {
  public constructor(model: AngularMomentumModel) {
    const strings = StringManager.getInstance().getAngularMomentumA11yStrings();
    const details = new DerivedProperty(
      [
        model.lProperty,
        model.mProperty,
        model.spinProperty,
        model.jProperty,
        model.mjProperty,
        strings.currentDetailsStringProperty,
      ],
      (l, m, spin, j, mj, pattern) => StringUtils.fillIn(pattern, { l, m, j: spin ? j : "—", mj: spin ? mj : "—" }),
    );
    super({
      playAreaContent: strings.screenSummary.playAreaStringProperty,
      controlAreaContent: strings.screenSummary.controlAreaStringProperty,
      interactionHintContent: strings.screenSummary.interactionHintStringProperty,
      currentDetailsContent: details,
    });
  }
}
