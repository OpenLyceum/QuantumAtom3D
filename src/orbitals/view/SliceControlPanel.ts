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
import { AquaRadioButtonGroup, HSlider, VerticalAquaRadioButtonGroup } from "scenerystack/sun";
import { SLICE_PLANE_VALUES, type SlicePlane } from "../../common/model/orbital/SliceSampler.js";
import { QUANTUM_ATOM_3D_SLIDER_OPTIONS } from "../../common/QuantumAtom3DControlOptions.js";
import { QuantumAtom3DPanel } from "../../common/QuantumAtom3DPanel.js";
import { ColormapLegendNode } from "../../common/view/ColormapLegendNode.js";
import { StringManager } from "../../i18n/StringManager.js";
import QuantumAtom3DColors from "../../QuantumAtom3DColors.js";
import type { PhaseColormap } from "../../QuantumAtom3DConstants.js";
import type { OrbitalsModel, SliceColoring } from "../model/OrbitalsModel.js";

const LABEL_FONT = new PhetFont(13);
const PLANE_FONT = new PhetFont({ size: 14, style: "italic" });
const ROW_SPACING = 8;
const ITEM_SPACING = 12;
const RADIO_RADIUS = 7;

/** Slider keyboard steps, as fractions of the view half-width. */
const OFFSET_KEYBOARD_STEP = 0.05;
const OFFSET_SHIFT_KEYBOARD_STEP = 0.01;

export class SliceControlPanel extends QuantumAtom3DPanel {
  public constructor(model: OrbitalsModel, phaseColormapProperty: TReadOnlyProperty<PhaseColormap>) {
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

    const coloringRadioButtons = new VerticalAquaRadioButtonGroup<SliceColoring>(
      model.sliceColoringProperty,
      [
        {
          value: "phase",
          createNode: () => label(strings.phaseStringProperty),
          options: { accessibleName: strings.phaseStringProperty },
        },
        {
          value: "density",
          createNode: () => label(strings.densityStringProperty),
          options: { accessibleName: strings.densityStringProperty },
        },
      ],
      {
        spacing: ROW_SPACING,
        radioButtonOptions: { radius: RADIO_RADIUS },
        accessibleName: a11y.coloringStringProperty,
      },
    );

    const legend = new ColormapLegendNode({
      coloringProperty: model.sliceColoringProperty,
      phaseColormapProperty,
      phaseCaptionProperty: strings.phaseLegendStringProperty,
      densityCaptionProperty: strings.densityLegendStringProperty,
    });

    const content = new VBox({
      spacing: ROW_SPACING,
      align: "left",
      children: [
        new HBox({ spacing: ITEM_SPACING, children: [label(strings.planeStringProperty), planeRadioButtons] }),
        new HBox({ spacing: ITEM_SPACING, children: [label(strings.offsetStringProperty), offsetSlider] }),
        new HBox({ spacing: 2 * ITEM_SPACING, align: "center", children: [coloringRadioButtons, legend] }),
      ],
    });

    super(content);
  }
}
