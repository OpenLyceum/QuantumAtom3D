/** Six editable complex coefficients, normalized coherent evolution, and a composed playback clock. */
import {
  DerivedProperty,
  Multilink,
  NumberProperty,
  Property,
  StringUnionProperty,
  type UnknownMultilink,
} from "scenerystack/axon";
import { Range } from "scenerystack/dot";
import type { TModel } from "scenerystack/joist";
import { hydrogenEnclosingRadius } from "../../common/model/hydrogen/HydrogenRadial.js";
import type { OrbitalTerm } from "../../common/model/orbital/OrbitalTerm.js";
import { QuantumNumbersModel } from "../../common/model/orbital/QuantumNumbersModel.js";
import { positionExpectations } from "../../common/model/orbital/SuperpositionExpectations.js";
import { SUPERPOSITION_PRESETS, type SuperpositionPreset } from "../../common/model/orbital/SuperpositionPresets.js";
import { evolveTerms, normalizeTerms } from "../../common/model/orbital/SuperpositionState.js";
import { Wavefunction } from "../../common/model/orbital/Wavefunction.js";
import { TimeModel } from "../../common/TimeModel.js";

export class CoefficientRow {
  public readonly quantumNumbers = new QuantumNumbersModel({ maxN: 5, initialN: 1, initialL: 0, initialM: 0 });
  public readonly magnitudeProperty = new NumberProperty(0, { range: new Range(0, 1) });
  public readonly phaseProperty = new NumberProperty(0, { range: new Range(-Math.PI, Math.PI) });
  public get term(): OrbitalTerm {
    const { nProperty, lProperty, mProperty } = this.quantumNumbers;
    return {
      n: nProperty.value,
      l: lProperty.value,
      m: mProperty.value,
      re: this.magnitudeProperty.value * Math.cos(this.phaseProperty.value),
      im: this.magnitudeProperty.value * Math.sin(this.phaseProperty.value),
    };
  }
  public set(term: OrbitalTerm): void {
    this.quantumNumbers.set(term.n, term.l, term.m);
    this.magnitudeProperty.value = Math.hypot(term.re, term.im);
    this.phaseProperty.value = Math.atan2(term.im, term.re);
  }
  public dispose(): void {
    this.quantumNumbers.dispose();
    this.magnitudeProperty.dispose();
    this.phaseProperty.dispose();
  }
}

export class SuperpositionModel implements TModel {
  public readonly timer = new TimeModel();
  /** Physical time in hbar/E_h. Playback speed is atomic time units per wall-clock second. */
  public readonly timeProperty = new NumberProperty(0);
  public readonly speedProperty = new NumberProperty(4, { range: new Range(0.25, 12) });
  public readonly nuclearChargeProperty = new NumberProperty(1, { range: new Range(1, 6), numberType: "Integer" });
  public readonly termCountProperty = new NumberProperty(2, { range: new Range(1, 6), numberType: "Integer" });
  public readonly rows = Array.from({ length: 6 }, () => new CoefficientRow());
  public readonly termsProperty = new Property<readonly OrbitalTerm[]>(SUPERPOSITION_PRESETS.dipole);
  public readonly renderModeProperty = new StringUnionProperty<"volume" | "dots" | "isosurface">("volume", {
    validValues: ["volume", "dots", "isosurface"],
  });
  public readonly coloringProperty = new StringUnionProperty<"phase" | "density">("phase", {
    validValues: ["phase", "density"],
  });
  public readonly zoomProperty = new NumberProperty(0, { range: new Range(-2, 3), numberType: "Integer" });
  public readonly wavefunctionProperty = new DerivedProperty(
    [this.termsProperty, this.nuclearChargeProperty, this.timeProperty],
    (terms, z, time) => new Wavefunction(evolveTerms(terms, z, time), z),
  );
  public readonly expectationsProperty = new DerivedProperty([this.wavefunctionProperty], (wave) =>
    positionExpectations(wave.terms, wave.nuclearCharge),
  );
  public readonly viewHalfWidthProperty = new DerivedProperty(
    [this.termsProperty, this.zoomProperty],
    (terms, zoom) =>
      Math.max(5, ...terms.map((term) => hydrogenEnclosingRadius(term.n, term.l, 1, 0.995))) / Math.SQRT2 ** zoom,
  );
  private readonly links: UnknownMultilink[] = [];
  private changingPreset = false;
  private disposed = false;

  public constructor() {
    const update = () => {
      if (!this.changingPreset) {
        this.termsProperty.value = normalizeTerms(
          this.rows.slice(0, this.termCountProperty.value).map((row) => row.term),
        );
        this.timeProperty.value = 0;
      }
    };
    for (const row of this.rows) {
      this.links.push(
        Multilink.lazyMultilink(
          [
            row.quantumNumbers.nProperty,
            row.quantumNumbers.lProperty,
            row.quantumNumbers.mProperty,
            row.magnitudeProperty,
            row.phaseProperty,
          ],
          update,
        ),
      );
    }
    this.links.push(Multilink.lazyMultilink([this.termCountProperty], update));
    this.loadPreset("dipole");
  }

  public loadPreset(preset: SuperpositionPreset): void {
    this.changingPreset = true;
    const terms = SUPERPOSITION_PRESETS[preset];
    this.rows.forEach((row, index) => {
      row.set(terms[index] ?? { n: 1, l: 0, m: 0, re: 0, im: 0 });
    });
    this.termCountProperty.value = terms.length;
    this.changingPreset = false;
    this.termsProperty.value = terms;
    this.timer.reset();
    this.timeProperty.value = 0;
  }

  /** Single-step advances even while paused, unlike the normal animation callback. */
  public advance(dt: number): void {
    if (!Number.isFinite(dt) || dt <= 0) {
      return;
    }
    this.timeProperty.value += Math.max(0, dt) * this.speedProperty.value;
  }
  public step(dt: number): void {
    if (this.timer.isPlayingProperty.value) {
      this.advance(dt);
    }
    this.timer.step(dt);
  }
  public reset(): void {
    this.loadPreset("dipole");
    this.nuclearChargeProperty.reset();
    this.speedProperty.reset();
    this.renderModeProperty.reset();
    this.coloringProperty.reset();
    this.zoomProperty.reset();
  }
  public dispose(): void {
    if (this.disposed) {
      return;
    }
    this.disposed = true;
    for (const link of this.links) {
      link.dispose();
    }
    this.expectationsProperty.dispose();
    this.wavefunctionProperty.dispose();
    this.viewHalfWidthProperty.dispose();
    for (const row of this.rows) {
      row.dispose();
    }
    this.termsProperty.dispose();
    this.termCountProperty.dispose();
    this.nuclearChargeProperty.dispose();
    this.timer.dispose();
    this.timeProperty.dispose();
    this.speedProperty.dispose();
    this.renderModeProperty.dispose();
    this.coloringProperty.dispose();
    this.zoomProperty.dispose();
  }
}
