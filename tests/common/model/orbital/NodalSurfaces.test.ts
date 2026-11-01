import { describe, expect, it } from "vitest";
import {
  azimuthalNodeAngles,
  nodalSurfaces,
  polarNodeAngles,
} from "../../../../src/common/model/orbital/NodalSurfaces.js";
import { QuantumNumbersModel } from "../../../../src/common/model/orbital/QuantumNumbersModel.js";

describe("NodalSurfaces", () => {
  it("puts the 3d_z² cones at θ = arccos(±1/√3) = 54.74° and 125.26°", () => {
    const angles = polarNodeAngles(2, 0).map((a) => (a * 180) / Math.PI);
    expect(angles).toHaveLength(2);
    expect(angles[0]).toBeCloseTo(54.7356, 3);
    expect(angles[1]).toBeCloseTo(125.2644, 3);
  });

  it("p_z has the xy-plane as its only polar node", () => {
    expect(polarNodeAngles(1, 0)).toHaveLength(1);
    expect(polarNodeAngles(1, 0)[0]).toBeCloseTo(Math.PI / 2, 10);
    expect(polarNodeAngles(1, 1)).toHaveLength(0);
  });

  it("counts n − l − 1 radial and l angular nodes in the real basis", () => {
    for (let n = 1; n <= 5; n++) {
      for (let l = 0; l < n; l++) {
        for (let m = -l; m <= l; m++) {
          const real = nodalSurfaces(n, l, m, 1, "real");
          expect(real.radialNodeRadii).toHaveLength(n - l - 1);
          expect(real.polarNodeAngles.length + real.azimuthalNodeAngles.length).toBe(l);
          const complex = nodalSurfaces(n, l, m, 1, "complex");
          expect(complex.azimuthalNodeAngles).toHaveLength(0);
          expect(complex.polarNodeAngles).toHaveLength(l - Math.abs(m));
        }
      }
    }
  });

  it("d_xy has nodal planes x = 0 and y = 0; d_x²−y² has the diagonals", () => {
    expect(azimuthalNodeAngles(-2)).toEqual([0, Math.PI / 2]);
    expect(azimuthalNodeAngles(2)[0]).toBeCloseTo(Math.PI / 4, 12);
    expect(azimuthalNodeAngles(2)[1]).toBeCloseTo((3 * Math.PI) / 4, 12);
  });
});

describe("QuantumNumbersModel", () => {
  it("clamps l and m when n or l drops, and resets in order", () => {
    const model = new QuantumNumbersModel({ maxN: 5, initialN: 2, initialL: 1, initialM: 0 });
    model.set(4, 3, -3);
    expect(model.mRangeProperty.value.min).toBe(-3);
    model.nProperty.value = 2;
    expect(model.lProperty.value).toBe(1);
    expect(model.mProperty.value).toBe(-1);
    expect(model.lRangeProperty.value.max).toBe(1);
    expect(model.mRangeProperty.value.max).toBe(1);
    model.set(5, 4, 4);
    model.reset();
    expect([model.nProperty.value, model.lProperty.value, model.mProperty.value]).toEqual([2, 1, 0]);
    expect(model.lRangeProperty.value.max).toBe(1);
    model.dispose();
  });
});
