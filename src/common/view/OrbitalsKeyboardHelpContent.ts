/**
 * OrbitalsKeyboardHelpContent.ts
 *
 * Keyboard help for the Orbitals screen: the n, l, m spinners, the Z and
 * cross-section offset sliders, and the radio buttons and checkbox.
 * Superposition reuses it with `includeTimeControls`, since that screen runs a
 * TimeControlNode (Alt+K play/pause) and Orbitals does not.
 */

import {
  BasicActionsKeyboardHelpSection,
  KeyboardHelpIconFactory,
  KeyboardHelpSection,
  KeyboardHelpSectionRow,
  SliderControlsKeyboardHelpSection,
  SpinnerControlsKeyboardHelpSection,
  TextKeyNode,
  TimeControlsKeyboardHelpSection,
  TwoColumnKeyboardHelpContent,
} from "scenerystack/scenery-phet";
import { StringManager } from "../../i18n/StringManager.js";
import { OrbitalHotkeyData } from "./OrbitalHotkeyData.js";

export type OrbitalsKeyboardHelpContentOptions = {
  /** Document the TimeControlNode's Alt+K play/pause (Superposition only). */
  includeTimeControls?: boolean;
};

export class OrbitalsKeyboardHelpContent extends TwoColumnKeyboardHelpContent {
  public constructor(options?: OrbitalsKeyboardHelpContentOptions) {
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
        ...(options?.includeTimeControls ? [new TimeControlsKeyboardHelpSection()] : []),
        new BasicActionsKeyboardHelpSection({ withCheckboxContent: true }),
      ],
    );
  }
}
