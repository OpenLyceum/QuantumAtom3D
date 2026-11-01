/** Phase/density choice and its shared legend, used by both the 3D cloud and slice. */
import type { TReadOnlyProperty } from "scenerystack/axon";
import { HBox, RichText } from "scenerystack/scenery";
import { PhetFont } from "scenerystack/scenery-phet";
import { VerticalAquaRadioButtonGroup } from "scenerystack/sun";
import { ColormapLegendNode } from "../../common/view/ColormapLegendNode.js";
import { StringManager } from "../../i18n/StringManager.js";
import QuantumAtom3DColors from "../../QuantumAtom3DColors.js";
import type { PhaseColormap } from "../../QuantumAtom3DConstants.js";
import type { OrbitalsModel, SliceColoring } from "../model/OrbitalsModel.js";

export class OrbitalColorControl extends HBox {
  public constructor(model: OrbitalsModel, phaseColormapProperty: TReadOnlyProperty<PhaseColormap>) {
    const strings = StringManager.getInstance().getOrbitalStrings().slice;
    const a11y = StringManager.getInstance().getOrbitalsA11yStrings().controls;
    const label = (property: TReadOnlyProperty<string>) =>
      new RichText(property, {
        font: new PhetFont(13),
        fill: QuantumAtom3DColors.textColorProperty,
        maxWidth: 150,
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
        spacing: 8,
        radioButtonOptions: { radius: 7 },
        accessibleName: a11y.coloringStringProperty,
      },
    );

    const legend = new ColormapLegendNode({
      coloringProperty: model.sliceColoringProperty,
      phaseColormapProperty,
      phaseCaptionProperty: strings.phaseLegendStringProperty,
      densityCaptionProperty: strings.densityLegendStringProperty,
    });

    super({ spacing: 24, align: "center", children: [coloringRadioButtons, legend] });
  }
}
