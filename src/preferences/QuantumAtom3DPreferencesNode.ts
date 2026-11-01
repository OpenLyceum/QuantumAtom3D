/**
 * QuantumAtom3DPreferencesNode.ts
 *
 * Custom preferences UI shown in Preferences → Simulation. Controls are bound
 * to QuantumAtom3DPreferencesModel Properties (whose initial values come from
 * quantumAtom3DQueryParameters).
 */

import { Text, VBox } from "scenerystack/scenery";
import { PhetFont } from "scenerystack/scenery-phet";
import { AquaRadioButtonGroup, Checkbox, VerticalAquaRadioButtonGroup } from "scenerystack/sun";
import type { Tandem } from "scenerystack/tandem";
import { StringManager } from "../i18n/StringManager.js";
import QuantumAtom3DColors from "../QuantumAtom3DColors.js";
import type { PhaseColormap } from "../QuantumAtom3DConstants.js";
import QuantumAtom3DNamespace from "../QuantumAtom3DNamespace.js";
import type { QuantumAtom3DPreferencesModel } from "./QuantumAtom3DPreferencesModel.js";

export class QuantumAtom3DPreferencesNode extends VBox {
  public constructor(preferencesModel: QuantumAtom3DPreferencesModel, tandem?: Tandem) {
    const prefStrings = StringManager.getInstance().getPreferences();

    // The Preferences dialog is always white, so use the dark "light control surface"
    // colors (readable on white in both default and projector profiles), not textColorProperty
    // (which is near-white in default mode and would be invisible on the white dialog).
    const header = new Text(prefStrings.titleStringProperty, {
      font: new PhetFont({ size: 18, weight: "bold" }),
      fill: QuantumAtom3DColors.controlSurfaceTextColorProperty,
    });

    const colormapLabel = new Text(prefStrings.phaseColormapStringProperty, {
      font: new PhetFont(14),
      fill: QuantumAtom3DColors.controlSurfaceTextColorProperty,
    });

    const createItemText = (stringProperty: typeof prefStrings.phaseColormapHsvStringProperty): Text =>
      new Text(stringProperty, { font: new PhetFont(14), fill: QuantumAtom3DColors.controlSurfaceTextColorProperty });

    const colormapRadioButtons = new VerticalAquaRadioButtonGroup<PhaseColormap>(
      preferencesModel.phaseColormapProperty,
      [
        {
          value: "hsv",
          createNode: () => createItemText(prefStrings.phaseColormapHsvStringProperty),
          options: { accessibleName: prefStrings.phaseColormapHsvStringProperty },
        },
        {
          value: "uniform",
          createNode: () => createItemText(prefStrings.phaseColormapUniformStringProperty),
          options: { accessibleName: prefStrings.phaseColormapUniformStringProperty },
        },
      ],
      {
        accessibleName: prefStrings.phaseColormapStringProperty,
        spacing: 8,
        radioButtonOptions: { radius: 6 },
        ...(tandem && { tandem: tandem.createTandem("phaseColormapRadioButtonGroup") }),
      },
    );

    const lengthButtons = new AquaRadioButtonGroup(
      preferencesModel.lengthUnitProperty,
      (["a0", "pm"] as const).map((value) => ({
        value,
        createNode: () => createItemText(prefStrings[`${value}StringProperty`]),
        options: { accessibleName: prefStrings[`${value}StringProperty`] },
      })),
      { orientation: "horizontal", spacing: 12, accessibleName: prefStrings.lengthUnitStringProperty },
    );
    const qualityButtons = new AquaRadioButtonGroup(
      preferencesModel.qualityProperty,
      (["auto", "low", "medium", "high"] as const).map((value) => ({
        value,
        createNode: () => createItemText(prefStrings[`${value}StringProperty`]),
        options: { accessibleName: prefStrings[`${value}StringProperty`] },
      })),
      { orientation: "horizontal", spacing: 12, accessibleName: prefStrings.qualityStringProperty },
    );
    const formulas = new Checkbox(
      preferencesModel.showFormulasProperty,
      createItemText(prefStrings.showFormulasStringProperty),
      { accessibleName: prefStrings.showFormulasStringProperty },
    );
    super({
      align: "left",
      spacing: 12,
      children: [
        header,
        colormapLabel,
        colormapRadioButtons,
        createItemText(prefStrings.lengthUnitStringProperty),
        lengthButtons,
        createItemText(prefStrings.qualityStringProperty),
        qualityButtons,
        formulas,
      ],
    });
  }
}

QuantumAtom3DNamespace.register("QuantumAtom3DPreferencesNode", QuantumAtom3DPreferencesNode);
