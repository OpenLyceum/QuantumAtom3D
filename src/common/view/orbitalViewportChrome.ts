/**
 * Pieces shared by the two 3D viewports (OrbitalViewportNode and InteractiveOrbitalCanvas): the
 * focusable application container, the pending-work notice, the orientation axes and the orbit steps.
 */
import type { TReadOnlyProperty } from "scenerystack/axon";
import { Bounds2 } from "scenerystack/dot";
import { Line, type Node, type NodeOptions, Text } from "scenerystack/scenery";
import { PhetFont } from "scenerystack/scenery-phet";
import { StringManager } from "../../i18n/StringManager.js";
import QuantumAtom3DColors from "../../QuantumAtom3DColors.js";
import type { Vec3 } from "./OrbitCamera.js";

/** Camera orbit per arrow-key press, in radians. */
export const KEYBOARD_ORBIT_ANGLE = Math.PI / 36;

/** Camera orbit per pixel of drag, in radians. */
export const DRAG_ORBIT_ANGLE = 0.008;

/** Options for a keyboard-operable square viewport of the given size, named by the volume strings. */
export function orbitalViewportOptions(size: number): NodeOptions {
  const strings = StringManager.getInstance().getOrbitalStrings().volume;
  return {
    tagName: "div",
    focusable: true,
    ariaRole: "application",
    cursor: "grab",
    accessibleName: strings.titleStringProperty,
    accessibleNameBehavior: (_node, options, name) => ({ ...options, ariaLabel: name }),
    accessibleHelpText: strings.helpStringProperty,
    mouseArea: new Bounds2(0, 0, size, size),
    touchArea: new Bounds2(0, 0, size, size),
  };
}

/** A status line in the viewport's top-left corner, shown and announced while work is pending. */
export function createPendingText(
  stringProperty: TReadOnlyProperty<string>,
  visibleProperty: TReadOnlyProperty<boolean>,
  size: number,
): Text {
  return new Text(stringProperty, {
    font: new PhetFont(12),
    fill: QuantumAtom3DColors.sliceNodeOverlayColorProperty,
    left: 10,
    top: 10,
    maxWidth: size - 20,
    visibleProperty,
    tagName: "p",
    accessibleParagraph: stringProperty,
  });
}

export type OrientationAxis = { readonly direction: Vec3; readonly line: Line; readonly label: Text };

/** Adds an unpositioned x/y/z line and label to `parent`; the caller lays them out from the camera. */
export function addOrientationAxes(parent: Node): OrientationAxis[] {
  return (["x", "y", "z"] as const).map((name, index) => {
    const direction: Vec3 = [index === 0 ? 1 : 0, index === 1 ? 1 : 0, index === 2 ? 1 : 0];
    const line = new Line(0, 0, 0, 0, { stroke: QuantumAtom3DColors.sliceNodeOverlayColorProperty, pickable: false });
    const label = new Text(name, {
      font: new PhetFont(12),
      fill: QuantumAtom3DColors.sliceNodeOverlayColorProperty,
      pickable: false,
    });
    parent.addChild(line);
    parent.addChild(label);
    return { direction, line, label };
  });
}
