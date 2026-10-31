/**
 * ZeemanScreen.ts
 *
 * The top-level Screen component. It wires together the model and view
 * factories and passes screen-level options (name, background color, tandem)
 * to the parent Screen class.
 *
 * Registered in the screens array in src/main.ts. Its home-screen and navigation-bar
 * icons come from createZeemanIcon() in src/common/QuantumAtom3DScreenIcons.ts
 * (see doc/multi-screen.md).
 */
import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import type { ScreenOptions } from "scenerystack/sim";
import { Screen } from "scenerystack/sim";
import type { Tandem } from "scenerystack/tandem";
import { createZeemanIcon } from "../common/QuantumAtom3DScreenIcons.js";
import QuantumAtom3DColors from "../QuantumAtom3DColors.js";
import { ZeemanModel } from "./model/ZeemanModel.js";
import { ZeemanKeyboardHelpContent } from "./view/ZeemanKeyboardHelpContent.js";
import { ZeemanScreenView } from "./view/ZeemanScreenView.js";

// Require tandem to be explicit — accidental omission would break PhET-iO.
type ZeemanScreenOptions = ScreenOptions & { tandem: Tandem };

export class ZeemanScreen extends Screen<ZeemanModel, ZeemanScreenView> {
  public constructor(options: ZeemanScreenOptions) {
    super(
      // Model factory — called once when the screen is first shown
      () => new ZeemanModel(),
      // View factory — receives the model instance
      (model) =>
        new ZeemanScreenView(model, {
          tandem: options.tandem.createTandem("view"),
        }),
      optionize<ZeemanScreenOptions, EmptySelfOptions, ScreenOptions>()(
        {
          backgroundColorProperty: QuantumAtom3DColors.backgroundColorProperty,
          createKeyboardHelpNode: () => new ZeemanKeyboardHelpContent(),
          homeScreenIcon: createZeemanIcon(),
          navigationBarIcon: createZeemanIcon(),
        },
        options,
      ),
    );
  }
}
