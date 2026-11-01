import { HotkeyData } from "scenerystack/scenery";
import { StringManager } from "../../i18n/StringManager.js";

const strings = StringManager.getInstance().getOrbitalStrings().volume;
export const OrbitalHotkeyData = {
  ORBIT: new HotkeyData({
    keys: ["arrowLeft", "arrowRight", "arrowUp", "arrowDown"],
    repoName: "quantum-atom-3d",
    keyboardHelpDialogLabelStringProperty: strings.orbitHelpStringProperty,
    keyboardHelpDialogPDOMLabelStringProperty: strings.orbitDescriptionStringProperty,
  }),
  ZOOM: new HotkeyData({
    keys: ["equals", "shift+equals", "minus"],
    repoName: "quantum-atom-3d",
    keyboardHelpDialogLabelStringProperty: strings.zoomHelpStringProperty,
    keyboardHelpDialogPDOMLabelStringProperty: strings.zoomDescriptionStringProperty,
  }),
};
