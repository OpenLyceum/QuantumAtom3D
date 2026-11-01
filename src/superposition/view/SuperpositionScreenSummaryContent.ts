import { DerivedProperty, type TReadOnlyProperty } from "scenerystack/axon";
import { StringUtils } from "scenerystack/phetcommon";
import { atomicTimeToFs } from "../../common/model/AtomicUnits.js";
import { DEFAULT_LENGTH_UNIT_PROPERTY } from "../../common/view/DisplayDefaults.js";
import { DisposableScreenSummaryContent } from "../../common/view/DisposableScreenSummaryContent.js";
import { formatLength, lengthUnitSymbol } from "../../common/view/formatters.js";
import { StringManager } from "../../i18n/StringManager.js";
import type { LengthUnit } from "../../preferences/QuantumAtom3DPreferencesModel.js";
import type { SuperpositionModel } from "../model/SuperpositionModel.js";

export class SuperpositionScreenSummaryContent extends DisposableScreenSummaryContent {
  private readonly details: TReadOnlyProperty<string>;
  public constructor(
    model: SuperpositionModel,
    unitProperty: TReadOnlyProperty<LengthUnit> = DEFAULT_LENGTH_UNIT_PROPERTY,
  ) {
    const strings = StringManager.getInstance().getSuperpositionA11yStrings();
    const details = new DerivedProperty(
      [
        model.termsProperty,
        model.timeProperty,
        model.expectationsProperty,
        strings.currentDetailsStringProperty,
        unitProperty,
      ],
      (terms, time, values, pattern, unit) =>
        StringUtils.fillIn(pattern, {
          count: terms.length,
          time: atomicTimeToFs(time).toFixed(3),
          z: formatLength(values.z, unit),
          r: formatLength(values.r, unit),
          unit: lengthUnitSymbol(unit),
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
