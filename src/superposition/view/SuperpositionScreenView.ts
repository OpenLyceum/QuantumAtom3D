/** Coherent-state mixer, animated 3D view and expectation-value history. */
import { DerivedProperty, type NumberProperty, type TReadOnlyProperty } from "scenerystack/axon";
import { Bounds2, Dimension2, type Range } from "scenerystack/dot";
import { AlignBox, HBox, Node, RichText, Text, VBox } from "scenerystack/scenery";
import { PhetFont, ResetAllButton, TimeControlNode } from "scenerystack/scenery-phet";
import type { ScreenViewOptions } from "scenerystack/sim";
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
import { DEFAULT_LENGTH_UNIT_PROPERTY } from "../../common/view/DisplayDefaults.js";
import { formatLength, lengthUnitSymbol } from "../../common/view/formatters.js";
import { OrbitalColorControl } from "../../common/view/OrbitalColorControl.js";
import { ResponsiveScreenView } from "../../common/view/ResponsiveScreenView.js";
import { StringManager } from "../../i18n/StringManager.js";
import type { QuantumAtom3DPreferencesModel } from "../../preferences/QuantumAtom3DPreferencesModel.js";
import QuantumAtom3DColors from "../../QuantumAtom3DColors.js";
import {
  type PhaseColormap,
  SCREEN_VIEW_MARGIN,
  SUPERPOSITION_SCREEN_VIEW_SETTINGS,
} from "../../QuantumAtom3DConstants.js";
import type { SuperpositionModel } from "../model/SuperpositionModel.js";
import { ExpectationTimeSeriesNode } from "./ExpectationTimeSeriesNode.js";
import { SuperpositionScreenSummaryContent } from "./SuperpositionScreenSummaryContent.js";
import { SuperpositionViewportNode } from "./SuperpositionViewportNode.js";

type Options = ScreenViewOptions & {
  preferences?: QuantumAtom3DPreferencesModel;
  phaseColormapProperty: TReadOnlyProperty<PhaseColormap>;
};
const FONT = new PhetFont(SUPERPOSITION_SCREEN_VIEW_SETTINGS.FONT_SIZE);
const SIZE: number = SUPERPOSITION_SCREEN_VIEW_SETTINGS.SIZE;
export class SuperpositionScreenView extends ResponsiveScreenView {
  public readonly viewport: SuperpositionViewportNode;
  public constructor(model: SuperpositionModel, options: Options) {
    super({
      ...options,
      screenSummaryContent: new SuperpositionScreenSummaryContent(model, options.preferences?.lengthUnitProperty),
    });
    const unitProperty = options.preferences?.lengthUnitProperty ?? DEFAULT_LENGTH_UNIT_PROPERTY;
    const strings = StringManager.getInstance().getSuperpositionStrings();
    const orbital = StringManager.getInstance().getOrbitalStrings();
    const text = (
      value: string | TReadOnlyProperty<string>,
      maxWidth: number = SUPERPOSITION_SCREEN_VIEW_SETTINGS.DEFAULT_MAX_WIDTH,
    ) => new RichText(value, { font: FONT, fill: QuantumAtom3DColors.textColorProperty, maxWidth });
    const slider = (
      property: NumberProperty,
      name: TReadOnlyProperty<string>,
      width: number = SUPERPOSITION_SCREEN_VIEW_SETTINGS.DEFAULT_WIDTH,
    ) =>
      new HSlider(property, property.range, {
        ...QUANTUM_ATOM_3D_SLIDER_OPTIONS,
        trackSize: new Dimension2(width, SUPERPOSITION_SCREEN_VIEW_SETTINGS.SLIDER_HEIGHT),
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
    this.viewport = new SuperpositionViewportNode(
      SIZE,
      model,
      options.phaseColormapProperty,
      options.preferences?.qualityProperty,
    );
    this.viewport.left = this.layoutBounds.minX + SCREEN_VIEW_MARGIN;
    this.viewport.top = this.layoutBounds.minY + SUPERPOSITION_SCREEN_VIEW_SETTINGS.CONSTRUCTOR_TOP_OFFSET;
    const viewport = this.viewport;
    const timeText = new DerivedProperty(
      [model.timeProperty, model.expectationsProperty, strings.timeStringProperty, unitProperty],
      (time, expectation, name, unit) =>
        `${name}: ${atomicTimeToFs(time).toFixed(SUPERPOSITION_SCREEN_VIEW_SETTINGS.TIME_TEXT_DECIMAL_PLACES)} fs   ⟨z⟩ = ${formatLength(expectation.z, unit)} ${lengthUnitSymbol(unit)}   ⟨r⟩ = ${formatLength(expectation.r, unit)} ${lengthUnitSymbol(unit)}`,
    );
    const timeLabel = text(timeText, SIZE);
    timeLabel.left = viewport.left;
    timeLabel.bottom = viewport.top - SUPERPOSITION_SCREEN_VIEW_SETTINGS.CONSTRUCTOR_BOTTOM_OFFSET;
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
      {
        orientation: "horizontal",
        spacing: SUPERPOSITION_SCREEN_VIEW_SETTINGS.MODES_SPACING,
        radioButtonOptions: { radius: SUPERPOSITION_SCREEN_VIEW_SETTINGS.MODES_RADIUS },
      },
    );
    const coloring = new OrbitalColorControl(
      { sliceColoringProperty: model.coloringProperty },
      options.phaseColormapProperty,
    );
    const below = new VBox({
      align: "left",
      spacing: SUPERPOSITION_SCREEN_VIEW_SETTINGS.BELOW_SPACING,
      left: viewport.left,
      top: viewport.bottom + SUPERPOSITION_SCREEN_VIEW_SETTINGS.BELOW_TOP_OFFSET,
      children: [
        new HBox({
          spacing: SUPERPOSITION_SCREEN_VIEW_SETTINGS.CONSTRUCTOR_BELOW_SPACING,
          children: [
            timeControls,
            text(strings.speedStringProperty),
            slider(
              model.speedProperty,
              strings.speedStringProperty,
              SUPERPOSITION_SCREEN_VIEW_SETTINGS.SPEED_SLIDER_WIDTH,
            ),
          ],
        }),
        modes,
        coloring,
        new HBox({
          spacing: SUPERPOSITION_SCREEN_VIEW_SETTINGS.BELOW_ITEM_4_SPACING,
          children: [
            text(orbital.volume.yawStringProperty, SUPERPOSITION_SCREEN_VIEW_SETTINGS.YAW_TEXT_MAX_WIDTH),
            slider(
              viewport.camera.yawProperty,
              orbital.volume.yawStringProperty,
              SUPERPOSITION_SCREEN_VIEW_SETTINGS.YAW_SLIDER_WIDTH,
            ),
            text(orbital.volume.pitchStringProperty, SUPERPOSITION_SCREEN_VIEW_SETTINGS.PITCH_TEXT_MAX_WIDTH),
            slider(
              viewport.camera.pitchProperty,
              orbital.volume.pitchStringProperty,
              SUPERPOSITION_SCREEN_VIEW_SETTINGS.PITCH_SLIDER_WIDTH,
            ),
          ],
        }),
        new HBox({
          spacing: SUPERPOSITION_SCREEN_VIEW_SETTINGS.BELOW_ITEM_5_SPACING,
          children: [
            text(orbital.zoomStringProperty, SUPERPOSITION_SCREEN_VIEW_SETTINGS.ZOOM_TEXT_MAX_WIDTH),
            slider(
              model.zoomProperty,
              orbital.zoomStringProperty,
              SUPERPOSITION_SCREEN_VIEW_SETTINGS.ZOOM_SLIDER_WIDTH,
            ),
            text(orbital.nuclearChargeStringProperty, SUPERPOSITION_SCREEN_VIEW_SETTINGS.NUCLEAR_CHARGE_TEXT_MAX_WIDTH),
            slider(
              model.nuclearChargeProperty,
              orbital.nuclearChargeStringProperty,
              SUPERPOSITION_SCREEN_VIEW_SETTINGS.NUCLEAR_CHARGE_SLIDER_WIDTH,
            ),
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
      spacing: SUPERPOSITION_SCREEN_VIEW_SETTINGS.COUNT_SPACING,
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
            maxWidth: SUPERPOSITION_SCREEN_VIEW_SETTINGS.PRESET_BUTTONS_MAX_WIDTH,
          }),
          accessibleName: strings.presets[`${key}StringProperty`],
          listener: () => {
            model.loadPreset(key);
          },
        }),
    );
    const presetBox = new HBox({
      spacing: SUPERPOSITION_SCREEN_VIEW_SETTINGS.PRESET_BOX_SPACING,
      lineSpacing: 8,
      children: presetButtons,
    });
    const presetRow = new Node({ children: [presetBox] });
    this.portraitProperty.link((portrait) => {
      presetBox.wrap = portrait;
      presetBox.preferredWidth = portrait ? 340 : null;
    });
    const rowBox = (children: Node[]) => {
      const box = new HBox({
        wrap: false,
        lineSpacing: 12,
        spacing: SUPERPOSITION_SCREEN_VIEW_SETTINGS.BOX_SPACING,
        children: children.map(
          (child, index) =>
            new AlignBox(child, {
              alignBounds: new Bounds2(
                0,
                0,
                [15, 80, 80, 80, 120, 120][index] ?? 80,
                SUPERPOSITION_SCREEN_VIEW_SETTINGS.BOX_MAX_Y,
              ),
              xAlign: "center",
              yAlign: "center",
            }),
        ),
      });
      this.portraitProperty.link((portrait) => {
        box.wrap = portrait;
        box.preferredWidth = portrait ? 340 : null;
      });
      return new Node({ children: [box] });
    };
    const coefficientSlider = (property: NumberProperty, name: TReadOnlyProperty<string>) =>
      new VBox({
        spacing: 1,
        children: [
          new RichText(name, {
            font: new PhetFont(SUPERPOSITION_SCREEN_VIEW_SETTINGS.COEFFICIENT_SLIDER_FONT_SIZE),
            fill: QuantumAtom3DColors.textColorProperty,
            maxWidth: SUPERPOSITION_SCREEN_VIEW_SETTINGS.COEFFICIENT_SLIDER_MAX_WIDTH,
            visibleProperty: this.portraitProperty,
          }),
          text(
            new DerivedProperty([property], (value) =>
              value.toFixed(SUPERPOSITION_SCREEN_VIEW_SETTINGS.COEFFICIENT_SLIDER_DECIMAL_PLACES),
            ),
          ),
          slider(property, name, SUPERPOSITION_SCREEN_VIEW_SETTINGS.COEFFICIENT_SLIDER_WIDTH),
        ],
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
      spacing: SUPERPOSITION_SCREEN_VIEW_SETTINGS.MIXER_SPACING,
      children: [presetRow, count, columns, ...rows],
      left: rightX,
      top: this.layoutBounds.minY + SUPERPOSITION_SCREEN_VIEW_SETTINGS.MIXER_TOP_OFFSET,
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
        return `${pair}: T = ${period.toFixed(SUPERPOSITION_SCREEN_VIEW_SETTINGS.STATUS_DECIMAL_PLACES)} fs, f = ${(1 / period).toFixed(SUPERPOSITION_SCREEN_VIEW_SETTINGS.STATUS_DECIMAL_PLACES)} PHz, λ = ${wavelengthNmForEnergy(gap).toFixed(1)} nm<br>${dipoleAllowed(a, b) ? allowed : forbidden}`;
      },
    );
    const statusLabel = text(status, SUPERPOSITION_SCREEN_VIEW_SETTINGS.STATUS_LABEL_MAX_WIDTH);
    statusLabel.left = rightX;
    statusLabel.top = this.layoutBounds.minY + 388;
    const chart = new ExpectationTimeSeriesNode(470, 105, model, unitProperty);
    chart.left = rightX;
    chart.top = this.layoutBounds.minY + 455;
    const normalization = text(
      strings.normalizationStringProperty,
      SUPERPOSITION_SCREEN_VIEW_SETTINGS.NORMALIZATION_TEXT_MAX_WIDTH,
    );
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
    const content = new Node({
      children: [viewport, timeLabel, below, mixer, normalization, statusLabel, chart, reset],
    });
    this.addChild(content);
    this.pdomPlayAreaNode.pdomOrder = [viewport];
    this.pdomControlAreaNode.pdomOrder = [mixer, below, reset];
    this.setResponsiveContent(content, [
      [viewport, timeLabel],
      [below],
      [mixer],
      [normalization],
      [statusLabel],
      [chart],
      [reset],
    ]);
  }
  public override step(_dt: number): void {
    this.viewport.step();
  }
}
