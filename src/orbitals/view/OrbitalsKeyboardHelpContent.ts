/**
 * OrbitalsKeyboardHelpContent.ts
 *
 * Keyboard help for the Orbitals screen: the n, l, m spinners, the Z and
 * cross-section offset sliders, and the radio buttons and checkbox.
 */

import {
  BasicActionsKeyboardHelpSection,
  SliderControlsKeyboardHelpSection,
  SpinnerControlsKeyboardHelpSection,
  TwoColumnKeyboardHelpContent,
} from "scenerystack/scenery-phet";

export class OrbitalsKeyboardHelpContent extends TwoColumnKeyboardHelpContent {
  public constructor() {
    super(
      [new SpinnerControlsKeyboardHelpSection(), new SliderControlsKeyboardHelpSection()],
      [new BasicActionsKeyboardHelpSection({ withCheckboxContent: true })],
    );
  }
}
