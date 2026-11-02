/** Probability heatmap |<Cartesian|spherical>|². Reuse its cells instead of rebuilding on selection. */
import { Multilink, type UnknownMultilink } from "scenerystack/axon";
import { Node, Rectangle, Text } from "scenerystack/scenery";
import { PhetFont } from "scenerystack/scenery-phet";
import {
  cartesianExpansion,
  cartesianStates,
  oscillatorDegeneracy,
  sphericalStates,
} from "../../common/model/oscillator/OscillatorStates.js";
import QuantumAtom3DColors from "../../QuantumAtom3DColors.js";
import type { OscillatorModel } from "../model/OscillatorModel.js";

const CELL = 19;
const MAX_STATES = oscillatorDegeneracy(4);
const matrices = new Map<number, Float64Array>();
function matrix(N: number): Float64Array {
  const cached = matrices.get(N);
  if (cached) {
    return cached;
  }
  const cart = cartesianStates(N),
    sphere = sphericalStates(N);
  const values = new Float64Array(cart.length * sphere.length);
  cart.forEach((state, i) => {
    const terms = cartesianExpansion(state);
    sphere.forEach((s, j) => {
      const c = terms.find((t) => t.n === s.nr && t.l === s.l && t.m === s.m);
      values[i * sphere.length + j] = c ? c.re * c.re + c.im * c.im : 0;
    });
  });
  matrices.set(N, values);
  return values;
}
export class BasisOverlapNode extends Node {
  private readonly links: UnknownMultilink[];
  public constructor(model: OscillatorModel) {
    const cells = Array.from(
      { length: MAX_STATES * MAX_STATES },
      (_, i) =>
        new Rectangle(70 + (i % MAX_STATES) * CELL, 45 + Math.floor(i / MAX_STATES) * CELL, CELL - 1, CELL - 1, {
          fill: QuantumAtom3DColors.accentColorProperty,
        }),
    );
    const rows = Array.from(
      { length: MAX_STATES },
      () => new Text("", { font: new PhetFont(10), fill: QuantumAtom3DColors.textColorProperty }),
    );
    const columns = Array.from(
      { length: MAX_STATES },
      () =>
        new Text("", { font: new PhetFont(9), fill: QuantumAtom3DColors.textColorProperty, rotation: -Math.PI / 2 }),
    );
    const selectedRow = new Rectangle(0, 0, 1, 1, {
      stroke: QuantumAtom3DColors.meanRadiusColorProperty,
      lineWidth: 1.5,
      pickable: false,
    });
    const selectedColumn = new Rectangle(0, 0, 1, 1, {
      stroke: QuantumAtom3DColors.radialCurveColorProperty,
      lineWidth: 1.5,
      pickable: false,
    });
    super({
      children: [...cells, ...rows, ...columns, selectedRow, selectedColumn],
      excludeInvisibleChildrenFromBounds: true,
    });
    // Precompute the finite set during loading, rather than during a shell gesture.
    for (let N = 0; N <= 4; N++) {
      matrix(N);
    }
    this.links = [
      Multilink.multilink([model.shellProperty], (N) => {
        const cart = cartesianStates(N),
          sphere = sphericalStates(N),
          values = matrix(N),
          size = cart.length;
        cells.forEach((cell, index) => {
          const i = Math.floor(index / MAX_STATES),
            j = index % MAX_STATES;
          cell.visible = i < size && j < size;
          if (cell.visible) {
            cell.opacity = 0.06 + 0.94 * Math.max(0, Math.min(1, values[i * size + j] ?? 0));
          }
        });
        rows.forEach((label, i) => {
          label.visible = i < size;
          label.string = cart[i]?.join(",") ?? "";
          label.right = 60;
          label.centerY = 45 + (i + 0.5) * CELL;
        });
        columns.forEach((label, j) => {
          const s = sphere[j];
          label.visible = !!s;
          label.string = s ? `${s.nr},${s.l},${s.m}` : "";
          label.centerX = 70 + (j + 0.5) * CELL;
          label.bottom = 35;
        });
      }),
      Multilink.multilink(
        [model.shellProperty, model.cartesianIndexProperty, model.sphericalIndexProperty],
        (N, row, column) => {
          const size = oscillatorDegeneracy(N);
          selectedRow.setRect(69, 44 + row * CELL, size * CELL + 1, CELL + 1);
          selectedColumn.setRect(69 + column * CELL, 44, CELL + 1, size * CELL + 1);
        },
      ),
    ];
  }
  public override dispose(): void {
    for (const link of this.links) {
      link.dispose();
    }
    for (const child of this.children.slice()) {
      child.disposeSubtree();
    }
    super.dispose();
  }
}
