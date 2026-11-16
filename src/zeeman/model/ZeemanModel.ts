/** Fine-structure Zeeman controls. Energies and magnetic fields stay in Hartree atomic units. */
import { DerivedProperty, NumberProperty, StringUnionProperty } from "scenerystack/axon";
import { Range } from "scenerystack/dot";
import { teslaToAtomicField } from "../../common/model/AtomicUnits.js";
import { type AngularVector, angularMagnitude, orbitalVector } from "../../common/model/angular/VectorModel.js";
import {
  weakFieldCap,
  type ZeemanLevel,
  type ZeemanMode,
  zeemanLevels,
  zeemanTransitions,
} from "../../common/model/angular/ZeemanLevels.js";
import { TimeModel } from "../../common/TimeModel.js";
import { ZEEMAN_MODEL_SETTINGS } from "../../QuantumAtom3DConstants.js";

/** Schematic Larmor readout for the selected upper level. Period is in atomic time. */
export type LarmorStatus = { kind: "off" } | { kind: "zeroQ" } | { kind: "period"; period: number };

export class ZeemanModel {
  public readonly modeProperty = new StringUnionProperty<ZeemanMode>("normal", {
    validValues: ["normal", "anomalous"],
  });
  public readonly lineProperty = new StringUnionProperty<"halpha" | "lyalpha">("halpha", {
    validValues: ["halpha", "lyalpha"],
  });
  public readonly directionProperty = new StringUnionProperty<"perpendicular" | "along">("perpendicular", {
    validValues: ["perpendicular", "along"],
  });
  public readonly nuclearChargeProperty = new NumberProperty(1, {
    range: new Range(1, ZEEMAN_MODEL_SETTINGS.NUCLEAR_CHARGE_RANGE_MAX),
    numberType: "Integer",
  });
  public readonly fieldFractionProperty = new NumberProperty(ZEEMAN_MODEL_SETTINGS.FIELD_FRACTION_DEFAULT, {
    range: new Range(0, 1),
  });
  public readonly selectedIndexProperty = new NumberProperty(1, { numberType: "Integer" });
  public readonly timer = new TimeModel();
  public readonly phaseProperty = new NumberProperty(0);
  public readonly upperNProperty = new DerivedProperty([this.lineProperty], (line) => (line === "halpha" ? 3 : 2));
  public readonly lowerNProperty = new DerivedProperty([this.lineProperty], (line) => (line === "halpha" ? 2 : 1));
  public readonly capProperty = new DerivedProperty(
    [this.upperNProperty, this.lowerNProperty, this.nuclearChargeProperty, this.modeProperty],
    (upper, lower, z, mode) => (mode === "normal" ? teslaToAtomicField(1) : weakFieldCap(upper, lower, z)),
  );
  public readonly fieldProperty = new DerivedProperty(
    [this.capProperty, this.fieldFractionProperty],
    (cap, fraction) => cap * fraction,
  );
  public readonly upperLevelsProperty = new DerivedProperty(
    [this.upperNProperty, this.nuclearChargeProperty, this.fieldProperty, this.modeProperty],
    zeemanLevels,
  );
  public readonly lowerLevelsProperty = new DerivedProperty(
    [this.lowerNProperty, this.nuclearChargeProperty, this.fieldProperty, this.modeProperty],
    zeemanLevels,
  );
  public readonly transitionsProperty = new DerivedProperty(
    [this.upperLevelsProperty, this.lowerLevelsProperty, this.modeProperty, this.directionProperty],
    (upper, lower, mode, direction) => zeemanTransitions(upper, lower, mode, direction === "along"),
  );
  public readonly selectedRangeProperty = new DerivedProperty(
    [this.upperLevelsProperty],
    (levels) => new Range(0, levels.length - 1),
  );
  public readonly selectedLevelProperty = new DerivedProperty(
    [this.upperLevelsProperty, this.selectedIndexProperty],
    (levels, index): ZeemanLevel | null => levels[index] ?? null,
  );
  /** Angular-momentum quantum number for the cone: l (normal) or j (anomalous). */
  public readonly selectedQProperty = new DerivedProperty(
    [this.selectedLevelProperty, this.modeProperty],
    (level, mode) => (level ? (mode === "normal" ? level.l : level.j) : 0),
  );
  public readonly larmorStatusProperty = new DerivedProperty(
    [this.selectedLevelProperty, this.selectedQProperty, this.fieldProperty],
    (level, q, field): LarmorStatus => {
      if (!level || field === 0) {
        return { kind: "off" };
      }
      if (q === 0) {
        return { kind: "zeroQ" };
      }
      return { kind: "period", period: (4 * Math.PI) / (level.g * field) };
    },
  );
  public readonly precessionVectorProperty = new DerivedProperty(
    [this.selectedQProperty, this.selectedLevelProperty, this.phaseProperty],
    (q, level, phase): AngularVector | null => (level && q > 0 ? orbitalVector(q, level.m, phase) : null),
  );
  /** Maps |L| near unit length; the view multiplies by its layout pixel scale. */
  public readonly precessionScaleProperty = new DerivedProperty(
    [this.selectedQProperty],
    (q) => 1 / Math.max(1, angularMagnitude(q)),
  );
  public constructor() {
    this.selectedRangeProperty.link((range) => {
      this.selectedIndexProperty.value = range.constrainValue(this.selectedIndexProperty.value);
    });
  }
  /** Single-step advances even while paused, unlike the animation callback. */
  public advancePhase(): void {
    this.phaseProperty.value =
      (this.phaseProperty.value + ZEEMAN_MODEL_SETTINGS.STEP_PHASE * this.fieldFractionProperty.value) % (2 * Math.PI);
  }
  public step(dt: number): void {
    if (!Number.isFinite(dt) || dt <= 0) {
      return;
    }
    if (this.timer.isPlayingProperty.value) {
      this.phaseProperty.value =
        (this.phaseProperty.value +
          Math.max(0, dt) * ZEEMAN_MODEL_SETTINGS.PRECESSION_RATE * this.fieldFractionProperty.value) %
        (2 * Math.PI);
    }
    this.timer.step(dt);
  }
  public reset(): void {
    this.modeProperty.reset();
    this.lineProperty.reset();
    this.directionProperty.reset();
    this.nuclearChargeProperty.reset();
    this.fieldFractionProperty.reset();
    this.selectedIndexProperty.reset();
    this.phaseProperty.reset();
    this.timer.reset();
  }
  public dispose(): void {
    this.precessionScaleProperty.dispose();
    this.precessionVectorProperty.dispose();
    this.larmorStatusProperty.dispose();
    this.selectedQProperty.dispose();
    this.selectedLevelProperty.dispose();
    this.selectedRangeProperty.dispose();
    this.transitionsProperty.dispose();
    this.upperLevelsProperty.dispose();
    this.lowerLevelsProperty.dispose();
    this.fieldProperty.dispose();
    this.capProperty.dispose();
    this.upperNProperty.dispose();
    this.lowerNProperty.dispose();
    this.modeProperty.dispose();
    this.lineProperty.dispose();
    this.directionProperty.dispose();
    this.nuclearChargeProperty.dispose();
    this.fieldFractionProperty.dispose();
    this.selectedIndexProperty.dispose();
    this.phaseProperty.dispose();
    this.timer.dispose();
  }
}
