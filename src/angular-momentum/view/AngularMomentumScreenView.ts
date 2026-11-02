import { DerivedProperty, type NumberProperty, type TReadOnlyProperty } from "scenerystack/axon";
import type { Range } from "scenerystack/dot";
import { HBox, Node, RichText, VBox } from "scenerystack/scenery";
import { PhetFont, ResetAllButton, TimeControlNode } from "scenerystack/scenery-phet";
import type { ScreenViewOptions } from "scenerystack/sim";
import { AquaRadioButtonGroup, Checkbox, HSlider, NumberSpinner } from "scenerystack/sun";
import { angularMagnitude, orbitalUncertaintyProduct } from "../../common/model/angular/VectorModel.js";
import {
  FLAT_PLAY_PAUSE_STEP_BUTTON_OPTIONS,
  FLAT_RECTANGULAR_BUTTON_OPTIONS,
  FLAT_RESET_ALL_BUTTON_OPTIONS,
} from "../../common/QuantumAtom3DButtonOptions.js";
import {
  QUANTUM_ATOM_3D_CHECKBOX_OPTIONS,
  QUANTUM_ATOM_3D_SLIDER_OPTIONS,
} from "../../common/QuantumAtom3DControlOptions.js";
import { ResponsiveScreenView } from "../../common/view/ResponsiveScreenView.js";
import { StringManager } from "../../i18n/StringManager.js";
import QuantumAtom3DColors from "../../QuantumAtom3DColors.js";
import type { AngularMomentumModel } from "../model/AngularMomentumModel.js";
import { AngularDensityNode } from "./AngularDensityNode.js";
import { AngularMomentumDiagramNode } from "./AngularMomentumDiagramNode.js";
import { AngularMomentumScreenSummaryContent } from "./AngularMomentumScreenSummaryContent.js";
export type AngularMomentumScreenViewOptions = ScreenViewOptions;
export class AngularMomentumScreenView extends ResponsiveScreenView {
  public constructor(model: AngularMomentumModel, options?: ScreenViewOptions) {
    super({ ...options, screenSummaryContent: new AngularMomentumScreenSummaryContent(model) });
    const strings = StringManager.getInstance().getAngularStrings();
    const label = (value: string | TReadOnlyProperty<string>, maxWidth = 420) =>
      new RichText(value, { font: new PhetFont(14), fill: QuantumAtom3DColors.textColorProperty, maxWidth });
    const spinner = (property: NumberProperty, range: TReadOnlyProperty<Range>, name: TReadOnlyProperty<string>) =>
      new NumberSpinner(property, range, {
        arrowsPosition: "leftRight",
        arrowButtonOptions: FLAT_RECTANGULAR_BUTTON_OPTIONS,
        numberDisplayOptions: {
          textOptions: { font: new PhetFont(15) },
          minBackgroundWidth: 40,
          numberFormatter: (value: number) => `${value}`,
        },
        accessibleName: name,
      });
    const diagram = new AngularMomentumDiagramNode(model);
    diagram.left = this.layoutBounds.minX + 25;
    diagram.top = this.layoutBounds.minY + 45;
    const title = label(strings.titleStringProperty);
    title.left = diagram.left;
    title.bottom = diagram.top - 10;
    const readouts = new DerivedProperty(
      [model.lProperty, model.mProperty, model.spinProperty, model.jProperty, model.mjProperty],
      (l, m, spin, j, mj) =>
        spin
          ? `|L| = ${angularMagnitude(l).toFixed(3)} ℏ, |S| = ${Math.sqrt(0.75).toFixed(3)} ℏ<br>|J| = ${angularMagnitude(j).toFixed(3)} ℏ, J<sub>z</sub> = ${mj} ℏ`
          : `|L| = ${angularMagnitude(l).toFixed(3)} ℏ, L<sub>z</sub> = ${m} ℏ<br>ΔL<sub>x</sub> ΔL<sub>y</sub> = ${orbitalUncertaintyProduct(l, m).toFixed(2)} ℏ² ≥ ${Math.abs(m) / 2} ℏ²`,
    );
    const readout = label(readouts);
    readout.left = diagram.left;
    readout.top = diagram.bottom + 15;
    const mControl = new HBox({
      spacing: 15,
      children: [
        label(strings.mStringProperty),
        spinner(model.mProperty, model.mRangeProperty, strings.mStringProperty),
      ],
    });
    const jControl = new AquaRadioButtonGroup(
      model.branchProperty,
      (["upper", "lower"] as const).map((value) => ({
        value,
        createNode: () => label(value === "upper" ? strings.upperStringProperty : strings.lowerStringProperty),
        options: { accessibleName: value === "upper" ? strings.upperStringProperty : strings.lowerStringProperty },
      })),
      { orientation: "horizontal", spacing: 15, radioButtonOptions: { radius: 7 } },
    );
    const mjControl = new HBox({
      spacing: 15,
      children: [
        label(strings.mjStringProperty),
        spinner(model.mjProperty, model.mjRangeProperty, strings.mjStringProperty),
      ],
    });
    model.spinProperty.link((spin) => {
      mControl.visible = !spin;
      jControl.visible = spin;
      mjControl.visible = spin;
    });
    const jReadout = label(new DerivedProperty([model.jProperty], (j) => `j = ${j}`));
    model.spinProperty.link((spin) => {
      jReadout.visible = spin;
    });
    const controls = new VBox({
      align: "left",
      spacing: 15,
      children: [
        new HBox({
          spacing: 15,
          children: [
            label(strings.lStringProperty),
            spinner(model.lProperty, model.lProperty.rangeProperty, strings.lStringProperty),
          ],
        }),
        mControl,
        new Checkbox(model.spinProperty, label(strings.spinStringProperty), {
          ...QUANTUM_ATOM_3D_CHECKBOX_OPTIONS,
          accessibleName: strings.spinStringProperty,
        }),
        jControl,
        jReadout,
        mjControl,
      ],
      left: diagram.right + 55,
      top: diagram.top,
    });
    const phase = new HBox({
      spacing: 20,
      children: [
        new TimeControlNode(model.timer.isPlayingProperty, {
          playPauseStepButtonOptions: {
            ...FLAT_PLAY_PAUSE_STEP_BUTTON_OPTIONS,
            stepForwardButtonOptions: {
              ...FLAT_PLAY_PAUSE_STEP_BUTTON_OPTIONS.stepForwardButtonOptions,
              listener: () => {
                model.phaseProperty.value = (model.phaseProperty.value + 0.05) % (2 * Math.PI);
              },
            },
          },
        }),
        label(strings.phaseStringProperty),
        new HSlider(model.phaseProperty, model.phaseProperty.range, {
          ...QUANTUM_ATOM_3D_SLIDER_OPTIONS,
          accessibleName: strings.phaseStringProperty,
          keyboardStep: Math.PI / 36,
          shiftKeyboardStep: Math.PI / 180,
        }),
      ],
      left: diagram.left,
      top: readout.bottom + 20,
    });
    const density = new AngularDensityNode(model);
    density.left = controls.left + 15;
    density.top = this.layoutBounds.minY + 315;
    const densityTitle = label(strings.densityStringProperty, 420);
    densityTitle.left = controls.left;
    densityTitle.bottom = density.top - 10;
    const densityHelp = label(strings.densityHelpStringProperty, 430);
    densityHelp.left = controls.left;
    densityHelp.top = density.bottom + 8;
    const note = label(strings.noteStringProperty, 930);
    note.left = diagram.left;
    note.bottom = this.layoutBounds.maxY - 20;
    const reset = new ResetAllButton({
      ...FLAT_RESET_ALL_BUTTON_OPTIONS,
      listener: () => {
        model.reset();
      },
      right: this.layoutBounds.maxX - 20,
      bottom: this.layoutBounds.maxY - 20,
    });
    const content = new Node({
      children: [diagram, title, readout, controls, phase, density, densityTitle, densityHelp, note, reset],
    });
    this.addChild(content);
    this.pdomControlAreaNode.pdomOrder = [controls, phase, reset];
    this.setResponsiveContent(content, [
      [title, diagram],
      [readout],
      [controls],
      [phase],
      [densityTitle, density, densityHelp],
      [note],
      [reset],
    ]);
  }
}
