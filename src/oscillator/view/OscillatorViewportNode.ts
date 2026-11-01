import type { TReadOnlyProperty } from "scenerystack/axon";
import { buildDensityGrid, enclosedProbabilityLevel } from "../../common/model/orbital/EnclosedProbability.js";
import { peakDensity } from "../../common/model/orbital/PeakDensity.js";
import type { Wavefunction } from "../../common/model/orbital/Wavefunction.js";
import { InteractiveOrbitalCanvas } from "../../common/view/InteractiveOrbitalCanvas.js";
import type { PhaseColormap } from "../../QuantumAtom3DConstants.js";
import type { OscillatorModel } from "../model/OscillatorModel.js";
export class OscillatorViewportNode extends InteractiveOrbitalCanvas {
  private readonly model: OscillatorModel;
  private readonly palette: TReadOnlyProperty<PhaseColormap>;
  private lastWave: Wavefunction | null = null;
  private style = "";
  private inversePeak = 0;
  private isoLevel = 0;
  public constructor(size: number, model: OscillatorModel, palette: TReadOnlyProperty<PhaseColormap>) {
    super(size, model.zoomProperty);
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
      const peak = peakDensity(wave);
      this.inversePeak = peak > 0 ? 1 / Math.sqrt(peak) : 0;
      this.isoLevel = 0;
    }
    if (changed || style !== this.style) {
      if (model.modeProperty.value === "isosurface" && this.isoLevel === 0) {
        this.isoLevel = enclosedProbabilityLevel(buildDensityGrid(wave, 6), 0.9);
      }
      this.engine.setScene({
        family: "oscillator",
        terms: wave.terms,
        nuclearCharge: 1,
        inversePeakAmplitude: this.inversePeak,
        radius: model.viewHalfWidthProperty.value,
        coloring: model.coloringProperty.value,
        phaseColormap: this.palette.value,
        mode: model.modeProperty.value,
        isoLevel: this.isoLevel,
      });
      this.style = style;
    }
    super.step();
  }
}
