/** Polar density per solid angle, with spin traced out in the coupled basis. Radius is normalized to its peak. */
import { Multilink, type UnknownMultilink } from "scenerystack/axon";
import { Shape } from "scenerystack/kite";
import { Circle, Line, Node, Path, Text } from "scenerystack/scenery";
import { PhetFont } from "scenerystack/scenery-phet";
import { coupledAngularWeights } from "../../common/model/angular/VectorModel.js";
import { sphericalHarmonicTheta } from "../../common/model/math/sphericalHarmonics.js";
import QuantumAtom3DColors from "../../QuantumAtom3DColors.js";
import type { AngularMomentumModel } from "../model/AngularMomentumModel.js";
export class AngularDensityNode extends Node {
  private readonly link: UnknownMultilink;
  public constructor(model: AngularMomentumModel) {
    const curve = new Path(null, { stroke: QuantumAtom3DColors.radialCurveColorProperty, lineWidth: 2 });
    super({
      children: [
        new Circle(90, {
          centerX: 100,
          centerY: 100,
          stroke: QuantumAtom3DColors.chartGridColorProperty,
          lineDash: [4, 4],
        }),
        new Line(100, 5, 100, 195, { stroke: QuantumAtom3DColors.chartGridColorProperty }),
        curve,
        new Text("z", { font: new PhetFont(12), fill: QuantumAtom3DColors.textColorProperty, left: 105, top: 0 }),
      ],
    });
    this.link = Multilink.multilink(
      [model.lProperty, model.mProperty, model.spinProperty, model.jProperty, model.mjProperty],
      (l, m, spin, j, mj) => {
        const weights = spin ? coupledAngularWeights(l, j, mj) : [{ m, weight: 1 }];
        const values = Array.from({ length: 361 }, (_, i) =>
          weights.reduce(
            (sum, entry) =>
              sum + entry.weight * sphericalHarmonicTheta(l, entry.m, Math.cos((2 * Math.PI * i) / 360)) ** 2,
            0,
          ),
        );
        const peak = Math.max(...values);
        const shape = new Shape();
        values.forEach((value, i) => {
          const angle = (2 * Math.PI * i) / 360;
          const r = peak > 0 ? (90 * value) / peak : 0;
          const x = 100 + r * Math.sin(angle);
          const y = 100 - r * Math.cos(angle);
          if (i === 0) {
            shape.moveTo(x, y);
          } else {
            shape.lineTo(x, y);
          }
        });
        curve.shape = shape;
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
