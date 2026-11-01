/** Probability heatmap |<Cartesian|spherical>|², with selected row and column. */
import { Multilink, type UnknownMultilink } from "scenerystack/axon";
import { Node, Rectangle, Text } from "scenerystack/scenery";
import { PhetFont } from "scenerystack/scenery-phet";
import {
  cartesianExpansion,
  cartesianStates,
  sphericalStates,
} from "../../common/model/oscillator/OscillatorStates.js";
import QuantumAtom3DColors from "../../QuantumAtom3DColors.js";
import type { OscillatorModel } from "../model/OscillatorModel.js";

const CELL = 19;
export class BasisOverlapNode extends Node {
  private readonly link: UnknownMultilink;
  public constructor(model: OscillatorModel) {
    const layer = new Node();
    super({ children: [layer] });
    this.link = Multilink.multilink(
      [model.shellProperty, model.cartesianIndexProperty, model.sphericalIndexProperty],
      (N, row, column) => {
        for (const child of layer.children.slice()) {
          child.disposeSubtree();
        }
        layer.children = [];
        const cart = cartesianStates(N);
        const sphere = sphericalStates(N);
        sphere.forEach((state, j) => {
          layer.addChild(
            new Text(`${state.nr},${state.l},${state.m}`, {
              font: new PhetFont(9),
              fill: QuantumAtom3DColors.textColorProperty,
              rotation: -Math.PI / 2,
              centerX: 70 + (j + 0.5) * CELL,
              bottom: 35,
            }),
          );
        });
        cart.forEach((state, i) => {
          layer.addChild(
            new Text(state.join(","), {
              font: new PhetFont(10),
              fill: QuantumAtom3DColors.textColorProperty,
              right: 60,
              centerY: 45 + (i + 0.5) * CELL,
            }),
          );
          const expansion = cartesianExpansion(state);
          sphere.forEach((s, j) => {
            const coefficient = expansion.find((t) => t.n === s.nr && t.l === s.l && t.m === s.m);
            const probability = coefficient ? coefficient.re ** 2 + coefficient.im ** 2 : 0;
            layer.addChild(
              new Rectangle(70 + j * CELL, 45 + i * CELL, CELL - 1, CELL - 1, {
                fill: QuantumAtom3DColors.accentColorProperty,
                opacity: 0.06 + 0.94 * Math.max(0, Math.min(1, probability)),
              }),
            );
          });
        });
        layer.addChild(
          new Rectangle(69, 44 + row * CELL, cart.length * CELL + 1, CELL + 1, {
            stroke: QuantumAtom3DColors.meanRadiusColorProperty,
            lineWidth: 1.5,
            pickable: false,
          }),
        );
        layer.addChild(
          new Rectangle(69 + column * CELL, 44, CELL + 1, cart.length * CELL + 1, {
            stroke: QuantumAtom3DColors.radialCurveColorProperty,
            lineWidth: 1.5,
            pickable: false,
          }),
        );
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
