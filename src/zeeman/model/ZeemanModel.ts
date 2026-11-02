/** Fine-structure Zeeman controls. Energies and magnetic fields stay in Hartree atomic units. */
import { DerivedProperty, NumberProperty, StringUnionProperty } from "scenerystack/axon";
import { Range } from "scenerystack/dot";
import { teslaToAtomicField } from "../../common/model/AtomicUnits.js";
import {
  weakFieldCap,
  type ZeemanMode,
  zeemanLevels,
  zeemanTransitions,
} from "../../common/model/angular/ZeemanLevels.js";
import { TimeModel } from "../../common/TimeModel.js";
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
  public readonly nuclearChargeProperty = new NumberProperty(1, { range: new Range(1, 6), numberType: "Integer" });
  public readonly fieldFractionProperty = new NumberProperty(0.5, { range: new Range(0, 1) });
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
  public constructor() {
    this.selectedRangeProperty.link((range) => {
      this.selectedIndexProperty.value = range.constrainValue(this.selectedIndexProperty.value);
    });
  }
  public step(dt: number): void {
    if (!Number.isFinite(dt) || dt <= 0) {
      return;
    }
    if (this.timer.isPlayingProperty.value) {
      this.phaseProperty.value =
        (this.phaseProperty.value + Math.max(0, dt) * 2 * this.fieldFractionProperty.value) % (2 * Math.PI);
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
