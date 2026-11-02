/** Shared canvas/camera boundary for time-dependent orbital screens. Scene construction stays outside. */
import {
  BooleanProperty,
  Multilink,
  type NumberProperty,
  type TReadOnlyProperty,
  type UnknownMultilink,
} from "scenerystack/axon";
import type { Vector2 } from "scenerystack/dot";
import { DragListener, Image, KeyboardListener, Node, type OneKeyStroke, Rectangle } from "scenerystack/scenery";
import { StringManager } from "../../i18n/StringManager.js";
import type { RenderQuality } from "../../preferences/QuantumAtom3DPreferencesModel.js";
import QuantumAtom3DColors from "../../QuantumAtom3DColors.js";
import { createOrbitalRenderer } from "../gpu/createOrbitalRenderer.js";
import { OrbitalHotkeyData } from "./OrbitalHotkeyData.js";
import { OrbitCamera, projectToScreen } from "./OrbitCamera.js";
import {
  addOrientationAxes,
  createPendingText,
  DRAG_ORBIT_ANGLE,
  KEYBOARD_ORBIT_ANGLE,
  orbitalViewportOptions,
} from "./orbitalViewportChrome.js";

export class InteractiveOrbitalCanvas extends Node {
  public readonly samplingPendingProperty = new BooleanProperty(false);
  public readonly surfacePendingProperty = new BooleanProperty(false);
  public readonly engine = createOrbitalRenderer();
  public readonly camera = new OrbitCamera();
  private readonly canvasImage: Image;
  private readonly cameraLink: UnknownMultilink;
  private readonly drag: DragListener;
  private readonly keys: KeyboardListener<readonly OneKeyStroke[]>;
  private readonly quality: TReadOnlyProperty<RenderQuality> | undefined;
  public constructor(size: number, zoom: NumberProperty, quality?: TReadOnlyProperty<RenderQuality>) {
    const strings = StringManager.getInstance().getOrbitalStrings().volume;
    super(orbitalViewportOptions(size));
    this.quality = quality;
    this.canvasImage = new Image(this.engine.canvas, { scale: size / this.engine.canvas.width, pickable: false });
    this.children = [
      this.canvasImage,
      new Rectangle(0, 0, size, size, {
        stroke: QuantumAtom3DColors.sliceFrameColorProperty,
        lineWidth: 1.5,
        pickable: false,
      }),
    ];
    this.addChild(createPendingText(strings.surfacePendingStringProperty, this.surfacePendingProperty, size));
    this.addChild(createPendingText(strings.samplingPendingStringProperty, this.samplingPendingProperty, size));
    const axes = addOrientationAxes(this);
    this.cameraLink = Multilink.multilink([this.camera.yawProperty, this.camera.pitchProperty], () => {
      this.engine.setCamera(this.camera.frame);
      for (const { direction, line, label } of axes) {
        const [x, y] = projectToScreen(this.camera.frame, direction);
        line.setLine(size - 45, size - 45, size - 45 + 25 * x, size - 45 - 25 * y);
        label.centerX = size - 45 + 35 * x;
        label.centerY = size - 45 - 35 * y;
      }
    });
    let previous: Vector2 | null = null;
    this.drag = new DragListener({
      start: (event) => {
        previous = this.globalToLocalPoint(event.pointer.point);
      },
      drag: (event) => {
        const point = this.globalToLocalPoint(event.pointer.point);
        if (previous) {
          this.camera.orbit(-(point.x - previous.x) * DRAG_ORBIT_ANGLE, (point.y - previous.y) * DRAG_ORBIT_ANGLE);
        }
        previous = point;
      },
      end: () => {
        previous = null;
      },
    });
    this.keys = new KeyboardListener({
      keyStringProperties: [
        ...OrbitalHotkeyData.ORBIT.keyStringProperties,
        ...OrbitalHotkeyData.ZOOM.keyStringProperties,
      ],
      fire: (event, key) => {
        event?.preventDefault();
        if (key === "arrowLeft" || key === "arrowRight") {
          this.camera.orbit((key === "arrowLeft" ? -1 : 1) * KEYBOARD_ORBIT_ANGLE, 0);
        } else if (key === "arrowUp" || key === "arrowDown") {
          this.camera.orbit(0, (key === "arrowDown" ? -1 : 1) * KEYBOARD_ORBIT_ANGLE);
        } else {
          zoom.value = zoom.range.constrainValue(zoom.value + (key === "minus" ? -1 : 1));
        }
      },
    });
    this.addInputListener(this.drag);
    this.addInputListener(this.keys);
  }
  public step(): void {
    if (this.quality) {
      this.engine.setQuality?.(this.quality.value);
    }
    if (this.engine.render()) {
      this.canvasImage.invalidateImage();
    }
  }
  public reset(): void {
    this.interruptSubtreeInput();
    this.camera.reset();
  }
  public override dispose(): void {
    this.cameraLink.dispose();
    this.removeInputListener(this.drag);
    this.removeInputListener(this.keys);
    this.drag.dispose();
    this.keys.dispose();
    this.camera.dispose();
    this.engine.dispose();
    this.surfacePendingProperty.dispose();
    this.samplingPendingProperty.dispose();
    for (const child of this.children.slice()) {
      child.dispose();
    }
    super.dispose();
  }
}
