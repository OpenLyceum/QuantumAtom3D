/** One canvas image at the Scenery/render-engine boundary, following HeatTransfer FieldNode. */
import { Multilink, StringUnionProperty, type TReadOnlyProperty, type UnknownMultilink } from "scenerystack/axon";
import { Bounds2, type Vector2 } from "scenerystack/dot";
import type { OneKeyStroke } from "scenerystack/scenery";
import { DragListener, Image, KeyboardListener, Line, Node, Rectangle, Text } from "scenerystack/scenery";
import { PhetFont } from "scenerystack/scenery-phet";
import { StringManager } from "../../i18n/StringManager.js";
import type { OrbitalsModel } from "../../orbitals/model/OrbitalsModel.js";
import QuantumAtom3DColors from "../../QuantumAtom3DColors.js";
import type { PhaseColormap } from "../../QuantumAtom3DConstants.js";
import { createOrbitalRenderer } from "../gpu/createOrbitalRenderer.js";
import type { OrbitalRenderer } from "../gpu/OrbitalRenderer.js";
import { peakDensity } from "../model/orbital/PeakDensity.js";
import { OrbitalHotkeyData } from "./OrbitalHotkeyData.js";
import { OrbitCamera, projectToScreen, type Vec3 } from "./OrbitCamera.js";

const KEYBOARD_ANGLE = Math.PI / 36;
const DRAG_ANGLE = 0.008;
const AXIS_LENGTH = 28;

export class OrbitalViewportNode extends Node {
  public readonly camera = new OrbitCamera();
  public readonly engine: OrbitalRenderer;
  public readonly backendProperty: StringUnionProperty<"gpu" | "cpu">;
  private readonly image: Image;
  private readonly links: UnknownMultilink[];
  private readonly dragListener: DragListener;
  private readonly keyboardListener: KeyboardListener<readonly OneKeyStroke[]>;
  private sceneDirty = true;
  private cameraDirty = true;
  private readonly updateScene: () => void;

  public constructor(size: number, model: OrbitalsModel, phaseColormapProperty: TReadOnlyProperty<PhaseColormap>) {
    const strings = StringManager.getInstance().getOrbitalStrings().volume;
    super({
      tagName: "div",
      focusable: true,
      ariaRole: "application",
      cursor: "grab",
      accessibleName: strings.titleStringProperty,
      accessibleNameBehavior: (_node, options, name) => ({ ...options, ariaLabel: name }),
      accessibleHelpText: strings.helpStringProperty,
      mouseArea: new Bounds2(0, 0, size, size),
      touchArea: new Bounds2(0, 0, size, size),
    });
    this.engine = createOrbitalRenderer();
    this.backendProperty = new StringUnionProperty<"gpu" | "cpu">(this.engine.backend, {
      validValues: ["gpu", "cpu"],
    });
    this.image = new Image(this.engine.canvas, { scale: size / this.engine.canvas.width, pickable: false });
    this.addChild(this.image);
    this.addChild(
      new Rectangle(0, 0, size, size, {
        stroke: QuantumAtom3DColors.sliceFrameColorProperty,
        lineWidth: 1.5,
        pickable: false,
      }),
    );
    const axes = (["x", "y", "z"] as const).map((name, index) => {
      const direction = [0, 0, 0];
      direction[index] = 1;
      const line = new Line(0, 0, 0, 0, { stroke: QuantumAtom3DColors.sliceNodeOverlayColorProperty, pickable: false });
      const label = new Text(name, {
        font: new PhetFont(12),
        fill: QuantumAtom3DColors.sliceNodeOverlayColorProperty,
        pickable: false,
      });
      this.addChild(line);
      this.addChild(label);
      return { direction: direction as unknown as Vec3, line, label };
    });

    // Cache normalization across camera, colour and zoom changes. Compute it once per state.
    let lastWavefunction = model.wavefunctionProperty.value;
    let peak = peakDensity(lastWavefunction);
    this.updateScene = () => {
      const wavefunction = model.wavefunctionProperty.value;
      if (wavefunction !== lastWavefunction) {
        lastWavefunction = wavefunction;
        peak = peakDensity(wavefunction);
      }
      this.engine.setScene({
        terms: wavefunction.terms,
        nuclearCharge: wavefunction.nuclearCharge,
        inversePeakAmplitude: peak > 0 ? 1 / Math.sqrt(peak) : 0,
        radius: model.viewHalfWidthProperty.value,
        coloring: model.sliceColoringProperty.value,
        phaseColormap: phaseColormapProperty.value,
      });
    };
    this.links = [
      Multilink.multilink(
        [model.wavefunctionProperty, model.viewHalfWidthProperty, model.sliceColoringProperty, phaseColormapProperty],
        () => {
          this.sceneDirty = true;
        },
      ),
      Multilink.multilink([this.camera.yawProperty, this.camera.pitchProperty], () => {
        this.cameraDirty = true;
        for (const { direction, line, label } of axes) {
          const [x, y] = projectToScreen(this.camera.frame, direction);
          const originX = size - 48;
          const originY = size - 48;
          line.setLine(originX, originY, originX + x * AXIS_LENGTH, originY - y * AXIS_LENGTH);
          label.centerX = originX + x * (AXIS_LENGTH + 10);
          label.centerY = originY - y * (AXIS_LENGTH + 10);
        }
      }),
    ];
    let previous: Vector2 | null = null;
    this.dragListener = new DragListener({
      start: (event) => {
        previous = this.globalToLocalPoint(event.pointer.point);
      },
      drag: (event) => {
        const point = this.globalToLocalPoint(event.pointer.point);
        if (previous) {
          this.camera.orbit(-(point.x - previous.x) * DRAG_ANGLE, (point.y - previous.y) * DRAG_ANGLE);
        }
        previous = point;
      },
      end: () => {
        previous = null;
      },
    });
    this.keyboardListener = new KeyboardListener({
      keyStringProperties: [
        ...OrbitalHotkeyData.ORBIT.keyStringProperties,
        ...OrbitalHotkeyData.ZOOM.keyStringProperties,
      ],
      fire: (event, key) => {
        event?.preventDefault();
        if (key === "arrowLeft") {
          this.camera.orbit(-KEYBOARD_ANGLE, 0);
        } else if (key === "arrowRight") {
          this.camera.orbit(KEYBOARD_ANGLE, 0);
        } else if (key === "arrowUp") {
          this.camera.orbit(0, KEYBOARD_ANGLE);
        } else if (key === "arrowDown") {
          this.camera.orbit(0, -KEYBOARD_ANGLE);
        } else {
          model.zoomLevelProperty.value = model.zoomLevelProperty.range.constrainValue(
            model.zoomLevelProperty.value + (key === "minus" ? -1 : 1),
          );
        }
      },
    });
    this.addInputListener(this.dragListener);
    this.addInputListener(this.keyboardListener);
  }

  /** Coalesce synchronous property changes, then spend a bounded amount of CPU work per frame. */
  public step(): void {
    if (this.sceneDirty) {
      this.updateScene();
      this.sceneDirty = false;
    }
    if (this.cameraDirty) {
      this.engine.setCamera(this.camera.frame);
      this.cameraDirty = false;
    }
    if (this.engine.render()) {
      this.image.invalidateImage();
    }
    this.backendProperty.value = this.engine.backend;
  }

  public reset(): void {
    this.interruptSubtreeInput();
    this.camera.reset();
  }

  public override dispose(): void {
    for (const link of this.links) {
      link.dispose();
    }
    this.removeInputListener(this.dragListener);
    this.removeInputListener(this.keyboardListener);
    this.dragListener.dispose();
    this.keyboardListener.dispose();
    this.engine.dispose();
    this.camera.dispose();
    this.backendProperty.dispose();
    for (const child of this.children.slice()) {
      child.dispose();
    }
    super.dispose();
  }
}
