import type { TReadOnlyProperty } from "scenerystack/axon";
import { hydrogenEnclosingRadius } from "../../common/model/hydrogen/HydrogenRadial.js";
import { buildDensityGrid, enclosedProbabilityLevel } from "../../common/model/orbital/EnclosedProbability.js";
import { MetropolisSampler } from "../../common/model/orbital/MetropolisSampler.js";
import type { OrbitalTerm } from "../../common/model/orbital/OrbitalTerm.js";
import { peakDensity } from "../../common/model/orbital/PeakDensity.js";
import { Wavefunction } from "../../common/model/orbital/Wavefunction.js";
import { InteractiveOrbitalCanvas } from "../../common/view/InteractiveOrbitalCanvas.js";
import type { RenderQuality } from "../../preferences/QuantumAtom3DPreferencesModel.js";
import quantumAtom3DQueryParameters from "../../preferences/quantumAtom3DQueryParameters.js";
import type { PhaseColormap } from "../../QuantumAtom3DConstants.js";
import type { SuperpositionModel } from "../model/SuperpositionModel.js";

/** Throttle animated CPU scenes and probability grids while preserving the latest paused frame. */
export class SuperpositionViewportNode extends InteractiveOrbitalCanvas {
  private readonly model: SuperpositionModel;
  private readonly palette: TReadOnlyProperty<PhaseColormap>;
  private lastTerms: readonly OrbitalTerm[] | null = null;
  private lastCharge = 0;
  private lastWave: Wavefunction | null = null;
  private lastStyle = "";
  private inversePeak = 0;
  private sampler: MetropolisSampler | null = null;
  private points: Float32Array | undefined;
  private isoLevel = 0;
  private lastGridTime = -Infinity;
  private lastSceneTime = -Infinity;
  public constructor(
    size: number,
    model: SuperpositionModel,
    palette: TReadOnlyProperty<PhaseColormap>,
    quality?: TReadOnlyProperty<RenderQuality>,
  ) {
    super(size, model.zoomProperty, quality);
    this.model = model;
    this.palette = palette;
  }
  public override step(): void {
    const model = this.model;
    const now = performance.now();
    const terms = model.termsProperty.value;
    const charge = model.nuclearChargeProperty.value;
    const wave = model.wavefunctionProperty.value;
    const stateChanged = terms !== this.lastTerms || charge !== this.lastCharge;
    const mode = model.renderModeProperty.value;
    const style = `${mode},${model.coloringProperty.value},${this.palette.value},${model.viewHalfWidthProperty.value}`;
    if (stateChanged) {
      this.lastTerms = terms;
      this.lastCharge = charge;
      // Triangle bound is independent of relative phase; animation cannot change its brightness scale.
      const peak = terms.reduce(
        (sum, term) =>
          sum +
          Math.hypot(term.re, term.im) * Math.sqrt(peakDensity(new Wavefunction([{ ...term, re: 1, im: 0 }], charge))),
        0,
      );
      this.inversePeak = peak > 0 ? 1 / peak : 0;
      this.sampler = null;
      this.points = undefined;
      this.lastGridTime = -Infinity;
    }
    const playing = model.timer.isPlayingProperty.value;
    const interval = mode === "dots" ? 100 : this.engine.backend === "cpu" ? 100 : 0;
    if (
      stateChanged ||
      style !== this.lastStyle ||
      (wave !== this.lastWave && (!playing || now - this.lastSceneTime >= interval))
    ) {
      if (mode === "dots") {
        const fresh = !this.sampler;
        this.sampler ??= new MetropolisSampler(terms, charge, 3000, quantumAtom3DQueryParameters.seed);
        this.points = this.sampler.update(wave, fresh ? 16 : 2);
      }
      if (
        mode === "isosurface" &&
        (stateChanged || mode !== this.lastStyle.split(",")[0] || !playing || now - this.lastGridTime >= 250)
      ) {
        const halfWidth = Math.max(1, ...terms.map((term) => hydrogenEnclosingRadius(term.n, term.l, charge, 0.9999)));
        this.isoLevel = terms.length > 0 ? enclosedProbabilityLevel(buildDensityGrid(wave, halfWidth), 0.9) : 0;
        this.lastGridTime = now;
      }
      this.engine.setScene({
        opacityGain: 16,
        terms: wave.terms,
        nuclearCharge: charge,
        inversePeakAmplitude: this.inversePeak,
        radius: model.viewHalfWidthProperty.value,
        coloring: model.coloringProperty.value,
        phaseColormap: this.palette.value,
        mode,
        isoLevel: this.isoLevel,
        ...(this.points && { points: this.points }),
      });
      this.lastWave = wave;
      this.lastStyle = style;
      this.lastSceneTime = now;
    }
    super.step();
  }
}
