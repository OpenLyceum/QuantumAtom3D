/**
 * SuperpositionScreen.ts
 *
 * The top-level Screen component. It wires together the model and view
 * factories and passes screen-level options (name, background color, tandem)
 * to the parent Screen class.
 *
 * Registered in the screens array in src/main.ts. Its home-screen and navigation-bar
 * icons come from createSuperpositionIcon() in src/common/QuantumAtom3DScreenIcons.ts
 * (see doc/multi-screen.md).
 */
import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import type { ScreenOptions } from "scenerystack/sim";
import { Screen } from "scenerystack/sim";
import type { Tandem } from "scenerystack/tandem";
import { createSuperpositionIcon } from "../common/QuantumAtom3DScreenIcons.js";
import QuantumAtom3DColors from "../QuantumAtom3DColors.js";
import { SuperpositionModel } from "./model/SuperpositionModel.js";
import { SuperpositionKeyboardHelpContent } from "./view/SuperpositionKeyboardHelpContent.js";
import { SuperpositionScreenView } from "./view/SuperpositionScreenView.js";

// Require tandem to be explicit — accidental omission would break PhET-iO.
type SuperpositionScreenOptions = ScreenOptions & { tandem: Tandem };

export class SuperpositionScreen extends Screen<SuperpositionModel, SuperpositionScreenView> {
  public constructor(options: SuperpositionScreenOptions) {
    super(
      // Model factory — called once when the screen is first shown
      () => new SuperpositionModel(),
      // View factory — receives the model instance
      (model) =>
        new SuperpositionScreenView(model, {
          tandem: options.tandem.createTandem("view"),
        }),
      optionize<SuperpositionScreenOptions, EmptySelfOptions, ScreenOptions>()(
        {
          backgroundColorProperty: QuantumAtom3DColors.backgroundColorProperty,
          createKeyboardHelpNode: () => new SuperpositionKeyboardHelpContent(),
          homeScreenIcon: createSuperpositionIcon(),
          navigationBarIcon: createSuperpositionIcon(),
        },
        options,
      ),
    );
  }
}
