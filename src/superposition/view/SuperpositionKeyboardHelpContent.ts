/** Same camera, spinner and slider shortcuts as the Orbitals screen, plus the time controls. */
import { OrbitalsKeyboardHelpContent } from "../../common/view/OrbitalsKeyboardHelpContent.js";

export class SuperpositionKeyboardHelpContent extends OrbitalsKeyboardHelpContent {
  public constructor() {
    super({ includeTimeControls: true });
  }
}
