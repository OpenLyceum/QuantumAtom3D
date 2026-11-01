/**
 * OscillatorScreen.ts
 *
 * The top-level Screen component. It wires together the model and view
 * factories and passes screen-level options (name, background color, tandem)
 * to the parent Screen class.
 *
 * Registered in the screens array in src/main.ts. Its home-screen and navigation-bar
 * icons come from createOscillatorIcon() in src/common/QuantumAtom3DScreenIcons.ts
 * (see doc/multi-screen.md).
 */
import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import type { ScreenOptions } from "scenerystack/sim";
import { Screen } from "scenerystack/sim";
import type { Tandem } from "scenerystack/tandem";
import { createOscillatorIcon } from "../common/QuantumAtom3DScreenIcons.js";
import type { QuantumAtom3DPreferencesModel } from "../preferences/QuantumAtom3DPreferencesModel.js";
import QuantumAtom3DColors from "../QuantumAtom3DColors.js";
import { OscillatorModel } from "./model/OscillatorModel.js";
import { OscillatorKeyboardHelpContent } from "./view/OscillatorKeyboardHelpContent.js";
import { OscillatorScreenView } from "./view/OscillatorScreenView.js";

// Require tandem to be explicit — accidental omission would break PhET-iO.
type OscillatorScreenOptions = ScreenOptions & { tandem: Tandem; preferences: QuantumAtom3DPreferencesModel };

export class OscillatorScreen extends Screen<OscillatorModel, OscillatorScreenView> {
  public constructor(options: OscillatorScreenOptions) {
    super(
      // Model factory — called once when the screen is first shown
      () => new OscillatorModel(),
      // View factory — receives the model instance
      (model) =>
        new OscillatorScreenView(model, {
          phaseColormapProperty: options.preferences.phaseColormapProperty,
          tandem: options.tandem.createTandem("view"),
        }),
      optionize<OscillatorScreenOptions, EmptySelfOptions, ScreenOptions>()(
        {
          backgroundColorProperty: QuantumAtom3DColors.backgroundColorProperty,
          createKeyboardHelpNode: () => new OscillatorKeyboardHelpContent(),
          homeScreenIcon: createOscillatorIcon(),
          navigationBarIcon: createOscillatorIcon(),
        },
        options,
      ),
    );
  }
}
