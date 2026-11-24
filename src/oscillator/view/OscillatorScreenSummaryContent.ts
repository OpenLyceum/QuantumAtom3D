import { DerivedProperty } from "scenerystack/axon";
import { toFixed } from "scenerystack/dot";
import { StringUtils } from "scenerystack/phetcommon";
import {
  cartesianExpansion,
  cartesianStates,
  oscillatorDegeneracy,
  sphericalStates,
} from "../../common/model/oscillator/OscillatorStates.js";
import { DisposableScreenSummaryContent } from "../../common/view/DisposableScreenSummaryContent.js";
import { StringManager } from "../../i18n/StringManager.js";
import { OSCILLATOR_SCREEN_SUMMARY_CONTENT_SETTINGS } from "../../QuantumAtom3DConstants.js";
import type { OscillatorModel } from "../model/OscillatorModel.js";
export class OscillatorScreenSummaryContent extends DisposableScreenSummaryContent {
  public constructor(model: OscillatorModel) {
    const s = StringManager.getInstance().getOscillatorA11yStrings();
    const labels = StringManager.getInstance().getOscillatorStrings();
    const detailsProperty = new DerivedProperty(
      [
        model.shellProperty,
        model.basisProperty,
        model.cartesianIndexProperty,
        model.sphericalIndexProperty,
        s.currentDetailsStringProperty,
        labels.cartesianStringProperty,
        labels.sphericalStringProperty,
      ],
      (N, basis, row, column, pattern, cartName, sphereName) => {
        const cart = cartesianStates(N)[row] ?? cartesianStates(N)[0];
        const sphere = sphericalStates(N)[column] ?? sphericalStates(N)[0];
        const coefficient =
          cart && sphere
            ? cartesianExpansion(cart).find((t) => t.n === sphere.nr && t.l === sphere.l && t.m === sphere.m)
            : undefined;
        return StringUtils.fillIn(pattern, {
          N,
          energy: N + 1.5,
          count: oscillatorDegeneracy(N),
          basis: basis === "cartesian" ? cartName : sphereName,
          cart: cart?.join(",") ?? "",
          sphere: sphere ? `${sphere.nr},${sphere.l},${sphere.m}` : "",
          re: toFixed(coefficient?.re ?? 0, OSCILLATOR_SCREEN_SUMMARY_CONTENT_SETTINGS.DETAILS_DECIMAL_PLACES),
          im: toFixed(-(coefficient?.im ?? 0), OSCILLATOR_SCREEN_SUMMARY_CONTENT_SETTINGS.DETAILS_DECIMAL_PLACES),
        });
      },
    );
    super(s.screenSummary, detailsProperty);
  }
}
