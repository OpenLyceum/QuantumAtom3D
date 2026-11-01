import { DerivedProperty, type TReadOnlyProperty } from "scenerystack/axon";
import { StringUtils } from "scenerystack/phetcommon";
import { angularMagnitude, orbitalUncertaintyProduct } from "../../common/model/angular/VectorModel.js";
import { DisposableScreenSummaryContent } from "../../common/view/DisposableScreenSummaryContent.js";
import { StringManager } from "../../i18n/StringManager.js";
import type { AngularMomentumModel } from "../model/AngularMomentumModel.js";
export class AngularMomentumScreenSummaryContent extends DisposableScreenSummaryContent {
  private readonly details: TReadOnlyProperty<string>;
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
          L: angularMagnitude(l).toFixed(3),
          S: spin ? angularMagnitude(0.5).toFixed(3) : "—",
          J: spin ? angularMagnitude(j).toFixed(3) : "—",
          uncertainty: spin ? "—" : orbitalUncertaintyProduct(l, m).toFixed(3),
        }),
    );
    super({
      playAreaContent: strings.screenSummary.playAreaStringProperty,
      controlAreaContent: strings.screenSummary.controlAreaStringProperty,
      interactionHintContent: strings.screenSummary.interactionHintStringProperty,
      currentDetailsContent: details,
    });
    this.details = details;
  }
  public override dispose(): void {
    super.dispose();
    this.details.dispose();
  }
}
