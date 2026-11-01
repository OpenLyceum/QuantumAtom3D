/** Orbitals: 3D volume at left, radial/slice details in the middle, state controls at right. */
import { DerivedProperty, StringUnionProperty, type TReadOnlyProperty } from "scenerystack/axon";
import { Dimension2 } from "scenerystack/dot";
import { optionize } from "scenerystack/phet-core";
import { StringUtils } from "scenerystack/phetcommon";
import { HBox, Node, RichText, VBox } from "scenerystack/scenery";
import { PhetFont, ResetAllButton } from "scenerystack/scenery-phet";
import { ScreenView, type ScreenViewOptions } from "scenerystack/sim";
import { AquaRadioButtonGroup, HSlider } from "scenerystack/sun";
import { RENDER_MODES } from "../../common/model/orbital/RenderMode.js";
import { FLAT_RESET_ALL_BUTTON_OPTIONS } from "../../common/QuantumAtom3DButtonOptions.js";
import { QUANTUM_ATOM_3D_SLIDER_OPTIONS } from "../../common/QuantumAtom3DControlOptions.js";
import { formatLength } from "../../common/view/formatters.js";
import { OrbitalReadoutPanel } from "../../common/view/OrbitalReadoutPanel.js";
import { OrbitalViewportNode } from "../../common/view/OrbitalViewportNode.js";
import { RadialDistributionChartNode } from "../../common/view/RadialDistributionChartNode.js";
import { SliceHeatmapNode } from "../../common/view/SliceHeatmapNode.js";
import { StringManager } from "../../i18n/StringManager.js";
import QuantumAtom3DColors from "../../QuantumAtom3DColors.js";
import { type PhaseColormap, SCREEN_VIEW_MARGIN } from "../../QuantumAtom3DConstants.js";
import type { OrbitalsModel } from "../model/OrbitalsModel.js";
import { OrbitalColorControl } from "./OrbitalColorControl.js";
import { OrbitalsControlPanel } from "./OrbitalsControlPanel.js";
import { OrbitalsScreenSummaryContent } from "./OrbitalsScreenSummaryContent.js";
import { SliceControlPanel } from "./SliceControlPanel.js";

const VIEW_SIZE = 340;
const DETAIL_SIZE = 275;
const CHART_HEIGHT = 150;
const COLUMN_GAP = 30;
const GAP = 12;
const TITLE_ROOM = 30;
const LABEL_FONT = new PhetFont(13);

type SelfOptions = { readonly phaseColormapProperty: TReadOnlyProperty<PhaseColormap> };
export type OrbitalsScreenViewOptions = SelfOptions & ScreenViewOptions;

export class OrbitalsScreenView extends ScreenView {
  public readonly viewport: OrbitalViewportNode;

  public constructor(model: OrbitalsModel, providedOptions: OrbitalsScreenViewOptions) {
    const options = optionize<OrbitalsScreenViewOptions, SelfOptions, ScreenViewOptions>()(
      {
        screenSummaryContent: new OrbitalsScreenSummaryContent(model),
      },
      providedOptions,
    );
    super(options);
    const { phaseColormapProperty } = options;
    const strings = StringManager.getInstance().getOrbitalStrings();
    const label = (text: TReadOnlyProperty<string>, maxWidth = 150) =>
      new RichText(text, {
        font: LABEL_FONT,
        fill: QuantumAtom3DColors.textColorProperty,
        maxWidth,
      });

    this.viewport = new OrbitalViewportNode(VIEW_SIZE, model, phaseColormapProperty);
    const viewport = this.viewport;
    viewport.left = this.layoutBounds.minX + SCREEN_VIEW_MARGIN;
    viewport.top = this.layoutBounds.minY + SCREEN_VIEW_MARGIN + TITLE_ROOM;
    const title = label(strings.volume.titleStringProperty);
    title.left = viewport.left;
    title.bottom = viewport.top - GAP / 2;
    const scale = new DerivedProperty(
      [model.viewHalfWidthProperty, strings.slice.scaleStringProperty],
      (width, pattern) => StringUtils.fillIn(pattern, { value: formatLength(width) }),
    );
    const scaleLabel = label(scale);
    scaleLabel.boundsProperty.link(() => {
      scaleLabel.right = viewport.right;
      scaleLabel.bottom = viewport.top - GAP / 2;
    });

    const cameraRows = (
      [
        [strings.volume.yawStringProperty, viewport.camera.yawProperty],
        [strings.volume.pitchStringProperty, viewport.camera.pitchProperty],
      ] as const
    ).map(
      ([name, property]) =>
        new HBox({
          spacing: GAP,
          children: [
            label(name, 100),
            new HSlider(property, property.range, {
              ...QUANTUM_ATOM_3D_SLIDER_OPTIONS,
              trackSize: new Dimension2(170, 3),
              keyboardStep: Math.PI / 36,
              shiftKeyboardStep: Math.PI / 180,
              accessibleName: name,
            }),
          ],
        }),
    );
    const backend = new DerivedProperty(
      [viewport.backendProperty, strings.volume.gpuStringProperty, strings.volume.cpuStringProperty],
      (value, gpu, cpu) => (value === "gpu" ? gpu : cpu),
    );
    const modes = new AquaRadioButtonGroup(
      model.renderModeProperty,
      RENDER_MODES.map((value) => ({
        value,
        createNode: () => label(strings.volume[`${value}StringProperty`], 100),
        options: { accessibleName: strings.volume[`${value}StringProperty`] },
      })),
      { orientation: "horizontal", spacing: 8, radioButtonOptions: { radius: 6 } },
    );
    const fraction = new AquaRadioButtonGroup(
      model.enclosedFractionProperty,
      [0.9, 0.95].map((value) => ({
        value,
        createNode: () =>
          new RichText(`${100 * value}%`, { font: LABEL_FONT, fill: QuantumAtom3DColors.textColorProperty }),
        options: { accessibleName: `${100 * value}%` },
      })),
      { orientation: "horizontal", spacing: 8, radioButtonOptions: { radius: 6 } },
    );
    model.renderModeProperty.link((mode) => {
      fraction.visible = mode === "isosurface";
    });
    const belowViewport = new VBox({
      spacing: GAP,
      align: "left",
      children: [
        modes,
        fraction,
        label(backend, VIEW_SIZE),
        ...cameraRows,
        new OrbitalColorControl(model, phaseColormapProperty),
      ],
      left: viewport.left,
      top: viewport.bottom + GAP,
    });

    const detailProperty = new StringUnionProperty("radial", { validValues: ["radial", "slice"] });
    const detailChoice = new AquaRadioButtonGroup(
      detailProperty,
      [
        {
          value: "radial",
          createNode: () => label(strings.volume.radialTabStringProperty, 140),
          options: { accessibleName: strings.volume.radialTabStringProperty },
        },
        {
          value: "slice",
          createNode: () => label(strings.volume.sliceTabStringProperty, 110),
          options: { accessibleName: strings.volume.sliceTabStringProperty },
        },
      ],
      { orientation: "horizontal", spacing: 10, radioButtonOptions: { radius: 6 } },
    );
    detailChoice.left = viewport.right + COLUMN_GAP;
    detailChoice.top = this.layoutBounds.minY + SCREEN_VIEW_MARGIN;
    const detailTop = viewport.top + GAP;
    const chart = new RadialDistributionChartNode(DETAIL_SIZE, CHART_HEIGHT, {
      summaryProperty: model.summaryProperty,
      maxRadiusProperty: model.viewHalfWidthProperty,
      probeFractionProperty: model.probeFractionProperty,
    });
    const probeValue = new DerivedProperty(
      [model.probeFractionProperty, model.viewHalfWidthProperty, strings.volume.probeStringProperty],
      (probeFraction, width, name) => `${name}: ${formatLength(probeFraction * width)} a<sub>0</sub>`,
    );
    const probeControl = new VBox({
      align: "left",
      spacing: GAP / 2,
      children: [
        label(probeValue, DETAIL_SIZE),
        new HSlider(model.probeFractionProperty, model.probeFractionProperty.range, {
          ...QUANTUM_ATOM_3D_SLIDER_OPTIONS,
          trackSize: new Dimension2(DETAIL_SIZE - 25, 3),
          keyboardStep: 0.01,
          shiftKeyboardStep: 0.001,
          accessibleName: strings.volume.probeStringProperty,
          accessibleHelpText: strings.volume.probeHelpStringProperty,
        }),
      ],
    });
    const readouts = new OrbitalReadoutPanel(model.summaryProperty);
    const radialPanel = new VBox({
      children: [chart, probeControl, readouts],
      spacing: 2 * GAP,
      align: "left",
      left: detailChoice.left,
      top: detailTop,
    });
    const heatmap = new SliceHeatmapNode(DETAIL_SIZE, {
      wavefunctionProperty: model.wavefunctionProperty,
      summaryProperty: model.summaryProperty,
      slicePlaneProperty: model.slicePlaneProperty,
      sliceOffsetProperty: model.sliceOffsetProperty,
      halfWidthProperty: model.viewHalfWidthProperty,
      coloringProperty: model.sliceColoringProperty,
      phaseColormapProperty,
      nodesVisibleProperty: model.nodesVisibleProperty,
    });
    const sliceControls = new SliceControlPanel(model);
    const slicePanel = new VBox({
      children: [heatmap, sliceControls],
      spacing: GAP,
      align: "left",
      left: detailChoice.left,
      top: detailTop,
    });
    detailProperty.link((value) => {
      radialPanel.visible = value === "radial";
      slicePanel.visible = value === "slice";
    });
    const controls = new OrbitalsControlPanel(model);
    controls.right = this.layoutBounds.maxX - SCREEN_VIEW_MARGIN;
    controls.top = this.layoutBounds.minY + SCREEN_VIEW_MARGIN;
    const reset = new ResetAllButton({
      ...FLAT_RESET_ALL_BUTTON_OPTIONS,
      listener: () => {
        model.reset();
        viewport.reset();
        detailProperty.reset();
      },
      right: this.layoutBounds.maxX - SCREEN_VIEW_MARGIN,
      bottom: this.layoutBounds.maxY - SCREEN_VIEW_MARGIN,
    });
    const content = new Node({
      children: [title, scaleLabel, viewport, belowViewport, detailChoice, radialPanel, slicePanel, controls, reset],
    });
    this.addChild(content);
    this.pdomPlayAreaNode.pdomOrder = [viewport, detailChoice, radialPanel, slicePanel];
    this.pdomControlAreaNode.pdomOrder = [belowViewport, controls, reset];
  }

  public override step(_dt: number): void {
    this.viewport.step();
  }
}
