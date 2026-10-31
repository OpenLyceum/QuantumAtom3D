/**
 * AngularMomentumScreen.ts
 *
 * The top-level Screen component. It wires together the model and view
 * factories and passes screen-level options (name, background color, tandem)
 * to the parent Screen class.
 *
 * Registered in the screens array in src/main.ts. Its home-screen and navigation-bar
 * icons come from createAngularMomentumIcon() in src/common/QuantumAtom3DScreenIcons.ts
 * (see doc/multi-screen.md).
 */
import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import type { ScreenOptions } from "scenerystack/sim";
import { Screen } from "scenerystack/sim";
import type { Tandem } from "scenerystack/tandem";
import { createAngularMomentumIcon } from "../common/QuantumAtom3DScreenIcons.js";
import QuantumAtom3DColors from "../QuantumAtom3DColors.js";
import { AngularMomentumModel } from "./model/AngularMomentumModel.js";
import { AngularMomentumKeyboardHelpContent } from "./view/AngularMomentumKeyboardHelpContent.js";
import { AngularMomentumScreenView } from "./view/AngularMomentumScreenView.js";

// Require tandem to be explicit — accidental omission would break PhET-iO.
type AngularMomentumScreenOptions = ScreenOptions & { tandem: Tandem };

export class AngularMomentumScreen extends Screen<AngularMomentumModel, AngularMomentumScreenView> {
  public constructor(options: AngularMomentumScreenOptions) {
    super(
      // Model factory — called once when the screen is first shown
      () => new AngularMomentumModel(),
      // View factory — receives the model instance
      (model) =>
        new AngularMomentumScreenView(model, {
          tandem: options.tandem.createTandem("view"),
        }),
      optionize<AngularMomentumScreenOptions, EmptySelfOptions, ScreenOptions>()(
        {
          backgroundColorProperty: QuantumAtom3DColors.backgroundColorProperty,
          createKeyboardHelpNode: () => new AngularMomentumKeyboardHelpContent(),
          homeScreenIcon: createAngularMomentumIcon(),
          navigationBarIcon: createAngularMomentumIcon(),
        },
        options,
      ),
    );
  }
}
