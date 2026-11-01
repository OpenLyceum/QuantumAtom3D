/**
 * OrbitalsControlPanel.ts
 *
 * The state picker for the Orbitals screen: the n, l, m spinners, the choice
 * of complex or real angular functions, the nuclear charge Z (with the ion's
 * symbol), the zoom buttons and the nodes checkbox.
 */

import { DerivedProperty, type TReadOnlyProperty } from "scenerystack/axon";
import { Bounds2, Dimension2 } from "scenerystack/dot";
import { AlignBox, HBox, HSeparator, RichText, Text, VBox } from "scenerystack/scenery";
import { NumberControl, PhetFont, PlusMinusZoomButtonGroup } from "scenerystack/scenery-phet";
import { Checkbox, RectangularPushButton, VerticalAquaRadioButtonGroup } from "scenerystack/sun";
import { hydrogenicIonSymbol } from "../../common/model/hydrogen/HydrogenicIons.js";
import type { OrbitalBasis } from "../../common/model/orbital/OrbitalCatalog.js";
import { ORBITAL_PRESETS } from "../../common/model/orbital/OrbitalPresets.js";
import {
  FLAT_PANEL_PUSH_BUTTON_OPTIONS,
  FLAT_RECTANGULAR_BUTTON_OPTIONS,
  LIGHT_SURFACE_TEXT_FILL,
} from "../../common/QuantumAtom3DButtonOptions.js";
import {
  QUANTUM_ATOM_3D_CHECKBOX_OPTIONS,
  QUANTUM_ATOM_3D_NUMBER_CONTROL_OPTIONS,
} from "../../common/QuantumAtom3DControlOptions.js";
import { QuantumAtom3DPanel } from "../../common/QuantumAtom3DPanel.js";
import { QuantumNumberControl } from "../../common/view/QuantumNumberControl.js";
import { StringManager } from "../../i18n/StringManager.js";
import QuantumAtom3DColors from "../../QuantumAtom3DColors.js";
import { MAX_NUCLEAR_CHARGE, MIN_NUCLEAR_CHARGE } from "../../QuantumAtom3DConstants.js";
import type { OrbitalsModel } from "../model/OrbitalsModel.js";

const TITLE_FONT = new PhetFont({ size: 14, weight: "bold" });
const LABEL_FONT = new PhetFont(13);
const ION_FONT = new PhetFont({ size: 16, weight: "bold" });
const SECTION_SPACING = 7;
const RADIO_SPACING = 6;
const RADIO_RADIUS = 7;
const ZOOM_ICON_SIZE = new Dimension2(10, 2);
const PANEL_CONTENT_WIDTH = 230;

/** Fixed slot for the ion symbol, wide enough for "Be³⁺", so the panel keeps its width as Z changes. */
const ION_LABEL_WIDTH = 44;

export class OrbitalsControlPanel extends QuantumAtom3DPanel {
  private readonly ionSymbolProperty: TReadOnlyProperty<string>;

  public constructor(model: OrbitalsModel) {
    const strings = StringManager.getInstance().getOrbitalStrings();
    const a11y = StringManager.getInstance().getOrbitalsA11yStrings().controls;
    const text = (property: TReadOnlyProperty<string>, font = LABEL_FONT) =>
      new RichText(property, { font, fill: QuantumAtom3DColors.textColorProperty, maxWidth: PANEL_CONTENT_WIDTH });

    const quantumNumberControl = new QuantumNumberControl(model.quantumNumbers, {
      basisProperty: model.basisProperty,
    });

    const basisRadioButtons = new VerticalAquaRadioButtonGroup<OrbitalBasis>(
      model.basisProperty,
      [
        {
          value: "complex",
          createNode: () => text(strings.complexBasisStringProperty),
          options: { accessibleName: a11y.complexBasisStringProperty },
        },
        {
          value: "real",
          createNode: () => text(strings.realBasisStringProperty),
          options: { accessibleName: a11y.realBasisStringProperty },
        },
      ],
      {
        spacing: RADIO_SPACING,
        radioButtonOptions: { radius: RADIO_RADIUS },
        accessibleName: a11y.basisStringProperty,
      },
    );

    const ionSymbolProperty = new DerivedProperty([model.nuclearChargeProperty], (Z) => hydrogenicIonSymbol(Z));
    const nuclearChargeControl = new NumberControl(
      strings.nuclearChargeStringProperty,
      model.nuclearChargeProperty,
      model.nuclearChargeProperty.range,
      {
        ...QUANTUM_ATOM_3D_NUMBER_CONTROL_OPTIONS,
        delta: 1,
        titleNodeOptions: { font: LABEL_FONT, fill: QuantumAtom3DColors.textColorProperty },
        numberDisplayOptions: { decimalPlaces: 0 },
        sliderOptions: {
          ...QUANTUM_ATOM_3D_NUMBER_CONTROL_OPTIONS.sliderOptions,
          constrainValue: (value: number) => Math.round(value),
          // The default step is a fraction of the range, which the rounding above would undo.
          keyboardStep: 1,
          shiftKeyboardStep: 1,
          pageKeyboardStep: 1,
          majorTicks: [
            {
              value: MIN_NUCLEAR_CHARGE,
              label: new Text(`${MIN_NUCLEAR_CHARGE}`, {
                font: LABEL_FONT,
                fill: QuantumAtom3DColors.textColorProperty,
              }),
            },
            {
              value: MAX_NUCLEAR_CHARGE,
              label: new Text(`${MAX_NUCLEAR_CHARGE}`, {
                font: LABEL_FONT,
                fill: QuantumAtom3DColors.textColorProperty,
              }),
            },
          ],
          majorTickStroke: QuantumAtom3DColors.textColorProperty,
          minorTickSpacing: 1,
          minorTickStroke: QuantumAtom3DColors.textColorProperty,
        },
        accessibleName: a11y.nuclearChargeStringProperty,
        accessibleHelpText: a11y.nuclearChargeHelpStringProperty,
      },
    );
    const ionText = new Text(ionSymbolProperty, {
      font: ION_FONT,
      fill: QuantumAtom3DColors.accentColorProperty,
      maxWidth: ION_LABEL_WIDTH,
    });
    const ionLabel = new AlignBox(ionText, {
      alignBounds: new Bounds2(0, 0, ION_LABEL_WIDTH, ionText.height),
      xAlign: "left",
    });

    const zoomButtons = new PlusMinusZoomButtonGroup(model.zoomLevelProperty, {
      orientation: "horizontal",
      iconOptions: { size: ZOOM_ICON_SIZE },
      buttonOptions: { ...FLAT_RECTANGULAR_BUTTON_OPTIONS },
    });

    const nodesCheckbox = new Checkbox(model.nodesVisibleProperty, text(strings.showNodesStringProperty), {
      ...QUANTUM_ATOM_3D_CHECKBOX_OPTIONS,
      accessibleName: strings.showNodesStringProperty,
    });

    const separator = () => new HSeparator({ stroke: QuantumAtom3DColors.panelBorderColorProperty });
    const presetButtons = ORBITAL_PRESETS.map((preset) => {
      const name = strings.presets[`${preset.key}StringProperty`];
      return new RectangularPushButton({
        ...FLAT_PANEL_PUSH_BUTTON_OPTIONS,
        content: new RichText(name, { font: LABEL_FONT, fill: LIGHT_SURFACE_TEXT_FILL }),
        accessibleName: name,
        listener: () => {
          model.quantumNumbers.set(preset.n, preset.l, preset.m);
          model.basisProperty.value = preset.basis;
        },
      });
    });

    const content = new VBox({
      spacing: SECTION_SPACING,
      align: "left",
      children: [
        text(strings.quantumNumbersStringProperty, TITLE_FONT),
        quantumNumberControl,
        separator(),
        text(strings.basisStringProperty, TITLE_FONT),
        basisRadioButtons,
        separator(),
        new HBox({ spacing: SECTION_SPACING, align: "bottom", children: [nuclearChargeControl, ionLabel] }),
        separator(),
        new HBox({
          spacing: SECTION_SPACING,
          children: [text(strings.zoomStringProperty), zoomButtons],
        }),
        new HBox({
          spacing: 10,
          children: [
            nodesCheckbox,
            new Checkbox(model.nodes3DVisibleProperty, text(strings.volume.nodesStringProperty), {
              ...QUANTUM_ATOM_3D_CHECKBOX_OPTIONS,
              accessibleName: strings.volume.nodesStringProperty,
            }),
          ],
        }),
        text(strings.presets.titleStringProperty, TITLE_FONT),
        new HBox({ spacing: 6, children: presetButtons.slice(0, 3) }),
        new HBox({ spacing: 6, children: presetButtons.slice(3) }),
      ],
    });

    super(content);
    this.ionSymbolProperty = ionSymbolProperty;
  }

  public override dispose(): void {
    this.ionSymbolProperty.dispose();
    super.dispose();
  }
}
