import type { TReadOnlyProperty } from "scenerystack/axon";
import { peakDensity } from "../../common/model/orbital/PeakDensity.js";
import type { Wavefunction } from "../../common/model/orbital/Wavefunction.js";
import { cartesianPeakDensity, cartesianStates } from "../../common/model/oscillator/OscillatorStates.js";
import { InteractiveOrbitalCanvas } from "../../common/view/InteractiveOrbitalCanvas.js";
import { ProgressiveSurface } from "../../common/view/ProgressiveSurface.js";
import type { RenderQuality } from "../../preferences/QuantumAtom3DPreferencesModel.js";
import type { PhaseColormap } from "../../QuantumAtom3DConstants.js";
import type { OscillatorModel } from "../model/OscillatorModel.js";
export class OscillatorViewportNode extends InteractiveOrbitalCanvas {
  private readonly model: OscillatorModel;
  private readonly palette: TReadOnlyProperty<PhaseColormap>;
  private lastWave: Wavefunction | null = null;
  private style = "";
  private inversePeak = 0;
  private readonly surface = new ProgressiveSurface();
  public constructor(
    size: number,
    model: OscillatorModel,
    palette: TReadOnlyProperty<PhaseColormap>,
    quality?: TReadOnlyProperty<RenderQuality>,
  ) {
    super(size, model.zoomProperty, quality);
    this.model = model;
    this.palette = palette;
  }
  public override step(): void {
    const model = this.model;
    const wave = model.wavefunctionProperty.value;
    const changed = wave !== this.lastWave;
    const style = `${model.modeProperty.value},${model.coloringProperty.value},${model.viewHalfWidthProperty.value},${this.palette.value}`;
    if (changed) {
      this.lastWave = wave;
      const state = cartesianStates(model.shellProperty.value)[model.cartesianIndexProperty.value];
      const peak = model.basisProperty.value === "cartesian" && state ? cartesianPeakDensity(state) : peakDensity(wave);
      this.inversePeak = peak > 0 ? 1 / Math.sqrt(peak) : 0;
      this.surface.reset();
    }
    const previousLevel = this.surface.level;
    if (model.modeProperty.value === "isosurface") {
      this.surface.step(wave, 6);
    } else if (this.surface.pending) {
      this.surface.reset();
    }
    this.surfacePendingProperty.value = this.surface.pending;
    if (changed || style !== this.style || this.surface.level !== previousLevel) {
      this.engine.setScene({
        family: "oscillator",
        terms: wave.terms,
        nuclearCharge: 1,
        inversePeakAmplitude: this.inversePeak,
        radius: model.viewHalfWidthProperty.value,
        coloring: model.coloringProperty.value,
        phaseColormap: this.palette.value,
        mode:
          model.modeProperty.value === "isosurface" && this.surface.level === 0 ? "volume" : model.modeProperty.value,
        isoLevel: this.surface.level,
      });
      this.style = style;
    }
    super.step();
  }
}
