/**
 * OrbitalsKeyboardHelpContent.ts
 *
 * Keyboard help for the Orbitals screen: the n, l, m spinners, the Z and
 * cross-section offset sliders, and the radio buttons and checkbox.
 */

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

export class OrbitalsKeyboardHelpContent extends TwoColumnKeyboardHelpContent {
  public constructor() {
    super(
      [new SpinnerControlsKeyboardHelpSection(), new SliderControlsKeyboardHelpSection()],
      [
        new KeyboardHelpSection(StringManager.getInstance().getOrbitalStrings().volume.titleStringProperty, [
          KeyboardHelpSectionRow.fromHotkeyData(OrbitalHotkeyData.ORBIT, {
            icon: KeyboardHelpIconFactory.arrowKeysRowIcon(),
          }),
          KeyboardHelpSectionRow.fromHotkeyData(OrbitalHotkeyData.ZOOM, {
            icon: KeyboardHelpIconFactory.iconOrIcon(new TextKeyNode("+"), new TextKeyNode("−")),
          }),
        ]),
        new BasicActionsKeyboardHelpSection({ withCheckboxContent: true }),
      ],
    );
  }
}
