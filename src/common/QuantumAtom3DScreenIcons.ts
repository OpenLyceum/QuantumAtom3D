/** Screen-specific Scenery motifs; theme properties keep the navigation icons readable in both profiles. */

import { Shape } from "scenerystack/kite";
import { Circle, Line, Node, Path, Rectangle } from "scenerystack/scenery";
import { ArrowNode } from "scenerystack/scenery-phet";
import { ScreenIcon } from "scenerystack/sim";
import Colors from "../QuantumAtom3DColors.js";

const W = 548;
const H = 373;
const BLUE = Colors.radialCurveColorProperty;
const ORANGE = Colors.meanRadiusColorProperty;
function icon(...nodes: Node[]): ScreenIcon {
  return new ScreenIcon(
    new Node({ children: [new Rectangle(0, 0, W, H, { fill: Colors.backgroundColorProperty }), ...nodes] }),
    {
      maxIconWidthProportion: 1,
      maxIconHeightProportion: 1,
      fill: Colors.backgroundColorProperty,
    },
  );
}
function axis(): Line {
  return new Line(274, 40, 274, 333, { stroke: Colors.nodeMarkerColorProperty, lineWidth: 3 });
}
function lobe(x: number, y: number, positive: boolean, rotation = 0): Path {
  return new Path(Shape.ellipse(50, 67.5, 0), {
    fill: positive ? BLUE : ORANGE,
    rotation,
    centerX: x,
    centerY: y,
    opacity: 0.85,
  });
}
export function createOrbitalsIcon(): ScreenIcon {
  return icon(axis(), lobe(274, 112, true), lobe(274, 261, false));
}
export function createSuperpositionIcon(): ScreenIcon {
  return icon(
    new Circle(96, { centerX: 230, centerY: 187, fill: BLUE, opacity: 0.75 }),
    new Circle(69, { centerX: 337, centerY: 187, fill: ORANGE, opacity: 0.85 }),
    new ArrowNode(151, 305, 397, 305, {
      fill: Colors.textColorProperty,
      stroke: null,
      tailWidth: 4,
      headWidth: 22,
      headHeight: 24,
    }),
  );
}
export function createAngularMomentumIcon(): ScreenIcon {
  return icon(
    axis(),
    new Path(Shape.ellipse(110, 32.5, 0), { centerX: 274, centerY: 97, stroke: BLUE, lineWidth: 5 }),
    new Line(274, 285, 164, 97, { stroke: BLUE, lineWidth: 3, lineDash: [8, 6] }),
    new ArrowNode(274, 285, 384, 97, { fill: ORANGE, stroke: null, tailWidth: 8, headWidth: 26, headHeight: 30 }),
  );
}
export function createZeemanIcon(): ScreenIcon {
  return icon(
    new Line(90, 187, 210, 187, { stroke: Colors.textColorProperty, lineWidth: 7 }),
    ...[85, 187, 289].map(
      (y, i) =>
        new Line(330, y, 465, y, {
          stroke: i === 1 ? Colors.textColorProperty : i === 0 ? BLUE : ORANGE,
          lineWidth: 7,
        }),
    ),
    ...[85, 187, 289].map((y) => new Line(210, 187, 330, y, { stroke: Colors.nodeMarkerColorProperty, lineWidth: 3 })),
  );
}
export function createOscillatorIcon(): ScreenIcon {
  return icon(
    lobe(175, 111, true, -Math.PI / 4),
    lobe(175, 262, false, Math.PI / 4),
    ...[1, 2, 3, 4].flatMap((count) =>
      Array.from(
        { length: count },
        (_, i) =>
          new Line(320 + i * 36, 320 - count * 63, 345 + i * 36, 320 - count * 63, { stroke: BLUE, lineWidth: 7 }),
      ),
    ),
  );
}
