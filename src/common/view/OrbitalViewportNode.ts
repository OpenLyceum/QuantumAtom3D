/** One canvas image at the Scenery/render-engine boundary, following HeatTransfer FieldNode. */
import {
  BooleanProperty,
  Multilink,
  StringUnionProperty,
  type TReadOnlyProperty,
  type UnknownMultilink,
} from "scenerystack/axon";
import type { Vector2 } from "scenerystack/dot";
import type { OneKeyStroke } from "scenerystack/scenery";
import { Circle, DragListener, Image, KeyboardListener, Node, Rectangle } from "scenerystack/scenery";
import { StringManager } from "../../i18n/StringManager.js";
import type { OrbitalsModel } from "../../orbitals/model/OrbitalsModel.js";
import type { RenderQuality } from "../../preferences/QuantumAtom3DPreferencesModel.js";
import quantumAtom3DQueryParameters from "../../preferences/quantumAtom3DQueryParameters.js";
import QuantumAtom3DColors from "../../QuantumAtom3DColors.js";
import type { PhaseColormap } from "../../QuantumAtom3DConstants.js";
import { createOrbitalRenderer } from "../gpu/createOrbitalRenderer.js";
import type { OrbitalRenderer } from "../gpu/OrbitalRenderer.js";
import { hydrogenEnclosingRadius } from "../model/hydrogen/HydrogenRadial.js";
import { peakDensity } from "../model/orbital/PeakDensity.js";
import { sampleEigenstate } from "../model/orbital/ProbabilitySampler.js";
import { DOT_COUNT } from "../model/orbital/RenderMode.js";
import { OrbitalHotkeyData } from "./OrbitalHotkeyData.js";
import { OrbitCamera, projectToScreen, type Vec3 } from "./OrbitCamera.js";
import {
  addOrientationAxes,
  createPendingText,
  DRAG_ORBIT_ANGLE,
  KEYBOARD_ORBIT_ANGLE,
  orbitalViewportOptions,
} from "./orbitalViewportChrome.js";
import { ProgressiveSurface } from "./ProgressiveSurface.js";

const AXIS_LENGTH = 28;

export class OrbitalViewportNode extends Node {
  public readonly surfacePendingProperty = new BooleanProperty(false);
  public readonly camera = new OrbitCamera();
  public readonly engine: OrbitalRenderer;
  public readonly backendProperty: StringUnionProperty<"gpu" | "cpu">;
  private readonly image: Image;
  private readonly links: UnknownMultilink[];
  private readonly dragListener: DragListener;
  private readonly keyboardListener: KeyboardListener<readonly OneKeyStroke[]>;
  private readonly model: OrbitalsModel;
  private readonly surface = new ProgressiveSurface();
  private sceneDirty = true;
  private cameraDirty = true;
  private readonly updateScene: () => void;

  private readonly quality: TReadOnlyProperty<RenderQuality> | undefined;
  public constructor(
    size: number,
    model: OrbitalsModel,
    phaseColormapProperty: TReadOnlyProperty<PhaseColormap>,
    quality?: TReadOnlyProperty<RenderQuality>,
  ) {
    const strings = StringManager.getInstance().getOrbitalStrings().volume;
    super(orbitalViewportOptions(size));
    this.quality = quality;
    this.model = model;
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
    this.addChild(createPendingText(strings.surfacePendingStringProperty, this.surfacePendingProperty, size));
    const axes = addOrientationAxes(this);

    // Cache normalization across camera, colour and zoom changes. Compute it once per state.
    let lastWavefunction = model.wavefunctionProperty.value;
    let peak = peakDensity(lastWavefunction);

    let points: Float32Array | undefined;
    this.updateScene = () => {
      const wavefunction = model.wavefunctionProperty.value;
      if (wavefunction !== lastWavefunction) {
        lastWavefunction = wavefunction;
        peak = peakDensity(wavefunction);

        points = undefined;
      }
      const { n, l, m, basis, nuclearCharge } = model.summaryProperty.value;
      const mode = model.renderModeProperty.value;
      if (mode === "dots" && !points) {
        points = sampleEigenstate(n, l, m, basis, nuclearCharge, DOT_COUNT, quantumAtom3DQueryParameters.seed);
      }
      this.surfacePendingProperty.value = mode === "isosurface" && this.surface.pending;
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
        mode: mode === "isosurface" && this.surface.level === 0 ? "volume" : mode,
        ...(points && { points }),
        isoLevel: this.surface.level,
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
            this.camera.orbit(-(point.x - previous.x) * DRAG_ORBIT_ANGLE, (point.y - previous.y) * DRAG_ORBIT_ANGLE);
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
          this.camera.orbit(-KEYBOARD_ORBIT_ANGLE, 0);
        } else if (key === "arrowRight") {
          this.camera.orbit(KEYBOARD_ORBIT_ANGLE, 0);
        } else if (key === "arrowUp") {
          this.camera.orbit(0, KEYBOARD_ORBIT_ANGLE);
        } else if (key === "arrowDown") {
          this.camera.orbit(0, -KEYBOARD_ORBIT_ANGLE);
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
    if (this.quality) {
      this.engine.setQuality?.(this.quality.value);
    }
    if (this.model.renderModeProperty.value === "isosurface") {
      const { n, l, nuclearCharge } = this.model.summaryProperty.value;
      const previousLevel = this.surface.level;
      this.surface.step(
        this.model.wavefunctionProperty.value,
        hydrogenEnclosingRadius(n, l, nuclearCharge, 0.9999),
        this.model.enclosedFractionProperty.value,
      );
      this.surfacePendingProperty.value = this.surface.pending;
      if (this.surface.level !== previousLevel) {
        this.sceneDirty = true;
      }
    } else if (this.surface.pending) {
      this.surface.reset();
      this.surfacePendingProperty.value = false;
    }
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
    this.surfacePendingProperty.dispose();
    this.camera.dispose();
    this.backendProperty.dispose();
    for (const child of this.children.slice()) {
      child.dispose();
    }
    super.dispose();
  }
}
