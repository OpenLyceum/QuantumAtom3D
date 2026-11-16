import { QUANTUM_ATOM_3D_PREFERENCES_NODE_SETTINGS } from "../QuantumAtom3DConstants.js";
/**
 * QuantumAtom3DPreferencesNode.ts
 *
 * Custom preferences UI shown in Preferences → Simulation. Controls are bound
 * to QuantumAtom3DPreferencesModel Properties (whose initial values come from
 * quantumAtom3DQueryParameters).
 */

import type { Property, TReadOnlyProperty } from "scenerystack/axon";
import { RichText, Text, VBox } from "scenerystack/scenery";
import { PhetFont } from "scenerystack/scenery-phet";
import { AquaRadioButtonGroup, Checkbox, VerticalAquaRadioButtonGroup } from "scenerystack/sun";
import type { Tandem } from "scenerystack/tandem";
import { StringManager } from "../i18n/StringManager.js";
import QuantumAtom3DColors from "../QuantumAtom3DColors.js";
import type { PhaseColormap } from "../QuantumAtom3DConstants.js";
import QuantumAtom3DNamespace from "../QuantumAtom3DNamespace.js";
import type { LengthUnit, QuantumAtom3DPreferencesModel, RenderQuality } from "./QuantumAtom3DPreferencesModel.js";

export class QuantumAtom3DPreferencesNode extends VBox {
  public constructor(preferencesModel: QuantumAtom3DPreferencesModel, tandem?: Tandem, compact = false) {
    const prefStrings = StringManager.getInstance().getPreferences();

    // The Preferences dialog is always white, so use the dark "light control surface"
    // colors (readable on white in both default and projector profiles), not textColorProperty
    // (which is near-white in default mode and would be invisible on the white dialog).
    const header = new Text(prefStrings.titleStringProperty, {
      font: new PhetFont({ size: QUANTUM_ATOM_3D_PREFERENCES_NODE_SETTINGS.HEADER_FONT_SIZE, weight: "bold" }),
      fill: QuantumAtom3DColors.controlSurfaceTextColorProperty,
    });

    const colormapLabel = new Text(prefStrings.phaseColormapStringProperty, {
      font: new PhetFont(QUANTUM_ATOM_3D_PREFERENCES_NODE_SETTINGS.COLORMAP_LABEL_FONT_SIZE),
      fill: QuantumAtom3DColors.controlSurfaceTextColorProperty,
    });

    const createItemText = (stringProperty: typeof prefStrings.phaseColormapHsvStringProperty): RichText =>
      new RichText(stringProperty, {
        font: new PhetFont(QUANTUM_ATOM_3D_PREFERENCES_NODE_SETTINGS.CREATE_ITEM_TEXT_FONT_SIZE),
        fill: QuantumAtom3DColors.controlSurfaceTextColorProperty,
        ...(compact && { lineWrap: QUANTUM_ATOM_3D_PREFERENCES_NODE_SETTINGS.CREATE_ITEM_TEXT_LINE_WRAP }),
      });

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
        spacing: QUANTUM_ATOM_3D_PREFERENCES_NODE_SETTINGS.COLORMAP_RADIO_BUTTONS_SPACING,
        radioButtonOptions: { radius: QUANTUM_ATOM_3D_PREFERENCES_NODE_SETTINGS.COLORMAP_RADIO_BUTTONS_RADIUS },
        ...(tandem && { tandem: tandem.createTandem("phaseColormapRadioButtonGroup") }),
      },
    );

    // A row of choices whose labels are `prefStrings.<value>StringProperty`.
    const createChoiceButtons = <T extends LengthUnit | RenderQuality>(
      property: Property<T>,
      values: readonly T[],
      accessibleName: TReadOnlyProperty<string>,
    ) =>
      new AquaRadioButtonGroup(
        property,
        values.map((value) => ({
          value,
          createNode: () => createItemText(prefStrings[`${value}StringProperty`]),
          options: { accessibleName: prefStrings[`${value}StringProperty`] },
        })),
        {
          orientation: compact ? "vertical" : "horizontal",
          spacing: QUANTUM_ATOM_3D_PREFERENCES_NODE_SETTINGS.CREATE_CHOICE_BUTTONS_SPACING,
          accessibleName,
        },
      );
    const lengthButtons = createChoiceButtons(
      preferencesModel.lengthUnitProperty,
      ["a0", "pm"],
      prefStrings.lengthUnitStringProperty,
    );
    const qualityButtons = createChoiceButtons(
      preferencesModel.qualityProperty,
      ["auto", "low", "medium", "high"],
      prefStrings.qualityStringProperty,
    );
    const formulas = new Checkbox(
      preferencesModel.showFormulasProperty,
      createItemText(prefStrings.showFormulasStringProperty),
      { accessibleName: prefStrings.showFormulasStringProperty },
    );
    super({
      align: "left",
      spacing: QUANTUM_ATOM_3D_PREFERENCES_NODE_SETTINGS.SPACING,
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
