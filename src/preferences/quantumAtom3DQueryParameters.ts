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
import { DEFAULT_PHASE_COLORMAP, PHASE_COLORMAP_VALUES } from "../QuantumAtom3DConstants.js";
import QuantumAtom3DNamespace from "../QuantumAtom3DNamespace.js";

const quantumAtom3DQueryParameters = QueryStringMachine.getAll({
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
