import { DerivedProperty, NumberProperty, StringUnionProperty } from "scenerystack/axon";
import { Range } from "scenerystack/dot";
import { Wavefunction } from "../../common/model/orbital/Wavefunction.js";
import {
  cartesianExpansion,
  cartesianStates,
  oscillatorDegeneracy,
  sphericalStates,
} from "../../common/model/oscillator/OscillatorStates.js";
export class OscillatorModel {
  public readonly shellProperty = new NumberProperty(1, { range: new Range(0, 4), numberType: "Integer" });
  public readonly basisProperty = new StringUnionProperty<"cartesian" | "spherical">("cartesian", {
    validValues: ["cartesian", "spherical"],
  });
  public readonly cartesianIndexProperty = new NumberProperty(0, { numberType: "Integer" });
  public readonly sphericalIndexProperty = new NumberProperty(1, { numberType: "Integer" });
  public readonly indexRangeProperty = new DerivedProperty(
    [this.shellProperty],
    (N) => new Range(0, oscillatorDegeneracy(N) - 1),
  );
  public readonly zoomProperty = new NumberProperty(0, { range: new Range(-2, 3), numberType: "Integer" });
  public readonly viewHalfWidthProperty = new DerivedProperty([this.zoomProperty], (zoom) => 5.5 / Math.SQRT2 ** zoom);
  public readonly modeProperty = new StringUnionProperty<"volume" | "isosurface">("volume", {
    validValues: ["volume", "isosurface"],
  });
  public readonly coloringProperty = new StringUnionProperty<"phase" | "density">("phase", {
    validValues: ["phase", "density"],
  });
  public readonly wavefunctionProperty = new DerivedProperty(
    [this.shellProperty, this.basisProperty, this.cartesianIndexProperty, this.sphericalIndexProperty],
    (N, basis, cartIndex, sphereIndex) => {
      const cart = cartesianStates(N)[cartIndex] ?? cartesianStates(N)[0] ?? [0, 0, 0];
      const sphere = sphericalStates(N)[sphereIndex] ?? sphericalStates(N)[0] ?? { nr: 0, l: 0, m: 0 };
      return new Wavefunction(
        basis === "cartesian" ? cartesianExpansion(cart) : [{ n: sphere.nr, l: sphere.l, m: sphere.m, re: 1, im: 0 }],
        1,
        "oscillator",
      );
    },
  );
  public constructor() {
    this.indexRangeProperty.link((range) => {
      this.cartesianIndexProperty.value = range.constrainValue(this.cartesianIndexProperty.value);
      this.sphericalIndexProperty.value = range.constrainValue(this.sphericalIndexProperty.value);
    });
  }
  public step(_dt: number): void {
    /* Stationary eigenstates. */
  }
  public reset(): void {
    this.shellProperty.reset();
    this.basisProperty.reset();
    this.cartesianIndexProperty.reset();
    this.sphericalIndexProperty.reset();
    this.zoomProperty.reset();
    this.modeProperty.reset();
    this.coloringProperty.reset();
  }
  public dispose(): void {
    this.wavefunctionProperty.dispose();
    this.indexRangeProperty.dispose();
    this.viewHalfWidthProperty.dispose();
    this.shellProperty.dispose();
    this.basisProperty.dispose();
    this.cartesianIndexProperty.dispose();
    this.sphericalIndexProperty.dispose();
    this.zoomProperty.dispose();
    this.modeProperty.dispose();
    this.coloringProperty.dispose();
  }
}
