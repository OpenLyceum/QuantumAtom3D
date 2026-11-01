/**
 * OrbitalSummary.ts
 *
 * The numbers the readout panel shows for one eigenstate or real orbital: the
 * energy, the radial expectation values, the most probable radius, and the
 * nodal surfaces. Everything is in atomic units.
 */

import {
  hydrogenEnergy,
  hydrogenMeanRadius,
  hydrogenMeanSquareRadius,
  hydrogenRmsRadius,
} from "../hydrogen/HydrogenExpectations.js";
import { hydrogenMostProbableRadius } from "../hydrogen/HydrogenRadial.js";
import { type NodalSurfaceSet, nodalSurfaces } from "./NodalSurfaces.js";
import type { OrbitalBasis } from "./OrbitalCatalog.js";

export type OrbitalSummary = {
  readonly n: number;
  readonly l: number;
  readonly m: number;
  readonly nuclearCharge: number;
  readonly basis: OrbitalBasis;
  /** E_n in hartrees. */
  readonly energy: number;
  /** ⟨r⟩ in a0. */
  readonly meanRadius: number;
  /** ⟨r²⟩ in a0². */
  readonly meanSquareRadius: number;
  /** √⟨r²⟩ in a0. */
  readonly rmsRadius: number;
  /** The radius of the peak of P(r), in a0. */
  readonly mostProbableRadius: number;
  readonly nodes: NodalSurfaceSet;
};

export function computeOrbitalSummary(
  n: number,
  l: number,
  m: number,
  nuclearCharge: number,
  basis: OrbitalBasis,
): OrbitalSummary {
  return {
    n,
    l,
    m,
    nuclearCharge,
    basis,
    energy: hydrogenEnergy(n, nuclearCharge),
    meanRadius: hydrogenMeanRadius(n, l, nuclearCharge),
    meanSquareRadius: hydrogenMeanSquareRadius(n, l, nuclearCharge),
    rmsRadius: hydrogenRmsRadius(n, l, nuclearCharge),
    mostProbableRadius: hydrogenMostProbableRadius(n, l, nuclearCharge),
    nodes: nodalSurfaces(n, l, m, nuclearCharge, basis),
  };
}
