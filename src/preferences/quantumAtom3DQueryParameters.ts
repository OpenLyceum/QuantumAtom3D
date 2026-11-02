/**
 * quantumAtom3DQueryParameters.ts
 *
 * Sim-specific startup query parameters. This is the single place where every
 * sim-specific query parameter is declared and documented. Public-facing
 * parameters (intended for end users / sharing links) must set `public: true`.
 *
 * Usage: append e.g. `?phaseColormap=uniform` to the sim URL.
 */

import { logGlobal } from "scenerystack/phet-core";
import { QueryStringMachine } from "scenerystack/query-string-machine";
import {
  DEFAULT_PHASE_COLORMAP,
  INITIAL_L,
  INITIAL_M,
  INITIAL_N,
  PHASE_COLORMAP_VALUES,
} from "../QuantumAtom3DConstants.js";
import QuantumAtom3DNamespace from "../QuantumAtom3DNamespace.js";

const quantumAtom3DQueryParameters = QueryStringMachine.getAll({
  /** Initial orbital state. Dependent quantum numbers are clamped to valid ranges. */
  n: {
    type: "number",
    defaultValue: INITIAL_N,
    isValidValue: (v: number) => Number.isInteger(v) && v >= 1 && v <= 5,
    public: true,
  },
  l: {
    type: "number",
    defaultValue: INITIAL_L,
    isValidValue: (v: number) => Number.isInteger(v) && v >= 0 && v <= 4,
    public: true,
  },
  m: {
    type: "number",
    defaultValue: INITIAL_M,
    isValidValue: (v: number) => Number.isInteger(v) && Math.abs(v) <= 4,
    public: true,
  },
  Z: {
    type: "number",
    defaultValue: 1,
    isValidValue: (v: number) => Number.isInteger(v) && v >= 1 && v <= 6,
    public: true,
  },
  basis: { type: "string", defaultValue: "complex", validValues: ["complex", "real"], public: true },
  quality: { type: "string", defaultValue: "auto", validValues: ["auto", "low", "medium", "high"], public: true },
  lengthUnit: { type: "string", defaultValue: "a0", validValues: ["a0", "pm"], public: true },
  showFormulas: { type: "boolean", defaultValue: true, public: true },
  /** Reproducible probability samples, independent of other simulation randomness. */
  seed: {
    type: "number",
    defaultValue: 173,
    isValidValue: (value: number) => Number.isSafeInteger(value),
    public: true,
  },
  /** Use the progressive CPU volume renderer, even when WebGPU is available. */
  forceCpu: { type: "boolean", defaultValue: false, public: true },
  /**
   * Initial colour wheel for the complex phase of ψ, seeding the Phase colours
   * preference. Example: `?phaseColormap=uniform`.
   */
  phaseColormap: {
    type: "string",
    defaultValue: DEFAULT_PHASE_COLORMAP,
    validValues: PHASE_COLORMAP_VALUES,
    public: true,
  },
});

QuantumAtom3DNamespace.register("quantumAtom3DQueryParameters", quantumAtom3DQueryParameters);

// Log query parameters (for the console / PhET-iO).
logGlobal("phet.chipper.queryParameters");

export default quantumAtom3DQueryParameters;
