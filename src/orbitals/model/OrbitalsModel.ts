/**
 * OrbitalsModel.ts
 *
 * Model for the Orbitals screen: one hydrogenic eigenstate (or real orbital)
 * chosen by (n, l, m), the basis, and the nuclear charge Z, plus the view
 * scale and the 2D cross-section plane.
 *
 * The view half-width depends on n, l and the zoom, and not on Z. It is sized
 * so the Z = 1 orbital fits, so raising Z shrinks the orbital on screen as
 * r ∝ 1/Z, which is the point of the Z control.
 */

import {
  BooleanProperty,
  DerivedProperty,
  NumberProperty,
  StringUnionProperty,
  type TReadOnlyProperty,
} from "scenerystack/axon";
import { Range } from "scenerystack/dot";
import type { TModel } from "scenerystack/joist";
import type { Tandem } from "scenerystack/tandem";
import { hydrogenEnclosingRadius } from "../../common/model/hydrogen/HydrogenRadial.js";
import { ORBITAL_BASIS_VALUES, type OrbitalBasis, orbitalTerms } from "../../common/model/orbital/OrbitalCatalog.js";
import { computeOrbitalSummary, type OrbitalSummary } from "../../common/model/orbital/OrbitalSummary.js";
import { QuantumNumbersModel } from "../../common/model/orbital/QuantumNumbersModel.js";
import { SLICE_PLANE_VALUES, type SlicePlane } from "../../common/model/orbital/SliceSampler.js";
import { Wavefunction } from "../../common/model/orbital/Wavefunction.js";
import {
  INITIAL_L,
  INITIAL_M,
  INITIAL_N,
  MAX_N,
  MAX_NUCLEAR_CHARGE,
  MAX_ZOOM_LEVEL,
  MIN_NUCLEAR_CHARGE,
  MIN_ZOOM_LEVEL,
  VIEW_ENCLOSED_FRACTION,
  ZOOM_STEP_FACTOR,
} from "../../QuantumAtom3DConstants.js";

/** How the cross-section is coloured: by the phase of ψ, or by |ψ|² alone. */
export const SLICE_COLORING_VALUES = ["phase", "density"] as const;
export type SliceColoring = (typeof SLICE_COLORING_VALUES)[number];

export class OrbitalsModel implements TModel {
  public readonly nodes3DVisibleProperty = new BooleanProperty(false);
  public readonly cuttingPlaneVisibleProperty = new BooleanProperty(false);
  /** Radial probe shared by the chart, viewport and keyboard slider. */
  public readonly probeFractionProperty = new NumberProperty(0, { range: new Range(0, 1) });
  public readonly renderModeProperty = new StringUnionProperty<"volume" | "dots" | "isosurface">("volume", {
    validValues: ["volume", "dots", "isosurface"],
  });
  public readonly enclosedFractionProperty = new NumberProperty(0.9, { validValues: [0.9, 0.95] });
  public readonly quantumNumbers: QuantumNumbersModel;
  public readonly nuclearChargeProperty: NumberProperty;
  public readonly basisProperty: StringUnionProperty<OrbitalBasis>;

  /** Integer zoom level; the view is magnified by ZOOM_STEP_FACTOR^level. */
  public readonly zoomLevelProperty: NumberProperty;

  public readonly slicePlaneProperty: StringUnionProperty<SlicePlane>;

  /** Position of the slice along its normal, as a fraction of the view half-width (−1 to 1). */
  public readonly sliceOffsetFractionProperty: NumberProperty;

  public readonly sliceColoringProperty: StringUnionProperty<SliceColoring>;

  /** Whether nodal-surface markers are drawn. */
  public readonly nodesVisibleProperty: BooleanProperty;

  public readonly wavefunctionProperty: TReadOnlyProperty<Wavefunction>;
  public readonly summaryProperty: TReadOnlyProperty<OrbitalSummary>;

  /** Half-width of the square view, in a0. */
  public readonly viewHalfWidthProperty: TReadOnlyProperty<number>;

  /** Slice position along its normal, in a0. */
  public readonly sliceOffsetProperty: TReadOnlyProperty<number>;

  public constructor(tandem?: Tandem) {
    this.quantumNumbers = new QuantumNumbersModel({
      maxN: MAX_N,
      initialN: INITIAL_N,
      initialL: INITIAL_L,
      initialM: INITIAL_M,
      ...(tandem && { tandem: tandem.createTandem("quantumNumbers") }),
    });
    this.nuclearChargeProperty = new NumberProperty(MIN_NUCLEAR_CHARGE, {
      range: new Range(MIN_NUCLEAR_CHARGE, MAX_NUCLEAR_CHARGE),
      numberType: "Integer",
      ...(tandem && { tandem: tandem.createTandem("nuclearChargeProperty") }),
    });
    this.basisProperty = new StringUnionProperty<OrbitalBasis>("complex", {
      validValues: ORBITAL_BASIS_VALUES,
      ...(tandem && { tandem: tandem.createTandem("basisProperty") }),
    });
    this.zoomLevelProperty = new NumberProperty(0, {
      range: new Range(MIN_ZOOM_LEVEL, MAX_ZOOM_LEVEL),
      numberType: "Integer",
      ...(tandem && { tandem: tandem.createTandem("zoomLevelProperty") }),
    });
    this.slicePlaneProperty = new StringUnionProperty<SlicePlane>("xz", {
      validValues: SLICE_PLANE_VALUES,
      ...(tandem && { tandem: tandem.createTandem("slicePlaneProperty") }),
    });
    this.sliceOffsetFractionProperty = new NumberProperty(0, {
      range: new Range(-1, 1),
      ...(tandem && { tandem: tandem.createTandem("sliceOffsetFractionProperty") }),
    });
    this.sliceColoringProperty = new StringUnionProperty<SliceColoring>("phase", {
      validValues: SLICE_COLORING_VALUES,
      ...(tandem && { tandem: tandem.createTandem("sliceColoringProperty") }),
    });
    this.nodesVisibleProperty = new BooleanProperty(true, {
      ...(tandem && { tandem: tandem.createTandem("nodesVisibleProperty") }),
    });

    const { nProperty, lProperty, mProperty } = this.quantumNumbers;

    this.wavefunctionProperty = new DerivedProperty(
      [nProperty, lProperty, mProperty, this.nuclearChargeProperty, this.basisProperty],
      (n, l, m, nuclearCharge, basis) => new Wavefunction(orbitalTerms(n, l, m, basis), nuclearCharge),
    );
    this.summaryProperty = new DerivedProperty(
      [nProperty, lProperty, mProperty, this.nuclearChargeProperty, this.basisProperty],
      (n, l, m, nuclearCharge, basis) => computeOrbitalSummary(n, l, m, nuclearCharge, basis),
    );
    this.viewHalfWidthProperty = new DerivedProperty(
      [nProperty, lProperty, this.zoomLevelProperty],
      (n, l, zoomLevel) =>
        hydrogenEnclosingRadius(n, l, MIN_NUCLEAR_CHARGE, VIEW_ENCLOSED_FRACTION) / ZOOM_STEP_FACTOR ** zoomLevel,
    );
    this.sliceOffsetProperty = new DerivedProperty(
      [this.sliceOffsetFractionProperty, this.viewHalfWidthProperty],
      (fraction, halfWidth) => fraction * halfWidth,
    );
  }

  public reset(): void {
    this.nodes3DVisibleProperty.reset();
    this.cuttingPlaneVisibleProperty.reset();
    this.probeFractionProperty.reset();
    this.renderModeProperty.reset();
    this.enclosedFractionProperty.reset();
    this.quantumNumbers.reset();
    this.nuclearChargeProperty.reset();
    this.basisProperty.reset();
    this.zoomLevelProperty.reset();
    this.slicePlaneProperty.reset();
    this.sliceOffsetFractionProperty.reset();
    this.sliceColoringProperty.reset();
    this.nodesVisibleProperty.reset();
  }

  public step(_dt: number): void {
    // The Orbitals screen shows stationary states; nothing evolves in time.
  }

  public dispose(): void {
    this.nodes3DVisibleProperty.dispose();
    this.cuttingPlaneVisibleProperty.dispose();
    this.probeFractionProperty.dispose();
    this.renderModeProperty.dispose();
    this.enclosedFractionProperty.dispose();
    this.sliceOffsetProperty.dispose();
    this.viewHalfWidthProperty.dispose();
    this.summaryProperty.dispose();
    this.wavefunctionProperty.dispose();
    this.quantumNumbers.dispose();
    this.nuclearChargeProperty.dispose();
    this.basisProperty.dispose();
    this.zoomLevelProperty.dispose();
    this.slicePlaneProperty.dispose();
    this.sliceOffsetFractionProperty.dispose();
    this.sliceColoringProperty.dispose();
    this.nodesVisibleProperty.dispose();
  }
}
