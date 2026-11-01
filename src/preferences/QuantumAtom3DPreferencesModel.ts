/**
 * QuantumAtom3DPreferencesModel.ts
 *
 * Model for the simulation-specific preferences shown in Preferences →
 * Simulation. Each preference Property takes its initial value from the
 * corresponding query parameter in quantumAtom3DQueryParameters.
 */

import { BooleanProperty, StringUnionProperty } from "scenerystack/axon";
import type { Tandem } from "scenerystack/tandem";
import { DEFAULT_PHASE_COLORMAP, PHASE_COLORMAP_VALUES, type PhaseColormap } from "../QuantumAtom3DConstants.js";
import QuantumAtom3DNamespace from "../QuantumAtom3DNamespace.js";
import quantumAtom3DQueryParameters from "./quantumAtom3DQueryParameters.js";

/**
 * Narrows the raw query-parameter string to a {@link PhaseColormap}. The
 * QueryStringMachine schema already constrains the value at runtime via
 * `validValues`; this guard carries that guarantee into the type system without
 * a cast.
 */
const isPhaseColormap = (value: string): value is PhaseColormap =>
  PHASE_COLORMAP_VALUES.some((candidate) => candidate === value);

export type LengthUnit = "a0" | "pm";
export type RenderQuality = "auto" | "low" | "medium" | "high";
export class QuantumAtom3DPreferencesModel {
  public readonly lengthUnitProperty = new StringUnionProperty<LengthUnit>(
    quantumAtom3DQueryParameters.lengthUnit === "pm" ? "pm" : "a0",
    { validValues: ["a0", "pm"] },
  );
  public readonly qualityProperty = new StringUnionProperty<RenderQuality>(
    quantumAtom3DQueryParameters.quality as RenderQuality,
    { validValues: ["auto", "low", "medium", "high"] },
  );
  public readonly showFormulasProperty = new BooleanProperty(quantumAtom3DQueryParameters.showFormulas);
  /** Colour wheel for the phase of ψ; initial value from the `phaseColormap` query parameter. */
  public readonly phaseColormapProperty: StringUnionProperty<PhaseColormap>;

  public constructor(tandem?: Tandem) {
    const rawColormap = quantumAtom3DQueryParameters.phaseColormap;
    const initialValue: PhaseColormap =
      rawColormap !== null && isPhaseColormap(rawColormap) ? rawColormap : DEFAULT_PHASE_COLORMAP;
    this.phaseColormapProperty = new StringUnionProperty(initialValue, {
      validValues: PHASE_COLORMAP_VALUES,
      ...(tandem && { tandem: tandem.createTandem("phaseColormapProperty") }),
    });
  }

  public reset(): void {
    this.phaseColormapProperty.reset();
    this.lengthUnitProperty.reset();
    this.qualityProperty.reset();
    this.showFormulasProperty.reset();
  }
  public dispose(): void {
    this.phaseColormapProperty.dispose();
    this.lengthUnitProperty.dispose();
    this.qualityProperty.dispose();
    this.showFormulasProperty.dispose();
  }
}

QuantumAtom3DNamespace.register("QuantumAtom3DPreferencesModel", QuantumAtom3DPreferencesModel);
