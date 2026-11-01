import {
  BasicActionsKeyboardHelpSection,
  SliderControlsKeyboardHelpSection,
  SpinnerControlsKeyboardHelpSection,
  TwoColumnKeyboardHelpContent,
} from "scenerystack/scenery-phet";
export class AngularMomentumKeyboardHelpContent extends TwoColumnKeyboardHelpContent {
  public constructor() {
    super(
      [new SpinnerControlsKeyboardHelpSection(), new SliderControlsKeyboardHelpSection()],
      [new BasicActionsKeyboardHelpSection({ withCheckboxContent: true })],
    );
  }
}
