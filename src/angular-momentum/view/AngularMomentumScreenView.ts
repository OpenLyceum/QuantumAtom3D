import { DerivedProperty, type NumberProperty, type TReadOnlyProperty } from "scenerystack/axon";
import type { Range } from "scenerystack/dot";
import { toFixed } from "scenerystack/dot";
import { HBox, Node, RichText, VBox } from "scenerystack/scenery";
import { PhetFont, ResetAllButton, TimeControlNode } from "scenerystack/scenery-phet";
import type { ScreenViewOptions } from "scenerystack/sim";
import { AquaRadioButtonGroup, Checkbox, HSlider } from "scenerystack/sun";
import { angularMagnitude, orbitalUncertaintyProduct } from "../../common/model/angular/VectorModel.js";
import {
  FLAT_PLAY_PAUSE_STEP_BUTTON_OPTIONS,
  FLAT_RESET_ALL_BUTTON_OPTIONS,
} from "../../common/QuantumAtom3DButtonOptions.js";
import {
  QUANTUM_ATOM_3D_CHECKBOX_OPTIONS,
  QUANTUM_ATOM_3D_SLIDER_OPTIONS,
} from "../../common/QuantumAtom3DControlOptions.js";
import { createLeftRightSpinner } from "../../common/view/createLeftRightSpinner.js";
import { ResponsiveScreenView } from "../../common/view/ResponsiveScreenView.js";
import { StringManager } from "../../i18n/StringManager.js";
import QuantumAtom3DColors from "../../QuantumAtom3DColors.js";
import { ANGULAR_MOMENTUM_SCREEN_VIEW_SETTINGS } from "../../QuantumAtom3DConstants.js";
import type { AngularMomentumModel } from "../model/AngularMomentumModel.js";
import { AngularDensityNode } from "./AngularDensityNode.js";
import { AngularMomentumDiagramNode } from "./AngularMomentumDiagramNode.js";
import { AngularMomentumScreenSummaryContent } from "./AngularMomentumScreenSummaryContent.js";
export class AngularMomentumScreenView extends ResponsiveScreenView {
  public constructor(model: AngularMomentumModel, options?: ScreenViewOptions) {
    super({ ...options, screenSummaryContent: new AngularMomentumScreenSummaryContent(model) });
    const strings = StringManager.getInstance().getAngularStrings();
    const label = (
      value: string | TReadOnlyProperty<string>,
      maxWidth: number = ANGULAR_MOMENTUM_SCREEN_VIEW_SETTINGS.DEFAULT_MAX_WIDTH,
    ) =>
      new RichText(value, {
        font: new PhetFont(ANGULAR_MOMENTUM_SCREEN_VIEW_SETTINGS.LABEL_FONT_SIZE),
        fill: QuantumAtom3DColors.textColorProperty,
        maxWidth,
      });
    const spinner = (property: NumberProperty, range: TReadOnlyProperty<Range>, name: TReadOnlyProperty<string>) =>
      createLeftRightSpinner(property, range, name, {
        fontSize: ANGULAR_MOMENTUM_SCREEN_VIEW_SETTINGS.SPINNER_FONT_SIZE,
      });
    const diagram = new AngularMomentumDiagramNode(model);
    diagram.left = this.layoutBounds.minX + ANGULAR_MOMENTUM_SCREEN_VIEW_SETTINGS.DIAGRAM_LEFT_INSET;
    diagram.top = this.layoutBounds.minY + ANGULAR_MOMENTUM_SCREEN_VIEW_SETTINGS.DIAGRAM_TOP_INSET;
    const title = label(strings.titleStringProperty);
    title.left = diagram.left;
    title.bottom = diagram.top - ANGULAR_MOMENTUM_SCREEN_VIEW_SETTINGS.TITLE_GAP;
    const readouts = new DerivedProperty(
      [model.lProperty, model.mProperty, model.spinProperty, model.jProperty, model.mjProperty],
      (l, m, spin, j, mj) =>
        spin
          ? `|L| = ${toFixed(angularMagnitude(l), ANGULAR_MOMENTUM_SCREEN_VIEW_SETTINGS.READOUTS_DECIMAL_PLACES)} ℏ, |S| = ${toFixed(Math.sqrt(0.75), ANGULAR_MOMENTUM_SCREEN_VIEW_SETTINGS.READOUTS_DECIMAL_PLACES)} ℏ<br>|J| = ${toFixed(angularMagnitude(j), ANGULAR_MOMENTUM_SCREEN_VIEW_SETTINGS.READOUTS_DECIMAL_PLACES)} ℏ, J<sub>z</sub> = ${mj} ℏ`
          : `|L| = ${toFixed(angularMagnitude(l), ANGULAR_MOMENTUM_SCREEN_VIEW_SETTINGS.READOUTS_DECIMAL_PLACES)} ℏ, L<sub>z</sub> = ${m} ℏ<br>ΔL<sub>x</sub> ΔL<sub>y</sub> = ${toFixed(orbitalUncertaintyProduct(l, m), ANGULAR_MOMENTUM_SCREEN_VIEW_SETTINGS.READOUTS_DECIMAL_PLACES_SEGMENT_2)} ℏ² ≥ ${Math.abs(m) / 2} ℏ²`,
    );
    const readout = label(readouts);
    readout.left = diagram.left;
    readout.top = diagram.bottom + ANGULAR_MOMENTUM_SCREEN_VIEW_SETTINGS.TOP_OFFSET;
    const mControl = new HBox({
      spacing: ANGULAR_MOMENTUM_SCREEN_VIEW_SETTINGS.M_CONTROL_SPACING,
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
      {
        orientation: "horizontal",
        spacing: ANGULAR_MOMENTUM_SCREEN_VIEW_SETTINGS.J_CONTROL_SPACING,
        radioButtonOptions: { radius: ANGULAR_MOMENTUM_SCREEN_VIEW_SETTINGS.J_CONTROL_RADIUS },
      },
    );
    const mjControl = new HBox({
      spacing: ANGULAR_MOMENTUM_SCREEN_VIEW_SETTINGS.MJ_CONTROL_SPACING,
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
      spacing: ANGULAR_MOMENTUM_SCREEN_VIEW_SETTINGS.CONTROLS_SPACING,
      children: [
        new HBox({
          spacing: ANGULAR_MOMENTUM_SCREEN_VIEW_SETTINGS.CONTROLS_SPACING,
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
      left: diagram.right + ANGULAR_MOMENTUM_SCREEN_VIEW_SETTINGS.CONTROLS_LEFT_OFFSET,
      top: diagram.top,
    });
    const phase = new HBox({
      spacing: ANGULAR_MOMENTUM_SCREEN_VIEW_SETTINGS.PHASE_SPACING,
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
      top: readout.bottom + ANGULAR_MOMENTUM_SCREEN_VIEW_SETTINGS.PHASE_TOP_OFFSET,
    });
    const density = new AngularDensityNode(model);
    density.left = controls.left + ANGULAR_MOMENTUM_SCREEN_VIEW_SETTINGS.LEFT_OFFSET;
    density.top = this.layoutBounds.minY + 315;
    const densityTitle = label(
      strings.densityStringProperty,
      ANGULAR_MOMENTUM_SCREEN_VIEW_SETTINGS.DENSITY_LABEL_MAX_WIDTH,
    );
    densityTitle.left = controls.left;
    densityTitle.bottom = density.top - ANGULAR_MOMENTUM_SCREEN_VIEW_SETTINGS.TITLE_GAP;
    const densityHelp = label(
      strings.densityHelpStringProperty,
      ANGULAR_MOMENTUM_SCREEN_VIEW_SETTINGS.DENSITY_HELP_LABEL_MAX_WIDTH,
    );
    densityHelp.left = controls.left;
    densityHelp.top = density.bottom + 8;
    const note = label(strings.noteStringProperty, ANGULAR_MOMENTUM_SCREEN_VIEW_SETTINGS.NOTE_LABEL_MAX_WIDTH);
    note.left = diagram.left;
    note.bottom = this.layoutBounds.maxY - ANGULAR_MOMENTUM_SCREEN_VIEW_SETTINGS.BOTTOM_OFFSET;
    const reset = new ResetAllButton({
      ...FLAT_RESET_ALL_BUTTON_OPTIONS,
      listener: () => {
        model.reset();
      },
      right: this.layoutBounds.maxX - ANGULAR_MOMENTUM_SCREEN_VIEW_SETTINGS.RESET_RIGHT_OFFSET,
      bottom: this.layoutBounds.maxY - ANGULAR_MOMENTUM_SCREEN_VIEW_SETTINGS.RESET_BOTTOM_OFFSET,
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
