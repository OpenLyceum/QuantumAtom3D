/**
 * QuantumNumberControl.ts
 *
 * Three spinners for n, l and m that follow the l and m ranges of a
 * QuantumNumbersModel, and a label naming the current state ("3d, m = +1"
 * or "3d_xz"). Reused wherever a single hydrogenic state is picked.
 */

import { DerivedProperty, type TReadOnlyProperty } from "scenerystack/axon";
import { StringUtils } from "scenerystack/phetcommon";
import { HBox, RichText, Text, VBox, type VBoxOptions } from "scenerystack/scenery";
import { PhetFont } from "scenerystack/scenery-phet";
import { NumberSpinner } from "scenerystack/sun";
import { StringManager } from "../../i18n/StringManager.js";
import QuantumAtom3DColors from "../../QuantumAtom3DColors.js";
import { type OrbitalBasis, realOrbitalSubscript, spectroscopicLetter } from "../model/orbital/OrbitalCatalog.js";
import type { QuantumNumbersModel } from "../model/orbital/QuantumNumbersModel.js";
import { FLAT_RECTANGULAR_BUTTON_OPTIONS } from "../QuantumAtom3DButtonOptions.js";
import { formatSigned } from "./formatters.js";

const LABEL_FONT = new PhetFont({ size: 16, style: "italic" });
const SPINNER_FONT = new PhetFont(15);
const STATE_FONT = new PhetFont({ size: 18, weight: "bold" });
const SPINNER_SPACING = 14;
const SPINNER_DISPLAY_WIDTH = 40;
const ROW_SPACING = 10;

/** The visible name of state (n, l, m) in either basis, as RichText markup. */
function createStateLabelProperty(
  quantumNumbers: QuantumNumbersModel,
  basisProperty: TReadOnlyProperty<OrbitalBasis>,
): TReadOnlyProperty<string> {
  const strings = StringManager.getInstance().getOrbitalStrings();
  return new DerivedProperty(
    [
      quantumNumbers.nProperty,
      quantumNumbers.lProperty,
      quantumNumbers.mProperty,
      basisProperty,
      strings.complexStateStringProperty,
      strings.realStateStringProperty,
    ],
    (n, l, m, basis, complexPattern, realPattern) => {
      const letter = spectroscopicLetter(l);
      if (basis === "real" && l > 0) {
        return StringUtils.fillIn(realPattern, { n, letter, subscript: realOrbitalSubscript(l, m) });
      }
      if (l === 0) {
        return `${n}${letter}`;
      }
      return StringUtils.fillIn(complexPattern, { n, letter, m: formatSigned(m) });
    },
  );
}

export type QuantumNumberControlOptions = VBoxOptions & {
  readonly basisProperty: TReadOnlyProperty<OrbitalBasis>;
};

export class QuantumNumberControl extends VBox {
  private readonly stateLabelProperty: TReadOnlyProperty<string>;

  public constructor(quantumNumbers: QuantumNumbersModel, options: QuantumNumberControlOptions) {
    const { basisProperty, ...vboxOptions } = options;
    const strings = StringManager.getInstance().getOrbitalStrings();
    const a11y = StringManager.getInstance().getOrbitalsA11yStrings().controls;

    const createSpinner = (
      label: TReadOnlyProperty<string>,
      property: QuantumNumbersModel["nProperty"],
      rangeProperty: QuantumNumbersModel["lRangeProperty"],
      accessibleName: TReadOnlyProperty<string>,
      accessibleHelpText: TReadOnlyProperty<string>,
    ) =>
      new VBox({
        spacing: 2,
        children: [
          new Text(label, { font: LABEL_FONT, fill: QuantumAtom3DColors.textColorProperty }),
          new NumberSpinner(property, rangeProperty, {
            // NumberSpinner sizes its arrows from the display; topBottom makes them as wide as it.
            arrowsPosition: "topBottom",
            arrowButtonOptions: FLAT_RECTANGULAR_BUTTON_OPTIONS,
            numberDisplayOptions: {
              textOptions: { font: SPINNER_FONT },
              minBackgroundWidth: SPINNER_DISPLAY_WIDTH,
              numberFormatter: (value: number) =>
                property === quantumNumbers.mProperty ? formatSigned(value) : `${value}`,
            },
            accessibleName,
            accessibleHelpText,
          }),
        ],
      });

    const stateLabelProperty = createStateLabelProperty(quantumNumbers, basisProperty);
    const stateLabel = new RichText(stateLabelProperty, {
      font: STATE_FONT,
      fill: QuantumAtom3DColors.accentColorProperty,
      maxWidth: 220,
    });

    super({
      spacing: ROW_SPACING,
      align: "center",
      children: [
        new HBox({
          spacing: SPINNER_SPACING,
          align: "top",
          children: [
            createSpinner(
              strings.principalStringProperty,
              quantumNumbers.nProperty,
              quantumNumbers.nProperty.rangeProperty,
              a11y.principalStringProperty,
              a11y.principalHelpStringProperty,
            ),
            createSpinner(
              strings.orbitalStringProperty,
              quantumNumbers.lProperty,
              quantumNumbers.lRangeProperty,
              a11y.orbitalStringProperty,
              a11y.orbitalHelpStringProperty,
            ),
            createSpinner(
              strings.magneticStringProperty,
              quantumNumbers.mProperty,
              quantumNumbers.mRangeProperty,
              a11y.magneticStringProperty,
              a11y.magneticHelpStringProperty,
            ),
          ],
        }),
        stateLabel,
      ],
      ...vboxOptions,
    });
    this.stateLabelProperty = stateLabelProperty;
  }

  public override dispose(): void {
    this.stateLabelProperty.dispose();
    super.dispose();
  }
}
