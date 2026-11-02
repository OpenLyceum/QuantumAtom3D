import type { TReadOnlyProperty } from "scenerystack/axon";
import { hydrogenEnclosingRadius } from "../../common/model/hydrogen/HydrogenRadial.js";
import { MetropolisSampler } from "../../common/model/orbital/MetropolisSampler.js";
import type { OrbitalTerm } from "../../common/model/orbital/OrbitalTerm.js";
import { peakDensity } from "../../common/model/orbital/PeakDensity.js";
import { Wavefunction } from "../../common/model/orbital/Wavefunction.js";
import { InteractiveOrbitalCanvas } from "../../common/view/InteractiveOrbitalCanvas.js";
import { ProgressiveSurface } from "../../common/view/ProgressiveSurface.js";
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
  private dotSnapshot: Wavefunction | null = null;
  private lastDotWave: Wavefunction | null = null;
  private lastDotTime = -Infinity;
  private readonly surface = new ProgressiveSurface();
  private surfaceRadius = 1;
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
  private updateDots(
    terms: readonly OrbitalTerm[],
    charge: number,
    wave: Wavefunction,
    mode: string,
    playing: boolean,
    now: number,
  ): boolean {
    let pointsChanged = false;
    if (mode === "dots") {
      this.sampler ??= new MetropolisSampler(terms, charge, 3000, quantumAtom3DQueryParameters.seed);
      if (!playing && this.sampler.isUpdating && this.dotSnapshot !== wave) {
        this.sampler.cancel();
      }
      if (!this.sampler.isUpdating && this.lastDotWave !== wave && (!playing || now - this.lastDotTime >= 100)) {
        this.dotSnapshot = wave;
        this.sampler.begin(wave, this.points ? 2 : 16);
      }
      const points = this.sampler.advance();
      if (points) {
        this.points = points;
        pointsChanged = true;
        this.lastDotWave = this.dotSnapshot;
        this.lastDotTime = now;
      }
    } else {
      this.sampler?.cancel();
    }
    this.samplingPendingProperty.value = mode === "dots" && !!this.sampler?.isUpdating && !this.points;
    return pointsChanged;
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
      this.lastDotWave = null;
      this.lastDotTime = -Infinity;
      this.dotSnapshot = null;
      this.surface.reset();
      this.surfaceRadius = Math.max(1, ...terms.map((term) => hydrogenEnclosingRadius(term.n, term.l, charge, 0.9999)));
    }
    const playing = model.timer.isPlayingProperty.value;
    const pointsChanged = this.updateDots(terms, charge, wave, mode, playing, now);
    const previousLevel = this.surface.level;
    if (mode === "isosurface") {
      this.surface.step(wave, this.surfaceRadius, 0.9, playing);
    } else if (this.surface.pending) {
      this.surface.reset();
    }
    this.surfacePendingProperty.value = this.surface.pending;
    const interval = mode === "dots" ? 100 : this.engine.backend === "cpu" ? 100 : 0;
    if (
      stateChanged ||
      pointsChanged ||
      this.surface.level !== previousLevel ||
      style !== this.lastStyle ||
      (wave !== this.lastWave && (!playing || now - this.lastSceneTime >= interval))
    ) {
      this.engine.setScene({
        opacityGain: 16,
        terms: wave.terms,
        nuclearCharge: charge,
        inversePeakAmplitude: this.inversePeak,
        radius: model.viewHalfWidthProperty.value,
        coloring: model.coloringProperty.value,
        phaseColormap: this.palette.value,
        mode: mode === "isosurface" && this.surface.level === 0 ? "volume" : mode,
        isoLevel: this.surface.level,
        ...(this.points && { points: this.points }),
      });
      this.lastWave = wave;
      this.lastStyle = style;
      this.lastSceneTime = now;
    }
    super.step();
  }
}
