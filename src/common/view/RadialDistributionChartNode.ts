/**
 * RadialDistributionChartNode.ts
 *
 * Bamboo chart of the radial distribution P(r) = r²|R_nl(r)|² from r = 0 to
 * the view half-width, so it shares its length scale with the cross-section
 * beside it. Marks ⟨r⟩ with a dashed line and each radial node with a dot on
 * the axis, where P(r) touches zero.
 */

import {
  DerivedProperty,
  Multilink,
  type NumberProperty,
  type TReadOnlyProperty,
  type UnknownMultilink,
} from "scenerystack/axon";
import { ChartRectangle, ChartTransform, GridLineSet, LinePlot, TickLabelSet, TickMarkSet } from "scenerystack/bamboo";
import { Range, toFixed, Vector2 } from "scenerystack/dot";
import { Orientation } from "scenerystack/phet-core";
import { StringUtils } from "scenerystack/phetcommon";
import { Circle, Line, Node, type NodeOptions, RichText, Text } from "scenerystack/scenery";
import { PhetFont } from "scenerystack/scenery-phet";
import { StringManager } from "../../i18n/StringManager.js";
import type { LengthUnit } from "../../preferences/QuantumAtom3DPreferencesModel.js";
import QuantumAtom3DColors from "../../QuantumAtom3DColors.js";
import { hydrogenRadialDistribution } from "../model/hydrogen/HydrogenRadial.js";
import type { OrbitalSummary } from "../model/orbital/OrbitalSummary.js";
import { DEFAULT_LENGTH_UNIT_PROPERTY } from "./DisplayDefaults.js";
import { formatLength, lengthUnitSymbol } from "./formatters.js";

/** Samples along r for the curve. */
const CURVE_SAMPLES = 300;

/** Headroom above the curve's peak. */
const Y_HEADROOM = 1.1;

/** Roughly how many labelled ticks the r axis gets. */
const TARGET_TICKS = 5;

const LABEL_FONT = new PhetFont(12);
const TITLE_FONT = new PhetFont(14);
const CURVE_LINE_WIDTH = 2;
const MARKER_LINE_WIDTH = 1.5;
const MARKER_DASH = [5, 4];
const NODE_DOT_RADIUS = 3;
const TICK_LABEL_SPACING = 4;
const TITLE_SPACING = 6;

/** Below the tick labels. */
const AXIS_LABEL_OFFSET = 22;

/** A 1–2–5 tick step giving about `target` steps across `span`. */
function niceStep(span: number, target: number): number {
  const raw = span / target;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const normalized = raw / magnitude;
  const nice = normalized < 1.5 ? 1 : normalized < 3.5 ? 2 : normalized < 7.5 ? 5 : 10;
  return nice * magnitude;
}

export type RadialDistributionChartNodeOptions = NodeOptions & {
  readonly lengthUnitProperty?: TReadOnlyProperty<LengthUnit>;
  readonly summaryProperty: TReadOnlyProperty<OrbitalSummary>;
  readonly maxRadiusProperty: TReadOnlyProperty<number>;
  readonly probeFractionProperty?: NumberProperty;
};

export class RadialDistributionChartNode extends Node {
  private readonly axisProperty: TReadOnlyProperty<string>;
  private readonly multilink: UnknownMultilink;
  private readonly probeLink: UnknownMultilink | undefined;

  public constructor(width: number, height: number, options: RadialDistributionChartNodeOptions) {
    const {
      summaryProperty,
      maxRadiusProperty,
      probeFractionProperty,
      lengthUnitProperty = DEFAULT_LENGTH_UNIT_PROPERTY,
      ...nodeOptions
    } = options;
    const strings = StringManager.getInstance().getOrbitalStrings().radialChart;

    const chartTransform = new ChartTransform({
      viewWidth: width,
      viewHeight: height,
      modelXRange: new Range(0, 1),
      modelYRange: new Range(0, 1),
    });
    const background = new ChartRectangle(chartTransform, {
      fill: QuantumAtom3DColors.chartBackgroundColorProperty,
      stroke: QuantumAtom3DColors.sliceFrameColorProperty,
    });
    const gridLines = new GridLineSet(chartTransform, Orientation.HORIZONTAL, 1, {
      stroke: QuantumAtom3DColors.chartGridColorProperty,
    });
    const tickMarks = new TickMarkSet(chartTransform, Orientation.HORIZONTAL, 1, {
      edge: "min",
      stroke: QuantumAtom3DColors.textColorProperty,
    });
    let tickStep = 1;
    const tickLabels = new TickLabelSet(chartTransform, Orientation.HORIZONTAL, 1, {
      edge: "min",
      extent: TICK_LABEL_SPACING,
      createLabel: (value: number) =>
        new Text(lengthUnitProperty.value === "pm" ? formatLength(value, "pm") : toFixed(value, tickStep < 1 ? 1 : 0), {
          font: LABEL_FONT,
          fill: QuantumAtom3DColors.textColorProperty,
        }),
    });
    const curve = new LinePlot(chartTransform, [], {
      stroke: QuantumAtom3DColors.radialCurveColorProperty,
      lineWidth: CURVE_LINE_WIDTH,
    });
    const meanLine = new Line(0, 0, 0, height, {
      stroke: QuantumAtom3DColors.meanRadiusColorProperty,
      lineWidth: MARKER_LINE_WIDTH,
      lineDash: MARKER_DASH,
    });
    const meanLabel = new RichText(StringManager.getInstance().getOrbitalStrings().readouts.meanRadiusStringProperty, {
      font: LABEL_FONT,
      fill: QuantumAtom3DColors.meanRadiusColorProperty,
    });
    const nodeDots = new Node();

    const title = new RichText(strings.titleStringProperty, {
      font: TITLE_FONT,
      fill: QuantumAtom3DColors.textColorProperty,
      maxWidth: width,
    });
    const axisProperty = new DerivedProperty([strings.xAxisStringProperty, lengthUnitProperty], (pattern, unit) =>
      StringUtils.fillIn(pattern, { unit: lengthUnitSymbol(unit) }),
    );
    const xAxisLabel = new RichText(axisProperty, {
      font: LABEL_FONT,
      fill: QuantumAtom3DColors.textColorProperty,
    });
    const plotLayer = new Node({
      children: [background, gridLines, curve, meanLine, meanLabel, nodeDots, tickMarks, tickLabels],
      clipArea: null,
    });

    super({ children: [title, plotLayer, xAxisLabel], ...nodeOptions });

    if (probeFractionProperty) {
      const cursor = new Line(0, 0, 0, height, {
        stroke: QuantumAtom3DColors.sliceNodeOverlayColorProperty,
        lineDash: [3, 3],
        pickable: false,
      });
      plotLayer.addChild(cursor);
      this.probeLink = Multilink.multilink([probeFractionProperty], (fraction) => {
        cursor.setLine(fraction * width, 0, fraction * width, height);
        cursor.visible = fraction > 0;
      });
      this.addInputListener({
        move: (event) => {
          const point = this.globalToLocalPoint(event.pointer.point);
          if (point.y >= 0 && point.y <= height && point.x >= 0 && point.x <= width) {
            probeFractionProperty.value = point.x / width;
          }
        },
      });
    }

    title.boundsProperty.link(() => {
      title.centerX = width / 2;
      title.bottom = -TITLE_SPACING;
    });
    xAxisLabel.boundsProperty.link(() => {
      xAxisLabel.centerX = width / 2;
      xAxisLabel.top = height + AXIS_LABEL_OFFSET;
    });

    this.axisProperty = axisProperty;
    this.multilink = Multilink.multilink(
      [summaryProperty, maxRadiusProperty, lengthUnitProperty],
      (summary, maxRadius) => {
        const { n, l, nuclearCharge } = summary;
        const points: Vector2[] = [];
        let peak = 0;
        for (let i = 0; i <= CURVE_SAMPLES; i++) {
          const r = (maxRadius * i) / CURVE_SAMPLES;
          const value = hydrogenRadialDistribution(n, l, nuclearCharge, r);
          peak = Math.max(peak, value);
          points.push(new Vector2(r, value));
        }
        chartTransform.setModelXRange(new Range(0, maxRadius));
        chartTransform.setModelYRange(new Range(0, peak > 0 ? peak * Y_HEADROOM : 1));
        tickStep = niceStep(maxRadius, TARGET_TICKS);
        gridLines.setSpacing(tickStep);
        tickMarks.setSpacing(tickStep);
        tickLabels.setSpacing(tickStep);
        tickLabels.invalidateTickLabelSet();
        curve.setDataSet(points);

        const meanVisible = summary.meanRadius < maxRadius;
        const meanX = chartTransform.modelToViewX(summary.meanRadius);
        meanLine.visible = meanVisible;
        meanLabel.visible = meanVisible;
        meanLine.setLine(meanX, 0, meanX, height);
        meanLabel.left = meanX + TICK_LABEL_SPACING;
        meanLabel.top = TICK_LABEL_SPACING;

        for (const dot of nodeDots.children) {
          dot.dispose();
        }
        nodeDots.children = summary.nodes.radialNodeRadii
          .filter((radius) => radius < maxRadius)
          .map(
            (radius) =>
              new Circle(NODE_DOT_RADIUS, {
                fill: QuantumAtom3DColors.nodeMarkerColorProperty,
                center: new Vector2(chartTransform.modelToViewX(radius), height),
              }),
          );
      },
    );
  }

  public override dispose(): void {
    this.probeLink?.dispose();
    this.multilink.dispose();
    this.axisProperty.dispose();
    super.dispose();
  }
}
