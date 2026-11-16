/** The left/right integer spinner used on the Angular Momentum, Zeeman and 3D Oscillator screens. */
import type { Property, TReadOnlyProperty } from "scenerystack/axon";
import type { Range } from "scenerystack/dot";
import { PhetFont } from "scenerystack/scenery-phet";
import { NumberSpinner } from "scenerystack/sun";
import { CREATE_LEFT_RIGHT_SPINNER_SETTINGS } from "../../QuantumAtom3DConstants.js";
import { FLAT_RECTANGULAR_BUTTON_OPTIONS } from "../QuantumAtom3DButtonOptions.js";

type LeftRightSpinnerOptions = {
  /** Added to the value for display only, e.g. 1 to show a zero-based index as 1, 2, 3, … */
  readonly offset?: number;
  readonly fontSize?: number;
  readonly minBackgroundWidth?: number;
};

export function createLeftRightSpinner(
  property: Property<number>,
  range: TReadOnlyProperty<Range>,
  accessibleName: TReadOnlyProperty<string>,
  {
    offset = 0,
    fontSize = CREATE_LEFT_RIGHT_SPINNER_SETTINGS.DEFAULT_FONT_SIZE,
    minBackgroundWidth = CREATE_LEFT_RIGHT_SPINNER_SETTINGS.DEFAULT_MIN_BACKGROUND_WIDTH,
  }: LeftRightSpinnerOptions = {},
): NumberSpinner {
  return new NumberSpinner(property, range, {
    arrowsPosition: "leftRight",
    arrowButtonOptions: FLAT_RECTANGULAR_BUTTON_OPTIONS,
    numberDisplayOptions: {
      textOptions: { font: new PhetFont(fontSize) },
      numberFormatter: (value: number) => `${value + offset}`,
      minBackgroundWidth,
    },
    accessibleName,
  });
}
