import { DerivedProperty, type TReadOnlyProperty } from "scenerystack/axon";
import { HBox, Line, Node, RichText, VBox } from "scenerystack/scenery";
import { ArrowNode, PhetFont, ResetAllButton, TimeControlNode } from "scenerystack/scenery-phet";
import type { ScreenViewOptions } from "scenerystack/sim";
import { AquaRadioButtonGroup, HSlider } from "scenerystack/sun";
import { atomicFieldToTesla, atomicTimeToFs, hartreeToEv } from "../../common/model/AtomicUnits.js";
import { orbitalVector } from "../../common/model/angular/VectorModel.js";
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
import type { ZeemanModel } from "../model/ZeemanModel.js";
import { polarizationColor, ZeemanDiagramNode } from "./ZeemanDiagramNode.js";
import { ZeemanScreenSummaryContent } from "./ZeemanScreenSummaryContent.js";
import { ZeemanSpectrumNode } from "./ZeemanSpectrumNode.js";
export class ZeemanScreenView extends ResponsiveScreenView {
  public constructor(model: ZeemanModel, options?: ScreenViewOptions) {
    super({ ...options, screenSummaryContent: new ZeemanScreenSummaryContent(model) });
    const strings = StringManager.getInstance().getZeemanStrings();
    const text = (value: string | TReadOnlyProperty<string>, maxWidth = 335) =>
      new RichText(value, { font: new PhetFont(13), fill: QuantumAtom3DColors.textColorProperty, maxWidth });
    const title = text(strings.diagramStringProperty, 560);
    title.left = this.layoutBounds.minX + 25;
    title.top = this.layoutBounds.minY + 15;
    const subtitle = text(strings.centredStringProperty, 560);
    subtitle.lineWrap = 560;
    subtitle.left = title.left;
    subtitle.top = title.bottom + 5;
    const diagram = new ZeemanDiagramNode(model);
    diagram.left = title.left + 5;
    diagram.top = this.layoutBounds.minY + 70;
    const fieldValue = new DerivedProperty(
      [model.fieldProperty, model.capProperty, strings.fieldStringProperty],
      (field, cap, label) =>
        `${label}: ${atomicFieldToTesla(field).toPrecision(4)} T / ${atomicFieldToTesla(cap).toPrecision(4)} T`,
    );
    const fieldSlider = new HSlider(model.fieldFractionProperty, model.fieldFractionProperty.range, {
      ...QUANTUM_ATOM_3D_SLIDER_OPTIONS,
      accessibleName: strings.fieldStringProperty,
      accessibleHelpText: strings.capHelpStringProperty,
      keyboardStep: 0.01,
      shiftKeyboardStep: 0.001,
    });
    model.capProperty.link((cap) => {
      fieldSlider.pdomMapPDOMValue = (value) => Number(atomicFieldToTesla(cap * value).toPrecision(8));
    });
    const fieldControl = new VBox({ align: "left", spacing: 8, children: [text(fieldValue), fieldSlider] });
    const modes = new AquaRadioButtonGroup(
      model.modeProperty,
      (["normal", "anomalous"] as const).map((value) => ({
        value,
        createNode: () => text(strings[`${value}StringProperty`]),
        options: { accessibleName: strings[`${value}StringProperty`] },
      })),
      { orientation: "horizontal", spacing: 14, radioButtonOptions: { radius: 7 } },
    );
    const lines = new AquaRadioButtonGroup(
      model.lineProperty,
      (["halpha", "lyalpha"] as const).map((value) => ({
        value,
        createNode: () => text(value === "halpha" ? "Hα (3 → 2)" : "Lyα (2 → 1)"),
        options: { accessibleName: value === "halpha" ? "Hα (3 → 2)" : "Lyα (2 → 1)" },
      })),
      { orientation: "horizontal", spacing: 14, radioButtonOptions: { radius: 7 } },
    );
    const directions = new AquaRadioButtonGroup(
      model.directionProperty,
      (["perpendicular", "along"] as const).map((value) => ({
        value,
        createNode: () => text(strings[`${value}StringProperty`]),
        options: { accessibleName: strings[`${value}StringProperty`] },
      })),
      { spacing: 8, radioButtonOptions: { radius: 7 } },
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
      spacing: 14,
      children: [
        modes,
        lines,
        new HBox({
          spacing: 10,
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
          spacing: 10,
          children: [
            text(strings.selectedStringProperty),
            spinner(model.selectedIndexProperty, model.selectedRangeProperty, strings.selectedStringProperty, 1),
          ],
        }),
      ],
      left: this.layoutBounds.maxX - 365,
      top: this.layoutBounds.minY + 20,
    });
    const selected = new DerivedProperty(
      [model.upperLevelsProperty, model.selectedIndexProperty, model.modeProperty],
      (levels, index, mode) => {
        const level = levels[index];
        return level
          ? `n=${level.n}, l=${level.l}${mode === "anomalous" ? `, j=${level.j}` : ""}, m=${level.m}<br>g=${level.g.toFixed(3)}, E=${hartreeToEv(level.energy).toFixed(8)} eV`
          : "";
      },
    );
    const selectedLabel = text(selected);
    selectedLabel.left = controls.left;
    selectedLabel.top = this.layoutBounds.minY + 370;
    const spectrumTitle = text(
      new DerivedProperty(
        [model.transitionsProperty, strings.spectrumStringProperty],
        (transitions, label) => `${label}: ${distinctPhotonEnergies(transitions).length}`,
      ),
      550,
    );
    spectrumTitle.left = title.left;
    spectrumTitle.top = this.layoutBounds.minY + 465;
    const spectrum = new ZeemanSpectrumNode(500, model);
    spectrum.left = title.left + 20;
    spectrum.top = spectrumTitle.bottom + 8;
    const legend = new HBox({
      spacing: 25,
      children: (["pi", "sigmaPlus", "sigmaMinus"] as const).map(
        (value, index) =>
          new RichText(["π (Δm=0)", "σ⁺ (Δm=+1)", "σ⁻ (Δm=−1)"][index] ?? "", {
            font: new PhetFont(12),
            fill: polarizationColor(value),
          }),
      ),
    });
    legend.left = title.left;
    legend.top = spectrum.bottom + 6;
    const period = new DerivedProperty(
      [
        model.upperLevelsProperty,
        model.selectedIndexProperty,
        model.fieldProperty,
        strings.periodStringProperty,
        strings.offStringProperty,
      ],
      (levels, index, field, label, off) => {
        const level = levels[index];
        if (!level || field === 0) {
          return off;
        }
        const q = model.modeProperty.value === "normal" ? level.l : level.j;
        if (q === 0) {
          return `${label}: — (L=0)`;
        }
        return `${label}: ${atomicTimeToFs((4 * Math.PI) / (level.g * field)).toPrecision(4)} fs`;
      },
    );
    const periodLabel = text(period, 335);
    periodLabel.left = controls.left;
    periodLabel.top = this.layoutBounds.minY + 435;
    const axis = new Line(0, 50, 0, -50, { stroke: QuantumAtom3DColors.textColorProperty });
    const arrow = new ArrowNode(0, 0, 20, -20, {
      fill: QuantumAtom3DColors.radialCurveColorProperty,
      stroke: null,
      tailWidth: 3,
      headWidth: 10,
      headHeight: 10,
    });
    const precession = new Node({ children: [axis, arrow], x: controls.left + 70, y: this.layoutBounds.minY + 525 });
    const update = () => {
      const level = model.upperLevelsProperty.value[model.selectedIndexProperty.value];
      if (!level) {
        return;
      }
      const q = model.modeProperty.value === "normal" ? level.l : level.j;
      arrow.visible = q > 0;
      const [x, y] = projectToScreen(orbitCameraFrame(0.3, 0.2), orbitalVector(q, level.m, model.phaseProperty.value));
      const scale = 45 / Math.max(1, Math.sqrt(q * (q + 1)));
      if (q > 0) {
        arrow.setTailAndTip(0, 0, x * scale, -y * scale);
      }
    };
    model.phaseProperty.link(update);
    model.upperLevelsProperty.link(update);
    model.selectedIndexProperty.link(update);
    const playback = new TimeControlNode(model.timer.isPlayingProperty, {
      playPauseStepButtonOptions: {
        ...FLAT_PLAY_PAUSE_STEP_BUTTON_OPTIONS,
        stepForwardButtonOptions: {
          ...FLAT_PLAY_PAUSE_STEP_BUTTON_OPTIONS.stepForwardButtonOptions,
          listener: () => {
            model.phaseProperty.value =
              (model.phaseProperty.value + 0.05 * model.fieldFractionProperty.value) % (2 * Math.PI);
          },
        },
      },
    });
    playback.left = controls.left + 145;
    playback.centerY = precession.y;
    const note = text(strings.noteStringProperty, 920);
    note.left = title.left;
    note.bottom = this.layoutBounds.maxY - 12;
    const reset = new ResetAllButton({
      ...FLAT_RESET_ALL_BUTTON_OPTIONS,
      listener: () => {
        model.reset();
      },
      right: this.layoutBounds.maxX - 18,
      bottom: this.layoutBounds.maxY - 18,
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
