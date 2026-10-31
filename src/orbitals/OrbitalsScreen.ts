/**
 * OrbitalsScreen.ts
 *
 * The top-level Screen component. It wires together the model and view
 * factories and passes screen-level options (name, background color, tandem)
 * to the parent Screen class.
 *
 * Registered in the screens array in src/main.ts. Its home-screen and navigation-bar
 * icons come from createOrbitalsIcon() in src/common/QuantumAtom3DScreenIcons.ts
 * (see doc/multi-screen.md).
 */
import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import type { ScreenOptions } from "scenerystack/sim";
import { Screen } from "scenerystack/sim";
import type { Tandem } from "scenerystack/tandem";
import { createOrbitalsIcon } from "../common/QuantumAtom3DScreenIcons.js";
import QuantumAtom3DColors from "../QuantumAtom3DColors.js";
import { OrbitalsModel } from "./model/OrbitalsModel.js";
import { OrbitalsKeyboardHelpContent } from "./view/OrbitalsKeyboardHelpContent.js";
import { OrbitalsScreenView } from "./view/OrbitalsScreenView.js";

// Require tandem to be explicit — accidental omission would break PhET-iO.
type OrbitalsScreenOptions = ScreenOptions & { tandem: Tandem };

export class OrbitalsScreen extends Screen<OrbitalsModel, OrbitalsScreenView> {
  public constructor(options: OrbitalsScreenOptions) {
    super(
      // Model factory — called once when the screen is first shown
      () => new OrbitalsModel(),
      // View factory — receives the model instance
      (model) =>
        new OrbitalsScreenView(model, {
          tandem: options.tandem.createTandem("view"),
        }),
      optionize<OrbitalsScreenOptions, EmptySelfOptions, ScreenOptions>()(
        {
          backgroundColorProperty: QuantumAtom3DColors.backgroundColorProperty,
          createKeyboardHelpNode: () => new OrbitalsKeyboardHelpContent(),
          homeScreenIcon: createOrbitalsIcon(),
          navigationBarIcon: createOrbitalsIcon(),
        },
        options,
      ),
    );
  }
}
