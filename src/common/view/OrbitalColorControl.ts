/** Phase/density choice and its shared legend, used by both the 3D cloud and slice. */
import type { TReadOnlyProperty } from "scenerystack/axon";
import { HBox, RichText } from "scenerystack/scenery";
import { PhetFont } from "scenerystack/scenery-phet";
import { VerticalAquaRadioButtonGroup } from "scenerystack/sun";
import { StringManager } from "../../i18n/StringManager.js";
import QuantumAtom3DColors from "../../QuantumAtom3DColors.js";
import type { PhaseColormap } from "../../QuantumAtom3DConstants.js";
import { ORBITAL_COLOR_CONTROL_SETTINGS } from "../../QuantumAtom3DConstants.js";
import type { OrbitalsModel, SliceColoring } from "../model/orbital/OrbitalsModel.js";
import { ColormapLegendNode } from "./ColormapLegendNode.js";

export class OrbitalColorControl extends HBox {
  public constructor(
    model: Pick<OrbitalsModel, "sliceColoringProperty">,
    phaseColormapProperty: TReadOnlyProperty<PhaseColormap>,
  ) {
    const strings = StringManager.getInstance().getOrbitalStrings().slice;
    const a11y = StringManager.getInstance().getOrbitalsA11yStrings().controls;
    const label = (property: TReadOnlyProperty<string>) =>
      new RichText(property, {
        font: new PhetFont(ORBITAL_COLOR_CONTROL_SETTINGS.LABEL_FONT_SIZE),
        fill: QuantumAtom3DColors.textColorProperty,
        maxWidth: ORBITAL_COLOR_CONTROL_SETTINGS.LABEL_MAX_WIDTH,
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
        spacing: ORBITAL_COLOR_CONTROL_SETTINGS.COLORING_RADIO_BUTTONS_SPACING,
        radioButtonOptions: { radius: ORBITAL_COLOR_CONTROL_SETTINGS.COLORING_RADIO_BUTTONS_RADIUS },
        accessibleName: a11y.coloringStringProperty,
      },
    );

    const legend = new ColormapLegendNode({
      coloringProperty: model.sliceColoringProperty,
      phaseColormapProperty,
      phaseCaptionProperty: strings.phaseLegendStringProperty,
      densityCaptionProperty: strings.densityLegendStringProperty,
    });

    super({
      spacing: ORBITAL_COLOR_CONTROL_SETTINGS.CONSTRUCTOR_SPACING,
      align: "center",
      children: [coloringRadioButtons, legend],
    });
  }
}
