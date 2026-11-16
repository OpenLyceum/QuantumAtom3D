import { SLICE_CONTROL_PANEL_SETTINGS } from "../../QuantumAtom3DConstants.js";
/**
 * SliceControlPanel.ts
 *
 * Controls for the cross-section: the plane (xy, xz or yz), its offset along
 * the normal (a slider, the keyboard-accessible way to move it), the colouring
 * (phase or density), and the matching colour legend.
 */

import type { TReadOnlyProperty } from "scenerystack/axon";
import { HBox, RichText, Text, VBox } from "scenerystack/scenery";
import { PhetFont } from "scenerystack/scenery-phet";
import { AquaRadioButtonGroup, Checkbox, HSlider } from "scenerystack/sun";
import type { OrbitalsModel } from "../../common/model/orbital/OrbitalsModel.js";
import { SLICE_PLANE_VALUES, type SlicePlane } from "../../common/model/orbital/SliceSampler.js";
import {
  QUANTUM_ATOM_3D_CHECKBOX_OPTIONS,
  QUANTUM_ATOM_3D_SLIDER_OPTIONS,
} from "../../common/QuantumAtom3DControlOptions.js";
import { QuantumAtom3DPanel } from "../../common/QuantumAtom3DPanel.js";
import { StringManager } from "../../i18n/StringManager.js";
import QuantumAtom3DColors from "../../QuantumAtom3DColors.js";

const LABEL_FONT = new PhetFont(SLICE_CONTROL_PANEL_SETTINGS.LABEL_FONT_SIZE);
const PLANE_FONT = new PhetFont({ size: SLICE_CONTROL_PANEL_SETTINGS.PLANE_FONT_SIZE, style: "italic" });
const ROW_SPACING: number = SLICE_CONTROL_PANEL_SETTINGS.ROW_SPACING;
const ITEM_SPACING: number = SLICE_CONTROL_PANEL_SETTINGS.ITEM_SPACING;
const RADIO_RADIUS: number = SLICE_CONTROL_PANEL_SETTINGS.RADIO_RADIUS;

/** Slider keyboard steps, as fractions of the view half-width. */
const OFFSET_KEYBOARD_STEP: number = SLICE_CONTROL_PANEL_SETTINGS.OFFSET_KEYBOARD_STEP;
const OFFSET_SHIFT_KEYBOARD_STEP: number = SLICE_CONTROL_PANEL_SETTINGS.OFFSET_SHIFT_KEYBOARD_STEP;

export class SliceControlPanel extends QuantumAtom3DPanel {
  public constructor(model: OrbitalsModel) {
    const strings = StringManager.getInstance().getOrbitalStrings().slice;
    const a11y = StringManager.getInstance().getOrbitalsA11yStrings().controls;
    const label = (property: TReadOnlyProperty<string>) =>
      new RichText(property, { font: LABEL_FONT, fill: QuantumAtom3DColors.textColorProperty });

    const planeRadioButtons = new AquaRadioButtonGroup<SlicePlane>(
      model.slicePlaneProperty,
      SLICE_PLANE_VALUES.map((plane) => ({
        value: plane,
        createNode: () => new Text(plane, { font: PLANE_FONT, fill: QuantumAtom3DColors.textColorProperty }),
        options: { accessibleName: plane },
      })),
      {
        orientation: "horizontal",
        spacing: ITEM_SPACING,
        radioButtonOptions: { radius: RADIO_RADIUS },
        accessibleName: a11y.planeStringProperty,
      },
    );

    const offsetSlider = new HSlider(model.sliceOffsetFractionProperty, model.sliceOffsetFractionProperty.range, {
      ...QUANTUM_ATOM_3D_SLIDER_OPTIONS,
      keyboardStep: OFFSET_KEYBOARD_STEP,
      shiftKeyboardStep: OFFSET_SHIFT_KEYBOARD_STEP,
      accessibleName: strings.offsetStringProperty,
      accessibleHelpText: a11y.offsetHelpStringProperty,
    });

    const content = new VBox({
      spacing: ROW_SPACING,
      align: "left",
      children: [
        new Checkbox(model.cuttingPlaneVisibleProperty, label(strings.showPlaneStringProperty), {
          ...QUANTUM_ATOM_3D_CHECKBOX_OPTIONS,
          accessibleName: strings.showPlaneStringProperty,
          accessibleHelpText: strings.planeHelpStringProperty,
        }),
        new HBox({ spacing: ITEM_SPACING, children: [label(strings.planeStringProperty), planeRadioButtons] }),
        new HBox({ spacing: ITEM_SPACING, children: [label(strings.offsetStringProperty), offsetSlider] }),
      ],
    });

    super(content);
  }
}
