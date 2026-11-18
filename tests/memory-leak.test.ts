/**
 * Memory-leak regression suite (fleet standard).
 *
 * List every model/view object that links Properties, adds listeners, or owns child
 * nodes, with a factory that builds a fresh instance. The shared harness in
 * tests/helpers/memoryLeak.ts (template-owned) checks that each one is garbage
 * collected after dispose() and leaves no survivors across repeated cycles
 * (idempotentDispose: true also checks a second dispose()). Add sim-specific leak
 * tests below using forceGC().
 */

import { Property, StringProperty } from "scenerystack/axon";
import { AngularMomentumModel } from "../src/angular-momentum/model/AngularMomentumModel.js";
import { AngularDensityNode } from "../src/angular-momentum/view/AngularDensityNode.js";
import { AngularMomentumDiagramNode } from "../src/angular-momentum/view/AngularMomentumDiagramNode.js";
import { AngularMomentumScreenSummaryContent } from "../src/angular-momentum/view/AngularMomentumScreenSummaryContent.js";
import { CpuOrbitalRenderer } from "../src/common/gpu/CpuOrbitalRenderer.js";
import { OrbitalsModel } from "../src/common/model/orbital/OrbitalsModel.js";
import { QuantumNumbersModel } from "../src/common/model/orbital/QuantumNumbersModel.js";
import { TimeModel } from "../src/common/TimeModel.js";
import { ColormapLegendNode } from "../src/common/view/ColormapLegendNode.js";
import { DisposableScreenSummaryContent } from "../src/common/view/DisposableScreenSummaryContent.js";
import { OrbitalAngularDetailNode } from "../src/common/view/OrbitalAngularDetailNode.js";
import { OrbitalViewportNode } from "../src/common/view/OrbitalViewportNode.js";
import { OrbitCamera } from "../src/common/view/OrbitCamera.js";
import { QuantumNumberControl } from "../src/common/view/QuantumNumberControl.js";
import { StringManager } from "../src/i18n/StringManager.js";
import { OrbitalsScreenSummaryContent } from "../src/orbitals/view/OrbitalsScreenSummaryContent.js";
import { OscillatorModel } from "../src/oscillator/model/OscillatorModel.js";
import { BasisOverlapNode } from "../src/oscillator/view/BasisOverlapNode.js";
import { OscillatorScreenSummaryContent } from "../src/oscillator/view/OscillatorScreenSummaryContent.js";
import { OscillatorViewportNode } from "../src/oscillator/view/OscillatorViewportNode.js";
import { QuantumAtom3DPreferencesModel } from "../src/preferences/QuantumAtom3DPreferencesModel.js";
import type { PhaseColormap } from "../src/QuantumAtom3DConstants.js";
import { CoefficientRow, SuperpositionModel } from "../src/superposition/model/SuperpositionModel.js";
import { ExpectationTimeSeriesNode } from "../src/superposition/view/ExpectationTimeSeriesNode.js";
import { SuperpositionScreenSummaryContent } from "../src/superposition/view/SuperpositionScreenSummaryContent.js";
import { SuperpositionViewportNode } from "../src/superposition/view/SuperpositionViewportNode.js";
import { ZeemanModel } from "../src/zeeman/model/ZeemanModel.js";
import { ZeemanDiagramNode } from "../src/zeeman/view/ZeemanDiagramNode.js";
import { ZeemanScreenSummaryContent } from "../src/zeeman/view/ZeemanScreenSummaryContent.js";
import { ZeemanSpectrumNode } from "../src/zeeman/view/ZeemanSpectrumNode.js";
import { describeDisposalLeaks } from "./helpers/memoryLeak.js";

// These outlive the viewport, so the test detects listeners left on external state.
const viewportModel = new OrbitalsModel();
const colormap = new Property<PhaseColormap>("hsv");
const coloringProperty = new Property<"phase" | "density">("phase");
const quantumNumbers = new QuantumNumbersModel({ maxN: 5, initialN: 2, initialL: 1, initialM: 0 });
const basisProperty = new Property<"complex" | "real">("complex");
const superpositionModel = new SuperpositionModel();
const angularModel = new AngularMomentumModel();
const zeemanModel = new ZeemanModel();
const oscillatorModel = new OscillatorModel();
const orbitalStrings = StringManager.getInstance().getOrbitalStrings();

describeDisposalLeaks([
  // memory-leak-covers: InteractiveOrbitalCanvas (inherited dispose via OscillatorViewportNode and SuperpositionViewportNode)
  { name: "OscillatorScreenSummaryContent", create: () => new OscillatorScreenSummaryContent(oscillatorModel) },
  { name: "ZeemanScreenSummaryContent", create: () => new ZeemanScreenSummaryContent(zeemanModel) },
  { name: "AngularMomentumScreenSummaryContent", create: () => new AngularMomentumScreenSummaryContent(angularModel) },
  {
    name: "SuperpositionScreenSummaryContent",
    create: () => new SuperpositionScreenSummaryContent(superpositionModel),
  },
  { name: "OrbitalsScreenSummaryContent", create: () => new OrbitalsScreenSummaryContent(viewportModel) },
  {
    name: "DisposableScreenSummaryContent",
    create: () =>
      new DisposableScreenSummaryContent(
        {
          playAreaStringProperty: new StringProperty("play"),
          controlAreaStringProperty: new StringProperty("control"),
          interactionHintStringProperty: new StringProperty("hint"),
        },
        new StringProperty("details"),
      ),
  },
  {
    name: "ColormapLegendNode",
    create: () =>
      new ColormapLegendNode({
        coloringProperty,
        phaseColormapProperty: colormap,
        phaseCaptionProperty: orbitalStrings.slice.phaseLegendStringProperty,
        densityCaptionProperty: orbitalStrings.slice.densityLegendStringProperty,
      }),
    keepAlive: () => [coloringProperty, colormap, orbitalStrings],
  },
  {
    name: "QuantumNumberControl",
    create: () => new QuantumNumberControl(quantumNumbers, { basisProperty }),
    keepAlive: () => [quantumNumbers, basisProperty],
  },
  { name: "OrbitalAngularDetailNode", create: () => new OrbitalAngularDetailNode(viewportModel) },
  { name: "QuantumAtom3DPreferencesModel", create: () => new QuantumAtom3DPreferencesModel() },
  { name: "OscillatorModel", create: () => new OscillatorModel() },
  { name: "OscillatorViewportNode", create: () => new OscillatorViewportNode(320, oscillatorModel, colormap) },
  { name: "BasisOverlapNode", create: () => new BasisOverlapNode(oscillatorModel) },
  { name: "ZeemanModel", create: () => new ZeemanModel() },
  { name: "ZeemanDiagramNode", create: () => new ZeemanDiagramNode(zeemanModel) },
  { name: "ZeemanSpectrumNode", create: () => new ZeemanSpectrumNode(500, zeemanModel) },
  { name: "AngularMomentumModel", create: () => new AngularMomentumModel() },
  { name: "AngularMomentumDiagramNode", create: () => new AngularMomentumDiagramNode(angularModel) },
  { name: "AngularDensityNode", create: () => new AngularDensityNode(angularModel) },
  { name: "OrbitCamera", create: () => new OrbitCamera() },
  { name: "CpuOrbitalRenderer", create: () => new CpuOrbitalRenderer(), idempotentDispose: true },
  { name: "OrbitalViewportNode", create: () => new OrbitalViewportNode(340, viewportModel, colormap) },
  { name: "TimeModel", create: () => new TimeModel(), idempotentDispose: true },
  { name: "CoefficientRow", create: () => new CoefficientRow() },
  { name: "SuperpositionViewportNode", create: () => new SuperpositionViewportNode(360, superpositionModel, colormap) },
  { name: "ExpectationTimeSeriesNode", create: () => new ExpectationTimeSeriesNode(470, 105, superpositionModel) },
  { name: "SuperpositionModel", create: () => new SuperpositionModel(), idempotentDispose: true },
  {
    name: "QuantumNumbersModel",
    create: () => new QuantumNumbersModel({ maxN: 5, initialN: 2, initialL: 1, initialM: 0 }),
  },
  { name: "OrbitalsModel", create: () => new OrbitalsModel() },
]);
