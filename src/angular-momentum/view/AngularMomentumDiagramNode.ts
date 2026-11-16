/** Scenery projection of the schematic quantum vector model; no GPU required. */
import { Multilink, type UnknownMultilink } from "scenerystack/axon";
import { Shape } from "scenerystack/kite";
import { Line, Node, Path, Rectangle, Text } from "scenerystack/scenery";
import { ArrowNode, PhetFont } from "scenerystack/scenery-phet";
import {
  type AngularVector,
  angularMagnitude,
  coupledVectors,
  orbitalVector,
} from "../../common/model/angular/VectorModel.js";
import { orbitCameraFrame, projectToScreen } from "../../common/view/OrbitCamera.js";
import QuantumAtom3DColors from "../../QuantumAtom3DColors.js";
import { ANGULAR_MOMENTUM_DIAGRAM_NODE_SETTINGS } from "../../QuantumAtom3DConstants.js";
import type { AngularMomentumModel } from "../model/AngularMomentumModel.js";

function projectedCurve(project: (angle: number) => { x: number; y: number }): Shape {
  const shape = new Shape();
  for (let i = 0; i <= 120; i++) {
    const p = project((2 * Math.PI * i) / 120);
    if (i === 0) {
      shape.moveTo(p.x, p.y);
    } else {
      shape.lineTo(p.x, p.y);
    }
  }
  return shape;
}
export class AngularMomentumDiagramNode extends Node {
  private readonly link: UnknownMultilink;
  public constructor(model: AngularMomentumModel) {
    const frame = orbitCameraFrame(0.65, 0.3);
    const cone = new Path(null, {
      stroke: QuantumAtom3DColors.nodeMarkerColorProperty,
      lineDash: [
        ANGULAR_MOMENTUM_DIAGRAM_NODE_SETTINGS.CONE_LINE_DASH_DASH,
        ANGULAR_MOMENTUM_DIAGRAM_NODE_SETTINGS.CONSTRUCTOR_CONE_LINE_DASH_DASH,
      ],
    });
    const innerCone = new Path(null, {
      stroke: QuantumAtom3DColors.radialCurveColorProperty,
      lineDash: [
        ANGULAR_MOMENTUM_DIAGRAM_NODE_SETTINGS.INNER_CONE_LINE_DASH_DASH,
        ANGULAR_MOMENTUM_DIAGRAM_NODE_SETTINGS.CONSTRUCTOR_INNER_CONE_LINE_DASH_DASH,
      ],
    });
    const axis = new Line(
      ANGULAR_MOMENTUM_DIAGRAM_NODE_SETTINGS.AXIS_START_X,
      ANGULAR_MOMENTUM_DIAGRAM_NODE_SETTINGS.AXIS_START_Y,
      ANGULAR_MOMENTUM_DIAGRAM_NODE_SETTINGS.AXIS_END_X,
      ANGULAR_MOMENTUM_DIAGRAM_NODE_SETTINGS.AXIS_END_Y,
      { stroke: QuantumAtom3DColors.textColorProperty },
    );
    const axisLabel = new Text("z", {
      font: new PhetFont(ANGULAR_MOMENTUM_DIAGRAM_NODE_SETTINGS.AXIS_LABEL_FONT_SIZE),
      fill: QuantumAtom3DColors.textColorProperty,
      left: ANGULAR_MOMENTUM_DIAGRAM_NODE_SETTINGS.AXIS_LABEL_LEFT,
      top: ANGULAR_MOMENTUM_DIAGRAM_NODE_SETTINGS.AXIS_LABEL_TOP,
    });
    const colors = [
      QuantumAtom3DColors.radialCurveColorProperty,
      QuantumAtom3DColors.meanRadiusColorProperty,
      QuantumAtom3DColors.textColorProperty,
    ];
    const arrows = colors.map(
      (fill) =>
        new ArrowNode(0, 0, 1, 1, {
          fill,
          stroke: null,
          tailWidth: ANGULAR_MOMENTUM_DIAGRAM_NODE_SETTINGS.ARROWS_TAIL_WIDTH,
          headWidth: ANGULAR_MOMENTUM_DIAGRAM_NODE_SETTINGS.ARROWS_HEAD_WIDTH,
          headHeight: ANGULAR_MOMENTUM_DIAGRAM_NODE_SETTINGS.ARROWS_HEAD_HEIGHT,
        }),
    );
    const labels = ["L", "S", "J"].map(
      (name, index) =>
        new Text(name, {
          font: new PhetFont({ size: ANGULAR_MOMENTUM_DIAGRAM_NODE_SETTINGS.LABELS_FONT_SIZE, weight: "bold" }),
          fill: colors[index] ?? QuantumAtom3DColors.textColorProperty,
        }),
    );
    const ladder = new Node();
    super({
      children: [
        new Rectangle(
          0,
          0,
          ANGULAR_MOMENTUM_DIAGRAM_NODE_SETTINGS.CONSTRUCTOR_WIDTH,
          ANGULAR_MOMENTUM_DIAGRAM_NODE_SETTINGS.CONSTRUCTOR_HEIGHT,
          {
            fill: QuantumAtom3DColors.chartBackgroundColorProperty,
            stroke: QuantumAtom3DColors.sliceFrameColorProperty,
          },
        ),
        axis,
        axisLabel,
        cone,
        innerCone,
        ladder,
        ...arrows,
        ...labels,
      ],
    });
    let lastQuantum = -1;
    let lastSelected = Infinity;
    let lastScale = 0;
    this.link = Multilink.multilink(
      [
        model.lProperty,
        model.mProperty,
        model.spinProperty,
        model.jProperty,
        model.mjProperty,
        model.phaseProperty,
        model.vectorsProperty,
      ],
      (l, m, spin, j, mj, phase, vectors) => {
        const scale = 140 / Math.max(1, angularMagnitude(spin ? j : l), angularMagnitude(l));
        const point = (v: AngularVector) => {
          const [x, y] = projectToScreen(frame, v);
          return {
            x: ANGULAR_MOMENTUM_DIAGRAM_NODE_SETTINGS.POINT_X_OFFSET + x * scale,
            y: ANGULAR_MOMENTUM_DIAGRAM_NODE_SETTINGS.POINT_Y_OFFSET - y * scale,
          };
        };
        cone.shape = projectedCurve((angle) => point(orbitalVector(spin ? j : l, spin ? mj : m, angle)));
        innerCone.shape = spin
          ? projectedCurve((angle) => point(coupledVectors(l, j, mj, phase, angle).orbital))
          : new Shape();
        const ends = [vectors.orbital, vectors.total, vectors.total];
        const starts = [
          { x: ANGULAR_MOMENTUM_DIAGRAM_NODE_SETTINGS.STARTS_X, y: ANGULAR_MOMENTUM_DIAGRAM_NODE_SETTINGS.STARTS_Y },
          point(vectors.orbital),
          { x: ANGULAR_MOMENTUM_DIAGRAM_NODE_SETTINGS.STARTS_X, y: ANGULAR_MOMENTUM_DIAGRAM_NODE_SETTINGS.STARTS_Y },
        ];
        arrows.forEach((arrow, index) => {
          const end = point(ends[index] ?? vectors.orbital);
          const start = starts[index] ?? starts[0];
          const visible =
            (index === 0 ? l > 0 : spin) && Math.hypot(end.x - (start?.x ?? 0), end.y - (start?.y ?? 0)) > 0.1;
          arrow.visible = visible;
          const label = labels[index];
          if (label) {
            label.visible = visible;
            label.left =
              index === 1 && start
                ? (start.x + end.x) / 2 - ANGULAR_MOMENTUM_DIAGRAM_NODE_SETTINGS.SPIN_LABEL_MIDPOINT_X_OFFSET
                : end.x + ANGULAR_MOMENTUM_DIAGRAM_NODE_SETTINGS.CONSTRUCTOR_LEFT_OFFSET;
            label.top =
              index === 1 && start
                ? (start.y + end.y) / 2 - ANGULAR_MOMENTUM_DIAGRAM_NODE_SETTINGS.CONSTRUCTOR_TOP_OFFSET
                : end.y - ANGULAR_MOMENTUM_DIAGRAM_NODE_SETTINGS.CONSTRUCTOR_TOP_OFFSET;
          }
          if (visible && start) {
            arrow.setTailAndTip(start.x, start.y, end.x, end.y);
          }
        });
        const quantum = spin ? j : l;
        const selected = spin ? mj : m;
        if (quantum === lastQuantum && selected === lastSelected && scale === lastScale) {
          return;
        }
        lastQuantum = quantum;
        lastSelected = selected;
        lastScale = scale;
        for (const child of ladder.children.slice()) {
          child.dispose();
        }
        ladder.children = [];
        for (let value = -quantum; value <= quantum; value++) {
          const y = 205 - value * scale * frame.up[2];
          ladder.addChild(
            new Line(
              ANGULAR_MOMENTUM_DIAGRAM_NODE_SETTINGS.LINK_START_X,
              y,
              ANGULAR_MOMENTUM_DIAGRAM_NODE_SETTINGS.LINK_END_X,
              y,
              {
                stroke:
                  value === selected
                    ? QuantumAtom3DColors.meanRadiusColorProperty
                    : QuantumAtom3DColors.chartGridColorProperty,
                lineWidth: value === selected ? ANGULAR_MOMENTUM_DIAGRAM_NODE_SETTINGS.CONSTRUCTOR_LINE_WIDTH : 1,
              },
            ),
          );
          ladder.addChild(
            new Text(`${value}`, {
              font: new PhetFont(ANGULAR_MOMENTUM_DIAGRAM_NODE_SETTINGS.LINK_FONT_SIZE),
              fill: QuantumAtom3DColors.textColorProperty,
              left: ANGULAR_MOMENTUM_DIAGRAM_NODE_SETTINGS.LINK_LEFT,
              centerY: y,
            }),
          );
        }
      },
    );
  }
  public override dispose(): void {
    this.link.dispose();
    for (const child of this.children.slice()) {
      child.disposeSubtree();
    }
    super.dispose();
  }
}
