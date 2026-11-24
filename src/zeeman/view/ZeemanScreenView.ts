import { DerivedProperty, type TReadOnlyProperty } from "scenerystack/axon";
import { toFixed } from "scenerystack/dot";
import { HBox, Line, Node, RichText, VBox } from "scenerystack/scenery";
import { ArrowNode, PhetFont, ResetAllButton, TimeControlNode } from "scenerystack/scenery-phet";
import type { ScreenViewOptions } from "scenerystack/sim";
import { AquaRadioButtonGroup, HSlider } from "scenerystack/sun";
import { atomicFieldToTesla, atomicTimeToFs, hartreeToEv } from "../../common/model/AtomicUnits.js";
import { distinctPhotonEnergies } from "../../common/model/angular/ZeemanLevels.js";
import {
  FLAT_PLAY_PAUSE_STEP_BUTTON_OPTIONS,
  FLAT_RESET_ALL_BUTTON_OPTIONS,
} from "../../common/QuantumAtom3DButtonOptions.js";
import { QUANTUM_ATOM_3D_SLIDER_OPTIONS } from "../../common/QuantumAtom3DControlOptions.js";
import { createLeftRightSpinner } from "../../common/view/createLeftRightSpinner.js";
import { orbitCameraFrame, projectToScreen } from "../../common/view/OrbitCamera.js";
import { ResponsiveScreenView } from "../../common/view/ResponsiveScreenView.js";
import { StringManager } from "../../i18n/StringManager.js";
import QuantumAtom3DColors from "../../QuantumAtom3DColors.js";
import { ZEEMAN_SCREEN_VIEW_SETTINGS } from "../../QuantumAtom3DConstants.js";
import type { ZeemanModel } from "../model/ZeemanModel.js";
import { polarizationColor, ZeemanDiagramNode } from "./ZeemanDiagramNode.js";
import { ZeemanScreenSummaryContent } from "./ZeemanScreenSummaryContent.js";
import { ZeemanSpectrumNode } from "./ZeemanSpectrumNode.js";

/** Layout scale (px) applied to the model's unit-length precession vector. */
const PRECESSION_ARROW_SCALE = 45;

export class ZeemanScreenView extends ResponsiveScreenView {
  public constructor(model: ZeemanModel, options?: ScreenViewOptions) {
    super({ ...options, screenSummaryContent: new ZeemanScreenSummaryContent(model) });
    const strings = StringManager.getInstance().getZeemanStrings();
    const text = (
      value: string | TReadOnlyProperty<string>,
      maxWidth: number = ZEEMAN_SCREEN_VIEW_SETTINGS.DEFAULT_MAX_WIDTH,
    ) =>
      new RichText(value, {
        font: new PhetFont(ZEEMAN_SCREEN_VIEW_SETTINGS.TEXT_FONT_SIZE),
        fill: QuantumAtom3DColors.textColorProperty,
        maxWidth,
      });
    const title = text(strings.diagramStringProperty, ZEEMAN_SCREEN_VIEW_SETTINGS.DIAGRAM_TEXT_MAX_WIDTH);
    title.left = this.layoutBounds.minX + ZEEMAN_SCREEN_VIEW_SETTINGS.LEFT_OFFSET;
    title.top = this.layoutBounds.minY + ZEEMAN_SCREEN_VIEW_SETTINGS.TOP_OFFSET;
    const subtitle = text(strings.centredStringProperty, ZEEMAN_SCREEN_VIEW_SETTINGS.CENTRED_TEXT_MAX_WIDTH);
    subtitle.lineWrap = ZEEMAN_SCREEN_VIEW_SETTINGS.LINE_WRAP;
    subtitle.left = title.left;
    subtitle.top = title.bottom + 5;
    const diagram = new ZeemanDiagramNode(model);
    diagram.left = title.left + 5;
    diagram.top = this.layoutBounds.minY + 70;
    const fieldValueProperty = new DerivedProperty(
      [model.fieldProperty, model.capProperty, strings.fieldStringProperty],
      (field, cap, label) =>
        `${label}: ${atomicFieldToTesla(field).toPrecision(ZEEMAN_SCREEN_VIEW_SETTINGS.FIELD_VALUE_SIGNIFICANT_FIGURES)} T / ${atomicFieldToTesla(cap).toPrecision(ZEEMAN_SCREEN_VIEW_SETTINGS.FIELD_VALUE_SIGNIFICANT_FIGURES)} T`,
    );
    const fieldSlider = new HSlider(model.fieldFractionProperty, model.fieldFractionProperty.range, {
      ...QUANTUM_ATOM_3D_SLIDER_OPTIONS,
      accessibleName: strings.fieldStringProperty,
      accessibleHelpText: strings.capHelpStringProperty,
      keyboardStep: ZEEMAN_SCREEN_VIEW_SETTINGS.FIELD_SLIDER_KEYBOARD_STEP,
      shiftKeyboardStep: ZEEMAN_SCREEN_VIEW_SETTINGS.FIELD_SLIDER_SHIFT_KEYBOARD_STEP,
    });
    model.capProperty.link((cap) => {
      fieldSlider.pdomMapPDOMValue = (value) =>
        Number(atomicFieldToTesla(cap * value).toPrecision(ZEEMAN_SCREEN_VIEW_SETTINGS.SIGNIFICANT_FIGURES));
    });
    const fieldControl = new VBox({
      align: "left",
      spacing: ZEEMAN_SCREEN_VIEW_SETTINGS.FIELD_CONTROL_SPACING,
      children: [text(fieldValueProperty), fieldSlider],
    });
    const modes = new AquaRadioButtonGroup(
      model.modeProperty,
      (["normal", "anomalous"] as const).map((value) => ({
        value,
        createNode: () => text(strings[`${value}StringProperty`]),
        options: { accessibleName: strings[`${value}StringProperty`] },
      })),
      {
        orientation: "horizontal",
        spacing: ZEEMAN_SCREEN_VIEW_SETTINGS.MODES_SPACING,
        radioButtonOptions: { radius: ZEEMAN_SCREEN_VIEW_SETTINGS.MODES_RADIUS },
      },
    );
    const lines = new AquaRadioButtonGroup(
      model.lineProperty,
      (["halpha", "lyalpha"] as const).map((value) => ({
        value,
        createNode: () => text(value === "halpha" ? "Hα (3 → 2)" : "Lyα (2 → 1)"),
        options: { accessibleName: value === "halpha" ? "Hα (3 → 2)" : "Lyα (2 → 1)" },
      })),
      {
        orientation: "horizontal",
        spacing: ZEEMAN_SCREEN_VIEW_SETTINGS.LINES_SPACING,
        radioButtonOptions: { radius: ZEEMAN_SCREEN_VIEW_SETTINGS.LINES_RADIUS },
      },
    );
    const directions = new AquaRadioButtonGroup(
      model.directionProperty,
      (["perpendicular", "along"] as const).map((value) => ({
        value,
        createNode: () => text(strings[`${value}StringProperty`]),
        options: { accessibleName: strings[`${value}StringProperty`] },
      })),
      {
        spacing: ZEEMAN_SCREEN_VIEW_SETTINGS.DIRECTIONS_SPACING,
        radioButtonOptions: { radius: ZEEMAN_SCREEN_VIEW_SETTINGS.DIRECTIONS_RADIUS },
      },
    );
    const spinner = (
      property: typeof model.nuclearChargeProperty,
      range: TReadOnlyProperty<import("scenerystack/dot").Range>,
      name: TReadOnlyProperty<string>,
      offset = 0,
    ) => createLeftRightSpinner(property, range, name, { offset });
    const capLabel = text(strings.capStringProperty);
    capLabel.lineWrap = 335;
    model.modeProperty.link((mode) => {
      capLabel.visible = mode === "anomalous";
    });
    const controls = new VBox({
      align: "left",
      spacing: ZEEMAN_SCREEN_VIEW_SETTINGS.CONTROLS_SPACING,
      children: [
        modes,
        lines,
        new HBox({
          spacing: ZEEMAN_SCREEN_VIEW_SETTINGS.CONTROL_COLUMN_SPACING,
          children: [
            text(strings.chargeStringProperty),
            spinner(
              model.nuclearChargeProperty,
              model.nuclearChargeProperty.rangeProperty,
              strings.chargeStringProperty,
            ),
          ],
        }),
        fieldControl,
        capLabel,
        text(strings.viewStringProperty),
        directions,
        new HBox({
          spacing: ZEEMAN_SCREEN_VIEW_SETTINGS.CONTROL_COLUMN_SPACING,
          children: [
            text(strings.selectedStringProperty),
            spinner(model.selectedIndexProperty, model.selectedRangeProperty, strings.selectedStringProperty, 1),
          ],
        }),
      ],
      left: this.layoutBounds.maxX - ZEEMAN_SCREEN_VIEW_SETTINGS.CONTROLS_LEFT_OFFSET,
      top: this.layoutBounds.minY + ZEEMAN_SCREEN_VIEW_SETTINGS.CONTROLS_TOP_OFFSET,
    });
    const selectedProperty = new DerivedProperty(
      [model.upperLevelsProperty, model.selectedIndexProperty, model.modeProperty],
      (levels, index, mode) => {
        const level = levels[index];
        return level
          ? `n=${level.n}, l=${level.l}${mode === "anomalous" ? `, j=${level.j}` : ""}, m=${level.m}<br>g=${toFixed(level.g, ZEEMAN_SCREEN_VIEW_SETTINGS.SELECTED_DECIMAL_PLACES)}, E=${toFixed(hartreeToEv(level.energy), ZEEMAN_SCREEN_VIEW_SETTINGS.ENERGY_DECIMAL_PLACES)} eV`
          : "";
      },
    );
    const selectedLabel = text(selectedProperty);
    selectedLabel.left = controls.left;
    selectedLabel.top = this.layoutBounds.minY + 370;
    const spectrumTitle = text(
      new DerivedProperty(
        [model.transitionsProperty, strings.spectrumStringProperty],
        (transitions, label) => `${label}: ${distinctPhotonEnergies(transitions).length}`,
      ),
      ZEEMAN_SCREEN_VIEW_SETTINGS.SPECTRUM_TITLE_MAX_WIDTH,
    );
    spectrumTitle.left = title.left;
    spectrumTitle.top = this.layoutBounds.minY + 465;
    const spectrum = new ZeemanSpectrumNode(500, model);
    spectrum.left = title.left + 20;
    spectrum.top = spectrumTitle.bottom + 8;
    const legend = new HBox({
      spacing: ZEEMAN_SCREEN_VIEW_SETTINGS.LEGEND_SPACING,
      children: (["pi", "sigmaPlus", "sigmaMinus"] as const).map(
        (value, index) =>
          new RichText(["π (Δm=0)", "σ⁺ (Δm=+1)", "σ⁻ (Δm=−1)"][index] ?? "", {
            font: new PhetFont(ZEEMAN_SCREEN_VIEW_SETTINGS.LEGEND_FONT_SIZE),
            fill: polarizationColor(value),
          }),
      ),
    });
    legend.left = title.left;
    legend.top = spectrum.bottom + 6;
    const periodProperty = new DerivedProperty(
      [model.larmorStatusProperty, strings.periodStringProperty, strings.offStringProperty],
      (status, label, off) => {
        if (status.kind === "off") {
          return off;
        }
        if (status.kind === "zeroQ") {
          return `${label}: — (L=0)`;
        }
        return `${label}: ${atomicTimeToFs(status.period).toPrecision(ZEEMAN_SCREEN_VIEW_SETTINGS.PERIOD_SIGNIFICANT_FIGURES)} fs`;
      },
    );
    const periodLabel = text(periodProperty, ZEEMAN_SCREEN_VIEW_SETTINGS.PERIOD_LABEL_MAX_WIDTH);
    periodLabel.left = controls.left;
    periodLabel.top = this.layoutBounds.minY + 435;
    const axis = new Line(0, ZEEMAN_SCREEN_VIEW_SETTINGS.AXIS_START_Y, 0, ZEEMAN_SCREEN_VIEW_SETTINGS.AXIS_END_Y, {
      stroke: QuantumAtom3DColors.textColorProperty,
    });
    const arrow = new ArrowNode(
      0,
      0,
      ZEEMAN_SCREEN_VIEW_SETTINGS.ARROW_END_X,
      ZEEMAN_SCREEN_VIEW_SETTINGS.ARROW_END_Y,
      {
        fill: QuantumAtom3DColors.radialCurveColorProperty,
        stroke: null,
        tailWidth: ZEEMAN_SCREEN_VIEW_SETTINGS.ARROW_TAIL_WIDTH,
        headWidth: ZEEMAN_SCREEN_VIEW_SETTINGS.ARROW_HEAD_WIDTH,
        headHeight: ZEEMAN_SCREEN_VIEW_SETTINGS.ARROW_HEAD_HEIGHT,
      },
    );
    const precession = new Node({
      children: [axis, arrow],
      x: controls.left + ZEEMAN_SCREEN_VIEW_SETTINGS.PRECESSION_X_OFFSET,
      y: this.layoutBounds.minY + ZEEMAN_SCREEN_VIEW_SETTINGS.PRECESSION_Y_OFFSET,
    });
    const update = () => {
      const vector = model.precessionVectorProperty.value;
      arrow.visible = vector !== null;
      if (!vector) {
        return;
      }
      const [x, y] = projectToScreen(orbitCameraFrame(0.3, 0.2), vector);
      const scale = PRECESSION_ARROW_SCALE * model.precessionScaleProperty.value;
      arrow.setTailAndTip(0, 0, x * scale, -y * scale);
    };
    model.precessionVectorProperty.link(update);
    const playback = new TimeControlNode(model.timer.isPlayingProperty, {
      playPauseStepButtonOptions: {
        ...FLAT_PLAY_PAUSE_STEP_BUTTON_OPTIONS,
        stepForwardButtonOptions: {
          ...FLAT_PLAY_PAUSE_STEP_BUTTON_OPTIONS.stepForwardButtonOptions,
          listener: () => model.advancePhase(),
        },
      },
    });
    playback.left = controls.left + 145;
    playback.centerY = precession.y;
    const note = text(strings.noteStringProperty, ZEEMAN_SCREEN_VIEW_SETTINGS.NOTE_TEXT_MAX_WIDTH);
    note.left = title.left;
    note.bottom = this.layoutBounds.maxY - ZEEMAN_SCREEN_VIEW_SETTINGS.BOTTOM_OFFSET;
    const reset = new ResetAllButton({
      ...FLAT_RESET_ALL_BUTTON_OPTIONS,
      listener: () => {
        model.reset();
      },
      right: this.layoutBounds.maxX - ZEEMAN_SCREEN_VIEW_SETTINGS.RESET_RIGHT_OFFSET,
      bottom: this.layoutBounds.maxY - ZEEMAN_SCREEN_VIEW_SETTINGS.RESET_BOTTOM_OFFSET,
    });
    const content = new Node({
      children: [
        title,
        subtitle,
        diagram,
        controls,
        selectedLabel,
        spectrumTitle,
        spectrum,
        legend,
        periodLabel,
        precession,
        playback,
        note,
        reset,
      ],
    });
    this.addChild(content);
    this.pdomControlAreaNode.pdomOrder = [controls, playback, reset];
    this.setResponsiveContent(content, [
      [title, subtitle, diagram],
      [controls, selectedLabel],
      [spectrumTitle, spectrum, legend],
      [periodLabel],
      [precession, playback],
      [note],
      [reset],
    ]);
  }
}
