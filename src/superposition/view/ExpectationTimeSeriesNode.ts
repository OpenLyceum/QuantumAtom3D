import { Multilink, type UnknownMultilink } from "scenerystack/axon";
import { ChartRectangle, ChartTransform, LinePlot } from "scenerystack/bamboo";
import { Range, Vector2 } from "scenerystack/dot";
import { Circle, HBox, Line, Node, Text } from "scenerystack/scenery";
import { PhetFont } from "scenerystack/scenery-phet";
import { atomicTimeToFs } from "../../common/model/AtomicUnits.js";
import { StringManager } from "../../i18n/StringManager.js";
import QuantumAtom3DColors from "../../QuantumAtom3DColors.js";
import type { SuperpositionModel } from "../model/SuperpositionModel.js";

export class ExpectationTimeSeriesNode extends Node {
  private readonly link: UnknownMultilink;
  public constructor(width: number, height: number, model: SuperpositionModel) {
    const strings = StringManager.getInstance().getSuperpositionStrings();
    const chart = new ChartTransform({
      viewWidth: width,
      viewHeight: height,
      modelXRange: new Range(0, 1),
      modelYRange: new Range(-1, 5),
    });
    const rPlot = new LinePlot(chart, [], { stroke: QuantumAtom3DColors.radialCurveColorProperty, lineWidth: 2 });
    const zPlot = new LinePlot(chart, [], { stroke: QuantumAtom3DColors.meanRadiusColorProperty, lineWidth: 2 });
    const title = new HBox({
      spacing: 20,
      children: [
        new Text(strings.meanRadiusStringProperty, {
          font: new PhetFont(13),
          fill: QuantumAtom3DColors.radialCurveColorProperty,
        }),
        new Text(strings.meanZStringProperty, {
          font: new PhetFont(13),
          fill: QuantumAtom3DColors.meanRadiusColorProperty,
        }),
      ],
      bottom: -5,
    });
    const timeLabel = new Text("", {
      font: new PhetFont(12),
      fill: QuantumAtom3DColors.textColorProperty,
      top: height + 5,
    });
    const zeroLine = new Line(0, height / 2, width, height / 2, { stroke: QuantumAtom3DColors.chartGridColorProperty });
    const rDot = new Circle(3, { fill: QuantumAtom3DColors.radialCurveColorProperty });
    const zDot = new Circle(3, { fill: QuantumAtom3DColors.meanRadiusColorProperty });
    const yLabels = [-1, 0, 1].map(
      () => new Text("", { font: new PhetFont(10), fill: QuantumAtom3DColors.textColorProperty }),
    );
    super({
      children: [
        new ChartRectangle(chart, {
          fill: QuantumAtom3DColors.chartBackgroundColorProperty,
          stroke: QuantumAtom3DColors.sliceFrameColorProperty,
        }),
        rPlot,
        zPlot,
        zeroLine,
        rDot,
        zDot,
        ...yLabels,
        title,
        timeLabel,
      ],
    });
    let previousTime = -1;
    let lastTerms = model.termsProperty.value;
    let lastCharge = model.nuclearChargeProperty.value;
    let samples: { t: number; r: number; z: number }[] = [];
    this.link = Multilink.multilink(
      [
        model.timeProperty,
        model.expectationsProperty,
        model.termsProperty,
        model.nuclearChargeProperty,
        strings.timeAxisStringProperty,
      ],
      (time, values, terms, charge, axis) => {
        if (time < previousTime || terms !== lastTerms || charge !== lastCharge) {
          samples = [];
        }
        previousTime = time;
        lastTerms = terms;
        lastCharge = charge;
        if (samples[samples.length - 1]?.t === time) {
          samples.pop();
        }
        samples.push({ t: time, ...values });
        samples = samples.slice(-600);
        const start = samples[0]?.t ?? 0;
        const end = Math.max(start + 1, time);
        const max = Math.max(1, ...samples.map((s) => Math.max(s.r, Math.abs(s.z)))) * 1.15;
        chart.setModelXRange(new Range(atomicTimeToFs(start), atomicTimeToFs(end)));
        chart.setModelYRange(new Range(-max, max));
        [-max, 0, max].forEach((value, index) => {
          const label = yLabels[index];
          if (label) {
            label.string = value.toFixed(1);
            label.right = -4;
            label.centerY = chart.modelToViewY(value);
          }
        });
        rDot.center = new Vector2(chart.modelToViewX(atomicTimeToFs(time)), chart.modelToViewY(values.r));
        zDot.center = new Vector2(chart.modelToViewX(atomicTimeToFs(time)), chart.modelToViewY(values.z));
        rPlot.setDataSet(samples.map((s) => new Vector2(atomicTimeToFs(s.t), s.r)));
        zPlot.setDataSet(samples.map((s) => new Vector2(atomicTimeToFs(s.t), s.z)));
        timeLabel.string = `${axis}: ${atomicTimeToFs(start).toFixed(3)} – ${atomicTimeToFs(end).toFixed(3)}`;
      },
    );
  }
  public override dispose(): void {
    this.link.dispose();
    super.dispose();
  }
}
