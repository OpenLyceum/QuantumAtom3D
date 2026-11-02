import { expect, it } from "vitest";
import { AngularMomentumModel } from "../src/angular-momentum/model/AngularMomentumModel.js";
import { SuperpositionModel } from "../src/superposition/model/SuperpositionModel.js";
import { ZeemanModel } from "../src/zeeman/model/ZeemanModel.js";

it("ignores invalid frame durations in all three animated screens", () => {
  const models = [new AngularMomentumModel(), new SuperpositionModel(), new ZeemanModel()];
  for (const model of models) {
    model.timer.isPlayingProperty.value = true;
    for (const dt of [NaN, Infinity, -Infinity, -1, 0]) {
      model.step(dt);
    }
    expect(model.timer.timeProperty.value).toBe(0);
    if (model instanceof SuperpositionModel) {
      expect(model.timeProperty.value).toBe(0);
    } else {
      expect(model.phaseProperty.value).toBe(0);
    }
    model.step(0.1);
    expect(model.timer.timeProperty.value).toBeCloseTo(0.1);
    model.dispose();
  }
});
