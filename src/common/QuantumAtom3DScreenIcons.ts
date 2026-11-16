import { QUANTUM_ATOM_3D_SCREEN_ICONS_SETTINGS } from "../QuantumAtom3DConstants.js";
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
  return new Line(
    QUANTUM_ATOM_3D_SCREEN_ICONS_SETTINGS.AXIS_START_X,
    QUANTUM_ATOM_3D_SCREEN_ICONS_SETTINGS.AXIS_START_Y,
    QUANTUM_ATOM_3D_SCREEN_ICONS_SETTINGS.AXIS_END_X,
    QUANTUM_ATOM_3D_SCREEN_ICONS_SETTINGS.AXIS_END_Y,
    { stroke: Colors.nodeMarkerColorProperty, lineWidth: QUANTUM_ATOM_3D_SCREEN_ICONS_SETTINGS.AXIS_LINE_WIDTH },
  );
}
function lobe(x: number, y: number, positive: boolean, rotation = 0): Path {
  return new Path(
    Shape.ellipse(
      QUANTUM_ATOM_3D_SCREEN_ICONS_SETTINGS.LOBE_CENTER_X,
      QUANTUM_ATOM_3D_SCREEN_ICONS_SETTINGS.LOBE_CENTER_Y,
      0,
    ),
    {
      fill: positive ? BLUE : ORANGE,
      rotation,
      centerX: x,
      centerY: y,
      opacity: QUANTUM_ATOM_3D_SCREEN_ICONS_SETTINGS.LOBE_OPACITY,
    },
  );
}
export function createOrbitalsIcon(): ScreenIcon {
  return icon(axis(), lobe(274, 112, true), lobe(274, 261, false));
}
export function createSuperpositionIcon(): ScreenIcon {
  return icon(
    new Circle(QUANTUM_ATOM_3D_SCREEN_ICONS_SETTINGS.CREATE_SUPERPOSITION_ICON_RADIUS, {
      centerX: QUANTUM_ATOM_3D_SCREEN_ICONS_SETTINGS.CREATE_SUPERPOSITION_ICON_CENTER_X,
      centerY: QUANTUM_ATOM_3D_SCREEN_ICONS_SETTINGS.CREATE_SUPERPOSITION_ICON_CENTER_Y,
      fill: BLUE,
      opacity: QUANTUM_ATOM_3D_SCREEN_ICONS_SETTINGS.CREATE_SUPERPOSITION_ICON_OPACITY,
    }),
    new Circle(QUANTUM_ATOM_3D_SCREEN_ICONS_SETTINGS.CREATE_SUPERPOSITION_ICON_RADIUS_SEGMENT_2, {
      centerX: QUANTUM_ATOM_3D_SCREEN_ICONS_SETTINGS.CREATE_SUPERPOSITION_ICON_CENTER_X_VARIANT_2,
      centerY: QUANTUM_ATOM_3D_SCREEN_ICONS_SETTINGS.CREATE_SUPERPOSITION_ICON_CENTER_Y,
      fill: ORANGE,
      opacity: QUANTUM_ATOM_3D_SCREEN_ICONS_SETTINGS.CREATE_SUPERPOSITION_ICON_OPACITY_VARIANT_2,
    }),
    new ArrowNode(
      QUANTUM_ATOM_3D_SCREEN_ICONS_SETTINGS.CREATE_SUPERPOSITION_ICON_START_X,
      QUANTUM_ATOM_3D_SCREEN_ICONS_SETTINGS.CREATE_SUPERPOSITION_ICON_START_Y,
      QUANTUM_ATOM_3D_SCREEN_ICONS_SETTINGS.CREATE_SUPERPOSITION_ICON_END_X,
      QUANTUM_ATOM_3D_SCREEN_ICONS_SETTINGS.CREATE_SUPERPOSITION_ICON_END_Y,
      {
        fill: Colors.textColorProperty,
        stroke: null,
        tailWidth: QUANTUM_ATOM_3D_SCREEN_ICONS_SETTINGS.CREATE_SUPERPOSITION_ICON_TAIL_WIDTH,
        headWidth: QUANTUM_ATOM_3D_SCREEN_ICONS_SETTINGS.CREATE_SUPERPOSITION_ICON_HEAD_WIDTH,
        headHeight: QUANTUM_ATOM_3D_SCREEN_ICONS_SETTINGS.CREATE_SUPERPOSITION_ICON_HEAD_HEIGHT,
      },
    ),
  );
}
export function createAngularMomentumIcon(): ScreenIcon {
  return icon(
    axis(),
    new Path(
      Shape.ellipse(
        QUANTUM_ATOM_3D_SCREEN_ICONS_SETTINGS.CREATE_ANGULAR_MOMENTUM_ICON_CENTER_X,
        QUANTUM_ATOM_3D_SCREEN_ICONS_SETTINGS.CREATE_ANGULAR_MOMENTUM_ICON_CENTER_Y,
        0,
      ),
      {
        centerX: QUANTUM_ATOM_3D_SCREEN_ICONS_SETTINGS.CREATE_ANGULAR_MOMENTUM_ICON_CENTER_X_VARIANT_2,
        centerY: QUANTUM_ATOM_3D_SCREEN_ICONS_SETTINGS.CREATE_ANGULAR_MOMENTUM_ICON_CENTER_Y_VARIANT_2,
        stroke: BLUE,
        lineWidth: QUANTUM_ATOM_3D_SCREEN_ICONS_SETTINGS.CREATE_ANGULAR_MOMENTUM_ICON_LINE_WIDTH,
      },
    ),
    new Line(
      QUANTUM_ATOM_3D_SCREEN_ICONS_SETTINGS.CREATE_ANGULAR_MOMENTUM_ICON_START_X,
      QUANTUM_ATOM_3D_SCREEN_ICONS_SETTINGS.CREATE_ANGULAR_MOMENTUM_ICON_START_Y,
      QUANTUM_ATOM_3D_SCREEN_ICONS_SETTINGS.CREATE_ANGULAR_MOMENTUM_ICON_END_X,
      QUANTUM_ATOM_3D_SCREEN_ICONS_SETTINGS.CREATE_ANGULAR_MOMENTUM_ICON_END_Y,
      {
        stroke: BLUE,
        lineWidth: QUANTUM_ATOM_3D_SCREEN_ICONS_SETTINGS.CREATE_ANGULAR_MOMENTUM_ICON_LINE_WIDTH_VARIANT_2,
        lineDash: [
          QUANTUM_ATOM_3D_SCREEN_ICONS_SETTINGS.ANGULAR_MOMENTUM_DASH_LENGTH,
          QUANTUM_ATOM_3D_SCREEN_ICONS_SETTINGS.CREATE_ANGULAR_MOMENTUM_ICON_LINE_DASH_DASH,
        ],
      },
    ),
    new ArrowNode(
      QUANTUM_ATOM_3D_SCREEN_ICONS_SETTINGS.CREATE_ANGULAR_MOMENTUM_ICON_START_X,
      QUANTUM_ATOM_3D_SCREEN_ICONS_SETTINGS.CREATE_ANGULAR_MOMENTUM_ICON_START_Y,
      QUANTUM_ATOM_3D_SCREEN_ICONS_SETTINGS.CREATE_ANGULAR_MOMENTUM_ICON_START_X_ARROW_NODE_END_X,
      QUANTUM_ATOM_3D_SCREEN_ICONS_SETTINGS.CREATE_ANGULAR_MOMENTUM_ICON_END_Y,
      {
        fill: ORANGE,
        stroke: null,
        tailWidth: QUANTUM_ATOM_3D_SCREEN_ICONS_SETTINGS.CREATE_ANGULAR_MOMENTUM_ICON_TAIL_WIDTH,
        headWidth: QUANTUM_ATOM_3D_SCREEN_ICONS_SETTINGS.CREATE_ANGULAR_MOMENTUM_ICON_HEAD_WIDTH,
        headHeight: QUANTUM_ATOM_3D_SCREEN_ICONS_SETTINGS.CREATE_ANGULAR_MOMENTUM_ICON_HEAD_HEIGHT,
      },
    ),
  );
}
export function createZeemanIcon(): ScreenIcon {
  return icon(
    new Line(
      QUANTUM_ATOM_3D_SCREEN_ICONS_SETTINGS.CREATE_ZEEMAN_ICON_START_X,
      QUANTUM_ATOM_3D_SCREEN_ICONS_SETTINGS.CREATE_ZEEMAN_ICON_START_Y,
      QUANTUM_ATOM_3D_SCREEN_ICONS_SETTINGS.CREATE_ZEEMAN_ICON_END_X,
      QUANTUM_ATOM_3D_SCREEN_ICONS_SETTINGS.CREATE_ZEEMAN_ICON_END_Y,
      {
        stroke: Colors.textColorProperty,
        lineWidth: QUANTUM_ATOM_3D_SCREEN_ICONS_SETTINGS.CREATE_ZEEMAN_ICON_LINE_WIDTH,
      },
    ),
    ...[85, 187, 289].map(
      (y, i) =>
        new Line(
          QUANTUM_ATOM_3D_SCREEN_ICONS_SETTINGS.CREATE_ZEEMAN_ICON_START_X_SEGMENT_2,
          y,
          QUANTUM_ATOM_3D_SCREEN_ICONS_SETTINGS.CREATE_ZEEMAN_ICON_END_X_SEGMENT_2,
          y,
          {
            stroke: i === 1 ? Colors.textColorProperty : i === 0 ? BLUE : ORANGE,
            lineWidth: QUANTUM_ATOM_3D_SCREEN_ICONS_SETTINGS.CREATE_ZEEMAN_ICON_LINE_WIDTH,
          },
        ),
    ),
    ...[85, 187, 289].map(
      (y) =>
        new Line(
          QUANTUM_ATOM_3D_SCREEN_ICONS_SETTINGS.CREATE_ZEEMAN_ICON_START_X_SEGMENT_3,
          QUANTUM_ATOM_3D_SCREEN_ICONS_SETTINGS.CREATE_ZEEMAN_ICON_START_Y,
          QUANTUM_ATOM_3D_SCREEN_ICONS_SETTINGS.CREATE_ZEEMAN_ICON_END_X_SEGMENT_3,
          y,
          {
            stroke: Colors.nodeMarkerColorProperty,
            lineWidth: QUANTUM_ATOM_3D_SCREEN_ICONS_SETTINGS.CREATE_ZEEMAN_ICON_LINE_WIDTH_VARIANT_2,
          },
        ),
    ),
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
          new Line(320 + i * 36, 320 - count * 63, 345 + i * 36, 320 - count * 63, {
            stroke: BLUE,
            lineWidth: QUANTUM_ATOM_3D_SCREEN_ICONS_SETTINGS.CREATE_OSCILLATOR_ICON_LINE_WIDTH,
          }),
      ),
    ),
  );
}
