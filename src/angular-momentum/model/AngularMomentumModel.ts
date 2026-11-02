/** Quantum angular-momentum controls and a schematic precession clock. */
import { BooleanProperty, DerivedProperty, NumberProperty, Property, StringUnionProperty } from "scenerystack/axon";
import { Range } from "scenerystack/dot";
import { coupledVectors, orbitalVector } from "../../common/model/angular/VectorModel.js";
import { TimeModel } from "../../common/TimeModel.js";
export class AngularMomentumModel {
  public readonly lProperty = new NumberProperty(1, { range: new Range(0, 4), numberType: "Integer" });
  public readonly mProperty = new NumberProperty(0, { numberType: "Integer" });
  public readonly mRangeProperty = new Property(new Range(-1, 1));
  public readonly spinProperty = new BooleanProperty(false);
  public readonly branchProperty = new StringUnionProperty<"upper" | "lower">("upper", {
    validValues: ["upper", "lower"],
  });
  public readonly jProperty = new DerivedProperty([this.lProperty, this.branchProperty], (l, branch) =>
    l === 0 ? 0.5 : l + (branch === "upper" ? 0.5 : -0.5),
  );
  public readonly mjProperty = new NumberProperty(0.5);
  public readonly mjRangeProperty = new Property(new Range(-1.5, 1.5));
  public readonly phaseProperty = new NumberProperty(0, { range: new Range(0, 2 * Math.PI) });
  public readonly timer = new TimeModel();
  public readonly vectorsProperty = new DerivedProperty(
    [this.lProperty, this.mProperty, this.spinProperty, this.jProperty, this.mjProperty, this.phaseProperty],
    (l, m, spin, j, mj, phase) =>
      spin
        ? coupledVectors(l, j, mj, phase, 2 * phase)
        : { orbital: orbitalVector(l, m, phase), spin: [0, 0, 0] as const, total: orbitalVector(l, m, phase) },
  );
  public constructor() {
    this.lProperty.link((l) => {
      this.mProperty.value = Math.max(-l, Math.min(l, this.mProperty.value));
      this.mRangeProperty.value = new Range(-l, l);
    });
    this.jProperty.link((j) => {
      this.mjProperty.value = Math.max(-j, Math.min(j, this.mjProperty.value));
      this.mjRangeProperty.value = new Range(-j, j);
    });
  }
  public step(dt: number): void {
    if (!Number.isFinite(dt) || dt <= 0) {
      return;
    }
    if (this.timer.isPlayingProperty.value) {
      this.phaseProperty.value = (this.phaseProperty.value + Math.max(0, dt) * 0.7) % (2 * Math.PI);
    }
    this.timer.step(dt);
  }
  public reset(): void {
    this.lProperty.reset();
    this.mProperty.reset();
    this.spinProperty.reset();
    this.branchProperty.reset();
    this.mjProperty.reset();
    this.phaseProperty.reset();
    this.timer.reset();
  }
  public dispose(): void {
    this.vectorsProperty.dispose();
    this.jProperty.dispose();
    this.lProperty.dispose();
    this.mProperty.dispose();
    this.mRangeProperty.dispose();
    this.spinProperty.dispose();
    this.branchProperty.dispose();
    this.mjProperty.dispose();
    this.mjRangeProperty.dispose();
    this.phaseProperty.dispose();
    this.timer.dispose();
  }
}
