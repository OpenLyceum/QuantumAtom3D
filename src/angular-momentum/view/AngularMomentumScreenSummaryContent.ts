import { DerivedProperty } from "scenerystack/axon";
import { StringUtils } from "scenerystack/phetcommon";
import { angularMagnitude, orbitalUncertaintyProduct } from "../../common/model/angular/VectorModel.js";
import { DisposableScreenSummaryContent } from "../../common/view/DisposableScreenSummaryContent.js";
import { StringManager } from "../../i18n/StringManager.js";
import { ANGULAR_MOMENTUM_SCREEN_SUMMARY_CONTENT_SETTINGS } from "../../QuantumAtom3DConstants.js";
import type { AngularMomentumModel } from "../model/AngularMomentumModel.js";
export class AngularMomentumScreenSummaryContent extends DisposableScreenSummaryContent {
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
      (l, m, spin, j, mj, pattern) =>
        StringUtils.fillIn(pattern, {
          l,
          m: spin ? "—" : m,
          j: spin ? j : "—",
          mj: spin ? mj : "—",
          L: angularMagnitude(l).toFixed(ANGULAR_MOMENTUM_SCREEN_SUMMARY_CONTENT_SETTINGS.DETAILS_DECIMAL_PLACES),
          S: spin
            ? angularMagnitude(0.5).toFixed(ANGULAR_MOMENTUM_SCREEN_SUMMARY_CONTENT_SETTINGS.DETAILS_DECIMAL_PLACES)
            : "—",
          J: spin
            ? angularMagnitude(j).toFixed(ANGULAR_MOMENTUM_SCREEN_SUMMARY_CONTENT_SETTINGS.DETAILS_DECIMAL_PLACES)
            : "—",
          uncertainty: spin
            ? "—"
            : orbitalUncertaintyProduct(l, m).toFixed(
                ANGULAR_MOMENTUM_SCREEN_SUMMARY_CONTENT_SETTINGS.DETAILS_DECIMAL_PLACES,
              ),
        }),
    );
    super(strings.screenSummary, details);
  }
}
