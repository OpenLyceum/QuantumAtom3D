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

import { QuantumNumbersModel } from "../src/common/model/orbital/QuantumNumbersModel.js";
import { TimeModel } from "../src/common/TimeModel.js";
import { OrbitalsModel } from "../src/orbitals/model/OrbitalsModel.js";
import { SuperpositionModel } from "../src/superposition/model/SuperpositionModel.js";
import { describeDisposalLeaks } from "./helpers/memoryLeak.js";

describeDisposalLeaks([
  { name: "TimeModel", create: () => new TimeModel(), idempotentDispose: true },
  { name: "SuperpositionModel", create: () => new SuperpositionModel(), idempotentDispose: true },
  {
    name: "QuantumNumbersModel",
    create: () => new QuantumNumbersModel({ maxN: 5, initialN: 2, initialL: 1, initialM: 0 }),
  },
  { name: "OrbitalsModel", create: () => new OrbitalsModel() },
]);
