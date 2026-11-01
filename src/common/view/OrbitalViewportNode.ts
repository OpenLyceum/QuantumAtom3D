/** One canvas image at the Scenery/render-engine boundary, following HeatTransfer FieldNode. */
import { Multilink, StringUnionProperty, type TReadOnlyProperty, type UnknownMultilink } from "scenerystack/axon";
import { Bounds2, type Vector2 } from "scenerystack/dot";
import type { OneKeyStroke } from "scenerystack/scenery";
import { Circle, DragListener, Image, KeyboardListener, Line, Node, Rectangle, Text } from "scenerystack/scenery";
import { PhetFont } from "scenerystack/scenery-phet";
import { StringManager } from "../../i18n/StringManager.js";
import type { OrbitalsModel } from "../../orbitals/model/OrbitalsModel.js";
import quantumAtom3DQueryParameters from "../../preferences/quantumAtom3DQueryParameters.js";
import QuantumAtom3DColors from "../../QuantumAtom3DColors.js";
import type { PhaseColormap } from "../../QuantumAtom3DConstants.js";
import { createOrbitalRenderer } from "../gpu/createOrbitalRenderer.js";
import type { OrbitalRenderer } from "../gpu/OrbitalRenderer.js";
import { hydrogenEnclosingRadius } from "../model/hydrogen/HydrogenRadial.js";
import { buildDensityGrid, type DensityGrid, enclosedProbabilityLevel } from "../model/orbital/EnclosedProbability.js";
import { peakDensity } from "../model/orbital/PeakDensity.js";
import { sampleEigenstate } from "../model/orbital/ProbabilitySampler.js";
import { DOT_COUNT } from "../model/orbital/RenderMode.js";
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
    // The orthographic silhouette of a sphere is a circle for every camera orientation.
    const probeShell = new Circle(1, {
      centerX: size / 2,
      centerY: size / 2,
      stroke: QuantumAtom3DColors.sliceNodeOverlayColorProperty,
      lineDash: [4, 3],
      pickable: false,
    });
    this.addChild(probeShell);
    const planeHandle = new Circle(7, {
      fill: QuantumAtom3DColors.accentColorProperty,
      stroke: QuantumAtom3DColors.sliceNodeOverlayColorProperty,
      pickable: false,
    });
    this.addChild(planeHandle);
    const planeNormal = (): Vec3 =>
      model.slicePlaneProperty.value === "xy"
        ? [0, 0, 1]
        : model.slicePlaneProperty.value === "xz"
          ? [0, 1, 0]
          : [1, 0, 0];
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
    let grid: DensityGrid | null = null;
    const isoLevels = new Map<number, number>();
    let points: Float32Array | undefined;
    this.updateScene = () => {
      const wavefunction = model.wavefunctionProperty.value;
      if (wavefunction !== lastWavefunction) {
        lastWavefunction = wavefunction;
        peak = peakDensity(wavefunction);
        grid = null;
        isoLevels.clear();
        points = undefined;
      }
      const { n, l, m, basis, nuclearCharge } = model.summaryProperty.value;
      const mode = model.renderModeProperty.value;
      if (mode === "dots" && !points) {
        points = sampleEigenstate(n, l, m, basis, nuclearCharge, DOT_COUNT, quantumAtom3DQueryParameters.seed);
      }
      if (mode === "isosurface" && !grid) {
        grid = buildDensityGrid(wavefunction, hydrogenEnclosingRadius(n, l, nuclearCharge, 0.9999));
      }
      const fraction = model.enclosedFractionProperty.value;
      if (mode === "isosurface" && grid && !isoLevels.has(fraction)) {
        isoLevels.set(fraction, enclosedProbabilityLevel(grid, fraction));
      }
      this.engine.setScene({
        ...(model.nodes3DVisibleProperty.value && { nodes: model.summaryProperty.value.nodes }),
        ...(model.cuttingPlaneVisibleProperty.value && {
          cuttingPlane: { normal: planeNormal(), offset: model.sliceOffsetProperty.value },
        }),
        overlayColor: [
          QuantumAtom3DColors.sliceNodeOverlayColorProperty.value.red / 255,
          QuantumAtom3DColors.sliceNodeOverlayColorProperty.value.green / 255,
          QuantumAtom3DColors.sliceNodeOverlayColorProperty.value.blue / 255,
        ],
        mode,
        ...(points && { points }),
        isoLevel: isoLevels.get(fraction) ?? 0,
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
        [
          model.cuttingPlaneVisibleProperty,
          model.slicePlaneProperty,
          model.sliceOffsetFractionProperty,
          this.camera.yawProperty,
          this.camera.pitchProperty,
        ],
        (visible) => {
          planeHandle.visible = visible;
          const normal = planeNormal();
          const point: Vec3 = [
            normal[0] * model.sliceOffsetFractionProperty.value,
            normal[1] * model.sliceOffsetFractionProperty.value,
            normal[2] * model.sliceOffsetFractionProperty.value,
          ];
          const [x, y] = projectToScreen(this.camera.frame, point);
          planeHandle.centerX = size / 2 + (x * size) / 2;
          planeHandle.centerY = size / 2 - (y * size) / 2;
        },
      ),
      Multilink.multilink([model.probeFractionProperty], (fraction) => {
        probeShell.radius = Math.max(0.01, (fraction * size) / 2);
        probeShell.visible = fraction > 0;
      }),
      Multilink.multilink(
        [
          model.wavefunctionProperty,
          model.viewHalfWidthProperty,
          model.sliceColoringProperty,
          phaseColormapProperty,
          model.renderModeProperty,
          model.enclosedFractionProperty,
          model.nodes3DVisibleProperty,
          model.cuttingPlaneVisibleProperty,
          model.slicePlaneProperty,
          model.sliceOffsetProperty,
          QuantumAtom3DColors.sliceNodeOverlayColorProperty,
        ],
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
    let draggingPlane = false;
    this.dragListener = new DragListener({
      start: (event) => {
        previous = this.globalToLocalPoint(event.pointer.point);
        draggingPlane = planeHandle.visible && previous.distance(planeHandle.center) < 14;
      },
      drag: (event) => {
        const point = this.globalToLocalPoint(event.pointer.point);
        if (previous) {
          if (draggingPlane) {
            const [nx, ny] = projectToScreen(this.camera.frame, planeNormal());
            const norm = nx * nx + ny * ny;
            const delta =
              norm > 0.01 ? ((point.x - previous.x) * nx - (point.y - previous.y) * ny) / norm : previous.y - point.y;
            model.sliceOffsetFractionProperty.value = model.sliceOffsetFractionProperty.range.constrainValue(
              model.sliceOffsetFractionProperty.value + (2 * delta) / size,
            );
          } else {
            this.camera.orbit(-(point.x - previous.x) * DRAG_ANGLE, (point.y - previous.y) * DRAG_ANGLE);
          }
        }
        previous = point;
      },
      end: () => {
        previous = null;
        draggingPlane = false;
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
    this.addInputListener({
      move: (event) => {
        if (!previous) {
          const point = this.globalToLocalPoint(event.pointer.point);
          // The ray's closest approach to the nucleus, divided by view half-width.
          model.probeFractionProperty.value = Math.min(
            1,
            Math.hypot((2 * point.x) / size - 1, 1 - (2 * point.y) / size),
          );
        }
      },
    });
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
