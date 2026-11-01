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

import { Property } from "scenerystack/axon";
import { AngularMomentumModel } from "../src/angular-momentum/model/AngularMomentumModel.js";
import { AngularDensityNode } from "../src/angular-momentum/view/AngularDensityNode.js";
import { AngularMomentumDiagramNode } from "../src/angular-momentum/view/AngularMomentumDiagramNode.js";
import { CpuOrbitalRenderer } from "../src/common/gpu/CpuOrbitalRenderer.js";
import { QuantumNumbersModel } from "../src/common/model/orbital/QuantumNumbersModel.js";
import { TimeModel } from "../src/common/TimeModel.js";
import { OrbitalViewportNode } from "../src/common/view/OrbitalViewportNode.js";
import { OrbitCamera } from "../src/common/view/OrbitCamera.js";
import { OrbitalsModel } from "../src/orbitals/model/OrbitalsModel.js";
import { OscillatorModel } from "../src/oscillator/model/OscillatorModel.js";
import { BasisOverlapNode } from "../src/oscillator/view/BasisOverlapNode.js";
import { OscillatorViewportNode } from "../src/oscillator/view/OscillatorViewportNode.js";
import type { PhaseColormap } from "../src/QuantumAtom3DConstants.js";
import { CoefficientRow, SuperpositionModel } from "../src/superposition/model/SuperpositionModel.js";
import { ExpectationTimeSeriesNode } from "../src/superposition/view/ExpectationTimeSeriesNode.js";
import { SuperpositionViewportNode } from "../src/superposition/view/SuperpositionViewportNode.js";
import { ZeemanModel } from "../src/zeeman/model/ZeemanModel.js";
import { ZeemanDiagramNode } from "../src/zeeman/view/ZeemanDiagramNode.js";
import { ZeemanSpectrumNode } from "../src/zeeman/view/ZeemanSpectrumNode.js";
import { describeDisposalLeaks } from "./helpers/memoryLeak.js";

// These outlive the viewport, so the test detects listeners left on external state.
const viewportModel = new OrbitalsModel();
const colormap = new Property<PhaseColormap>("hsv");
const superpositionModel = new SuperpositionModel();
const angularModel = new AngularMomentumModel();
const zeemanModel = new ZeemanModel();
const oscillatorModel = new OscillatorModel();

describeDisposalLeaks([
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
