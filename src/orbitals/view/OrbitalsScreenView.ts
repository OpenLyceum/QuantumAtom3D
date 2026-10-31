/**
 * OrbitalsScreenView.ts
 *
 * The Orbitals screen (M1: 2D only). From left to right:
 *
 *   - the cross-section heatmap of ψ, with its plane, offset, colouring and legend below
 *   - the radial distribution P(r) on the same length scale, with the readouts below it
 *   - the state picker: n, l, m, the basis, Z, zoom and nodes
 *
 * The 3D viewport replaces the left column in M2; the cross-section then moves
 * into a tabbed panel.
 */

import type { TReadOnlyProperty } from "scenerystack/axon";
import { DerivedProperty } from "scenerystack/axon";
import { optionize } from "scenerystack/phet-core";
import { StringUtils } from "scenerystack/phetcommon";
import { RichText } from "scenerystack/scenery";
import { PhetFont, ResetAllButton } from "scenerystack/scenery-phet";
import { ScreenView, type ScreenViewOptions } from "scenerystack/sim";
import { FLAT_RESET_ALL_BUTTON_OPTIONS } from "../../common/QuantumAtom3DButtonOptions.js";
import { formatLength } from "../../common/view/formatters.js";
import { OrbitalReadoutPanel } from "../../common/view/OrbitalReadoutPanel.js";
import { RadialDistributionChartNode } from "../../common/view/RadialDistributionChartNode.js";
import { SliceHeatmapNode } from "../../common/view/SliceHeatmapNode.js";
import { StringManager } from "../../i18n/StringManager.js";
import QuantumAtom3DColors from "../../QuantumAtom3DColors.js";
import { type PhaseColormap, SCREEN_VIEW_MARGIN } from "../../QuantumAtom3DConstants.js";
import type { OrbitalsModel } from "../model/OrbitalsModel.js";
import { OrbitalsControlPanel } from "./OrbitalsControlPanel.js";
import { OrbitalsScreenSummaryContent } from "./OrbitalsScreenSummaryContent.js";
import { SliceControlPanel } from "./SliceControlPanel.js";

/** Side of the square cross-section, in view pixels. */
const SLICE_SIZE = 340;

/** Size of the P(r) plot area. */
const CHART_WIDTH = 290;
const CHART_HEIGHT = 170;

/** Gaps between the three columns and between stacked items. */
const COLUMN_GAP = 30;
const STACK_GAP = 12;

/** Room above the slice and chart for their titles. */
const TITLE_ROOM = 28;

const TITLE_FONT = new PhetFont({ size: 14, weight: "bold" });
const SCALE_FONT = new PhetFont(12);

type SelfOptions = {
  /** The phase-wheel preference, shared by every screen. */
  readonly phaseColormapProperty: TReadOnlyProperty<PhaseColormap>;
};

export type OrbitalsScreenViewOptions = SelfOptions & ScreenViewOptions;

export class OrbitalsScreenView extends ScreenView {
  public constructor(model: OrbitalsModel, providedOptions: OrbitalsScreenViewOptions) {
    const options = optionize<OrbitalsScreenViewOptions, SelfOptions, ScreenViewOptions>()(
      {
        screenSummaryContent: new OrbitalsScreenSummaryContent(model),
      },
      providedOptions,
    );
    const { phaseColormapProperty } = options;
    super(options);

    const strings = StringManager.getInstance().getOrbitalStrings();

    // ── Left column: cross-section ───────────────────────────────────────────
    const heatmap = new SliceHeatmapNode(SLICE_SIZE, {
      wavefunctionProperty: model.wavefunctionProperty,
      summaryProperty: model.summaryProperty,
      slicePlaneProperty: model.slicePlaneProperty,
      sliceOffsetProperty: model.sliceOffsetProperty,
      halfWidthProperty: model.viewHalfWidthProperty,
      coloringProperty: model.sliceColoringProperty,
      phaseColormapProperty,
      nodesVisibleProperty: model.nodesVisibleProperty,
      left: this.layoutBounds.minX + SCREEN_VIEW_MARGIN,
      top: this.layoutBounds.minY + SCREEN_VIEW_MARGIN + TITLE_ROOM,
    });
    const sliceTitle = new RichText(strings.slice.titleStringProperty, {
      font: TITLE_FONT,
      fill: QuantumAtom3DColors.textColorProperty,
    });
    sliceTitle.boundsProperty.link(() => {
      sliceTitle.left = heatmap.left;
      sliceTitle.bottom = heatmap.top - STACK_GAP / 2;
    });
    const scaleProperty = new DerivedProperty(
      [model.viewHalfWidthProperty, strings.slice.scaleStringProperty],
      (halfWidth, pattern) => StringUtils.fillIn(pattern, { value: formatLength(halfWidth) }),
    );
    const scaleLabel = new RichText(scaleProperty, { font: SCALE_FONT, fill: QuantumAtom3DColors.textColorProperty });
    scaleLabel.boundsProperty.link(() => {
      scaleLabel.right = heatmap.right;
      scaleLabel.bottom = heatmap.top - STACK_GAP / 2;
    });

    const sliceControlPanel = new SliceControlPanel(model, phaseColormapProperty);
    sliceControlPanel.left = heatmap.left;
    sliceControlPanel.top = heatmap.bottom + STACK_GAP;

    // ── Middle column: P(r) and readouts ─────────────────────────────────────
    const chart = new RadialDistributionChartNode(CHART_WIDTH, CHART_HEIGHT, {
      summaryProperty: model.summaryProperty,
      maxRadiusProperty: model.viewHalfWidthProperty,
      left: heatmap.right + COLUMN_GAP,
      top: heatmap.top,
    });
    const readoutPanel = new OrbitalReadoutPanel(model.summaryProperty);
    readoutPanel.left = chart.left;
    readoutPanel.top = chart.bottom + 2 * STACK_GAP;

    // ── Right column: state picker ───────────────────────────────────────────
    const controlPanel = new OrbitalsControlPanel(model);
    controlPanel.right = this.layoutBounds.maxX - SCREEN_VIEW_MARGIN;
    controlPanel.top = this.layoutBounds.minY + SCREEN_VIEW_MARGIN;

    const resetAllButton = new ResetAllButton({
      ...FLAT_RESET_ALL_BUTTON_OPTIONS,
      listener: () => {
        model.reset();
      },
      right: this.layoutBounds.maxX - SCREEN_VIEW_MARGIN,
      bottom: this.layoutBounds.maxY - SCREEN_VIEW_MARGIN,
    });

    this.addChild(sliceTitle);
    this.addChild(scaleLabel);
    this.addChild(heatmap);
    this.addChild(sliceControlPanel);
    this.addChild(chart);
    this.addChild(readoutPanel);
    this.addChild(controlPanel);
    this.addChild(resetAllButton);

    this.pdomPlayAreaNode.pdomOrder = [heatmap, chart, readoutPanel];
    this.pdomControlAreaNode.pdomOrder = [controlPanel, sliceControlPanel, resetAllButton];
  }
}
