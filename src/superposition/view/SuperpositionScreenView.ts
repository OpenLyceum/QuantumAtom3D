/** Coherent-state mixer, animated 3D view and expectation-value history. */
import { DerivedProperty, type NumberProperty, type TReadOnlyProperty } from "scenerystack/axon";
import { Bounds2, Dimension2, type Range } from "scenerystack/dot";
import { AlignBox, HBox, Node, RichText, Text, VBox } from "scenerystack/scenery";
import { PhetFont, ResetAllButton, TimeControlNode } from "scenerystack/scenery-phet";
import { ScreenView, type ScreenViewOptions } from "scenerystack/sim";
import { AquaRadioButtonGroup, HSlider, NumberSpinner, RectangularPushButton } from "scenerystack/sun";
import { atomicTimeToFs, wavelengthNmForEnergy } from "../../common/model/AtomicUnits.js";
import { hydrogenEnergy } from "../../common/model/hydrogen/HydrogenExpectations.js";
import { SUPERPOSITION_PRESETS, type SuperpositionPreset } from "../../common/model/orbital/SuperpositionPresets.js";
import { dipoleAllowed } from "../../common/model/orbital/SuperpositionState.js";
import {
  FLAT_PANEL_PUSH_BUTTON_OPTIONS,
  FLAT_PLAY_PAUSE_STEP_BUTTON_OPTIONS,
  FLAT_RECTANGULAR_BUTTON_OPTIONS,
  FLAT_RESET_ALL_BUTTON_OPTIONS,
  LIGHT_SURFACE_TEXT_FILL,
} from "../../common/QuantumAtom3DButtonOptions.js";
import { QUANTUM_ATOM_3D_SLIDER_OPTIONS } from "../../common/QuantumAtom3DControlOptions.js";
import { StringManager } from "../../i18n/StringManager.js";
import { OrbitalColorControl } from "../../orbitals/view/OrbitalColorControl.js";
import QuantumAtom3DColors from "../../QuantumAtom3DColors.js";
import { type PhaseColormap, SCREEN_VIEW_MARGIN } from "../../QuantumAtom3DConstants.js";
import type { SuperpositionModel } from "../model/SuperpositionModel.js";
import { ExpectationTimeSeriesNode } from "./ExpectationTimeSeriesNode.js";
import { SuperpositionScreenSummaryContent } from "./SuperpositionScreenSummaryContent.js";
import { SuperpositionViewportNode } from "./SuperpositionViewportNode.js";

type Options = ScreenViewOptions & { phaseColormapProperty: TReadOnlyProperty<PhaseColormap> };
const FONT = new PhetFont(13);
const SIZE = 340;
export class SuperpositionScreenView extends ScreenView {
  public readonly viewport: SuperpositionViewportNode;
  public constructor(model: SuperpositionModel, options: Options) {
    super({ ...options, screenSummaryContent: new SuperpositionScreenSummaryContent(model) });
    const strings = StringManager.getInstance().getSuperpositionStrings();
    const orbital = StringManager.getInstance().getOrbitalStrings();
    const text = (value: string | TReadOnlyProperty<string>, maxWidth = 180) =>
      new RichText(value, { font: FONT, fill: QuantumAtom3DColors.textColorProperty, maxWidth });
    const slider = (property: NumberProperty, name: TReadOnlyProperty<string>, width = 110) =>
      new HSlider(property, property.range, {
        ...QUANTUM_ATOM_3D_SLIDER_OPTIONS,
        trackSize: new Dimension2(width, 3),
        accessibleName: name,
        keyboardStep:
          property === model.zoomProperty || property === model.nuclearChargeProperty
            ? 1
            : property.range.getLength() / 100,
        ...((property === model.zoomProperty || property === model.nuclearChargeProperty) && {
          shiftKeyboardStep: 1,
          pageKeyboardStep: 1,
          constrainValue: (v: number) => Math.round(v),
        }),
      });
    this.viewport = new SuperpositionViewportNode(SIZE, model, options.phaseColormapProperty);
    this.viewport.left = this.layoutBounds.minX + SCREEN_VIEW_MARGIN;
    this.viewport.top = this.layoutBounds.minY + 35;
    const viewport = this.viewport;
    const timeText = new DerivedProperty(
      [model.timeProperty, model.expectationsProperty, strings.timeStringProperty],
      (time, expectation, name) =>
        `${name}: ${atomicTimeToFs(time).toFixed(3)} fs   ⟨z⟩ = ${expectation.z.toFixed(2)} a<sub>0</sub>   ⟨r⟩ = ${expectation.r.toFixed(2)} a<sub>0</sub>`,
    );
    const timeLabel = text(timeText, SIZE);
    timeLabel.left = viewport.left;
    timeLabel.bottom = viewport.top - 8;
    const timeControls = new TimeControlNode(model.timer.isPlayingProperty, {
      playPauseStepButtonOptions: {
        ...FLAT_PLAY_PAUSE_STEP_BUTTON_OPTIONS,
        stepForwardButtonOptions: {
          ...FLAT_PLAY_PAUSE_STEP_BUTTON_OPTIONS.stepForwardButtonOptions,
          listener: () => model.advance(1 / 60),
        },
      },
    });
    const modes = new AquaRadioButtonGroup(
      model.renderModeProperty,
      (["volume", "dots", "isosurface"] as const).map((mode) => ({
        value: mode,
        createNode: () => text(orbital.volume[`${mode}StringProperty`]),
        options: { accessibleName: orbital.volume[`${mode}StringProperty`] },
      })),
      { orientation: "horizontal", spacing: 8, radioButtonOptions: { radius: 6 } },
    );
    const coloring = new OrbitalColorControl(
      { sliceColoringProperty: model.coloringProperty },
      options.phaseColormapProperty,
    );
    const below = new VBox({
      align: "left",
      spacing: 9,
      left: viewport.left,
      top: viewport.bottom + 10,
      children: [
        new HBox({
          spacing: 16,
          children: [
            timeControls,
            text(strings.speedStringProperty),
            slider(model.speedProperty, strings.speedStringProperty, 95),
          ],
        }),
        modes,
        coloring,
        new HBox({
          spacing: 10,
          children: [
            text(orbital.volume.yawStringProperty, 70),
            slider(viewport.camera.yawProperty, orbital.volume.yawStringProperty, 95),
            text(orbital.volume.pitchStringProperty, 70),
            slider(viewport.camera.pitchProperty, orbital.volume.pitchStringProperty, 95),
          ],
        }),
        new HBox({
          spacing: 10,
          children: [
            text(orbital.zoomStringProperty, 70),
            slider(model.zoomProperty, orbital.zoomStringProperty, 95),
            text(orbital.nuclearChargeStringProperty, 90),
            slider(model.nuclearChargeProperty, orbital.nuclearChargeStringProperty, 70),
          ],
        }),
      ],
    });
    const rightX = viewport.right + 35;
    const spinner = (property: NumberProperty, range: TReadOnlyProperty<Range>, name: TReadOnlyProperty<string>) =>
      new NumberSpinner(property, range, {
        arrowsPosition: "leftRight",
        arrowButtonOptions: FLAT_RECTANGULAR_BUTTON_OPTIONS,
        numberDisplayOptions: { textOptions: { font: FONT }, minBackgroundWidth: 20 },
        accessibleName: name,
      });
    const count = new HBox({
      spacing: 10,
      children: [
        text(strings.termsStringProperty),
        spinner(model.termCountProperty, model.termCountProperty.rangeProperty, strings.termsStringProperty),
      ],
    });
    const presetButtons = (Object.keys(SUPERPOSITION_PRESETS) as SuperpositionPreset[]).map(
      (key) =>
        new RectangularPushButton({
          ...FLAT_PANEL_PUSH_BUTTON_OPTIONS,
          content: new Text(strings.presets[`${key}StringProperty`], {
            font: FONT,
            fill: LIGHT_SURFACE_TEXT_FILL,
            maxWidth: 100,
          }),
          accessibleName: strings.presets[`${key}StringProperty`],
          listener: () => {
            model.loadPreset(key);
          },
        }),
    );
    const presetRow = new HBox({ spacing: 6, children: presetButtons });
    const rowBox = (children: Node[]) =>
      new HBox({
        spacing: 7,
        children: children.map(
          (child, index) =>
            new AlignBox(child, {
              alignBounds: new Bounds2(0, 0, [15, 80, 80, 80, 120, 120][index] ?? 80, 30),
              xAlign: "center",
              yAlign: "center",
            }),
        ),
      });
    const coefficientSlider = (property: NumberProperty, name: TReadOnlyProperty<string>) =>
      new VBox({
        spacing: 1,
        children: [text(new DerivedProperty([property], (value) => value.toFixed(2))), slider(property, name, 95)],
      });
    const rows = model.rows.map((row, index) => {
      const name = (label: TReadOnlyProperty<string>) =>
        new DerivedProperty([strings.termStringProperty, label], (term, part) => `${term} ${index + 1}: ${part}`);
      const q = row.quantumNumbers;
      const result = rowBox([
        text(`${index + 1}`),
        spinner(q.nProperty, q.nProperty.rangeProperty, name(orbital.principalStringProperty)),
        spinner(q.lProperty, q.lRangeProperty, name(orbital.orbitalStringProperty)),
        spinner(q.mProperty, q.mRangeProperty, name(orbital.magneticStringProperty)),
        coefficientSlider(row.magnitudeProperty, name(strings.magnitudeStringProperty)),
        coefficientSlider(row.phaseProperty, name(strings.phaseStringProperty)),
      ]);
      model.termCountProperty.link((value) => {
        result.visible = index < value;
      });
      return result;
    });
    const columns = rowBox([
      text(""),
      text(orbital.principalStringProperty),
      text(orbital.orbitalStringProperty),
      text(orbital.magneticStringProperty),
      text(strings.magnitudeStringProperty),
      text(strings.phaseStringProperty),
    ]);
    const mixer = new VBox({
      align: "left",
      spacing: 9,
      children: [presetRow, count, columns, ...rows],
      left: rightX,
      top: this.layoutBounds.minY + 20,
    });
    const status = new DerivedProperty(
      [
        model.termsProperty,
        model.nuclearChargeProperty,
        strings.emptyStringProperty,
        strings.stationaryStringProperty,
        strings.pairStringProperty,
        strings.allowedStringProperty,
        strings.forbiddenStringProperty,
      ],
      (terms, charge, empty, stationary, pair, allowed, forbidden) => {
        const a = terms[0];
        const b = terms[1];
        if (!a) {
          return empty;
        }
        if (!b || terms.every((term) => term.n === a.n)) {
          return stationary;
        }
        const gap = Math.abs(hydrogenEnergy(a.n, charge) - hydrogenEnergy(b.n, charge));
        if (gap === 0) {
          return `${pair}: ΔE = 0`;
        }
        const period = atomicTimeToFs((2 * Math.PI) / gap);
        return `${pair}: T = ${period.toFixed(3)} fs, f = ${(1 / period).toFixed(3)} PHz, λ = ${wavelengthNmForEnergy(gap).toFixed(1)} nm<br>${dipoleAllowed(a, b) ? allowed : forbidden}`;
      },
    );
    const statusLabel = text(status, 500);
    statusLabel.left = rightX;
    statusLabel.top = this.layoutBounds.minY + 388;
    const chart = new ExpectationTimeSeriesNode(470, 105, model);
    chart.left = rightX;
    chart.top = this.layoutBounds.minY + 455;
    const normalization = text(strings.normalizationStringProperty, 510);
    normalization.left = rightX;
    normalization.top = this.layoutBounds.minY + 355;
    const reset = new ResetAllButton({
      ...FLAT_RESET_ALL_BUTTON_OPTIONS,
      listener: () => {
        model.reset();
        viewport.reset();
      },
      right: this.layoutBounds.maxX - SCREEN_VIEW_MARGIN,
      bottom: this.layoutBounds.maxY - SCREEN_VIEW_MARGIN,
    });
    this.addChild(
      new Node({ children: [viewport, timeLabel, below, mixer, normalization, statusLabel, chart, reset] }),
    );
    this.pdomPlayAreaNode.pdomOrder = [viewport];
    this.pdomControlAreaNode.pdomOrder = [mixer, below, reset];
  }
  public override step(_dt: number): void {
    this.viewport.step();
  }
}
