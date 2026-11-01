import {
  BasicActionsKeyboardHelpSection,
  KeyboardHelpIconFactory,
  KeyboardHelpSection,
  KeyboardHelpSectionRow,
  SliderControlsKeyboardHelpSection,
  SpinnerControlsKeyboardHelpSection,
  TextKeyNode,
  TwoColumnKeyboardHelpContent,
} from "scenerystack/scenery-phet";
import { OrbitalHotkeyData } from "../../common/view/OrbitalHotkeyData.js";
import { StringManager } from "../../i18n/StringManager.js";
export class OscillatorKeyboardHelpContent extends TwoColumnKeyboardHelpContent {
  public constructor() {
    super(
      [new SpinnerControlsKeyboardHelpSection(), new SliderControlsKeyboardHelpSection()],
      [
        new KeyboardHelpSection(StringManager.getInstance().getScreenNames().oscillatorStringProperty, [
          KeyboardHelpSectionRow.fromHotkeyData(OrbitalHotkeyData.ORBIT, {
            icon: KeyboardHelpIconFactory.arrowKeysRowIcon(),
          }),
          KeyboardHelpSectionRow.fromHotkeyData(OrbitalHotkeyData.ZOOM, {
            icon: KeyboardHelpIconFactory.iconOrIcon(new TextKeyNode("+"), new TextKeyNode("−")),
          }),
        ]),
        new BasicActionsKeyboardHelpSection(),
      ],
    );
  }
}
