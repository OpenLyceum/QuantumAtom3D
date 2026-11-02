/** Fine-structure-only hydrogenic Zeeman model, in Hartree atomic units. Hyperfine and Lamb shifts omitted. */
import { FINE_STRUCTURE_CONSTANT as ALPHA } from "../AtomicUnits.js";
import { hydrogenEnergy } from "../hydrogen/HydrogenExpectations.js";
import { allowedJ } from "./VectorModel.js";

export type ZeemanMode = "normal" | "anomalous";
export type ZeemanLevel = {
  readonly n: number;
  readonly l: number;
  readonly j: number;
  readonly m: number;
  readonly g: number;
  readonly zeroEnergy: number;
  readonly energy: number;
};
export type Polarization = "pi" | "sigmaPlus" | "sigmaMinus";
export type ZeemanTransition = {
  readonly upper: ZeemanLevel;
  readonly lower: ZeemanLevel;
  readonly photonEnergy: number;
  readonly polarization: Polarization;
};

/** LS coupling with g_L=1 and g_S=2, excluding the electron anomalous magnetic moment. */
export function landeG(l: number, j: number, s = 0.5): number {
  return 1 + (j * (j + 1) + s * (s + 1) - l * (l + 1)) / (2 * j * (j + 1));
}

/** Dirac-Coulomb binding energy with rest energy removed, evaluated without subtracting nearly equal numbers. */
export function diracEnergy(n: number, j: number, z: number): number {
  const za = z * ALPHA;
  const k = j + 0.5;
  const defect = (za * za) / (k + Math.sqrt(k * k - za * za));
  const x = (za / (n - defect)) ** 2;
  const root = Math.sqrt(1 + x);
  return -x / (ALPHA * ALPHA * root * (1 + root));
}

export function zeemanLevels(n: number, z: number, field: number, mode: ZeemanMode): ZeemanLevel[] {
  const levels: ZeemanLevel[] = [];
  for (let l = 0; l < n; l++) {
    for (const j of mode === "normal" ? [l] : allowedJ(l)) {
      const g = mode === "normal" ? 1 : landeG(l, j);
      const zeroEnergy = mode === "normal" ? hydrogenEnergy(n, z) : diracEnergy(n, j, z);
      for (let m = -j; m <= j; m++) {
        levels.push({ n, l, j, m, g, zeroEnergy, energy: zeroEnergy + (field * g * m) / 2 });
      }
    }
  }
  return levels;
}

function zeemanAllowed(upper: ZeemanLevel, lower: ZeemanLevel, mode: ZeemanMode): boolean {
  return (
    Math.abs(upper.l - lower.l) === 1 &&
    Math.abs(upper.m - lower.m) <= 1 &&
    (mode === "normal" || (Math.abs(upper.j - lower.j) <= 1 && upper.j + lower.j > 0))
  );
}

/** Polarization convention: q = m_upper-m_lower, the emitted photon's angular momentum along +B. */
export function zeemanTransitions(
  upper: readonly ZeemanLevel[],
  lower: readonly ZeemanLevel[],
  mode: ZeemanMode,
  alongField = false,
): ZeemanTransition[] {
  const transitions: ZeemanTransition[] = [];
  for (const a of upper) {
    for (const b of lower) {
      // This screen models optical emission between principal shells, not same-n microwave transitions.
      if (a.n <= b.n || a.energy <= b.energy) {
        continue;
      }
      if (!zeemanAllowed(a, b, mode)) {
        continue;
      }
      const delta = a.m - b.m;
      if (alongField && delta === 0) {
        continue;
      }
      transitions.push({
        upper: a,
        lower: b,
        photonEnergy: a.energy - b.energy,
        polarization: delta === 0 ? "pi" : delta > 0 ? "sigmaPlus" : "sigmaMinus",
      });
    }
  }
  return transitions;
}

/** Cap the largest |g*m| mu_B B at 5% of the smallest nonzero same-(n,l) fine-structure gap. */
export function weakFieldCap(upperN: number, lowerN: number, z: number): number {
  let gap = Infinity;
  let moment = 1;
  for (const n of [upperN, lowerN]) {
    const levels = zeemanLevels(n, z, 0, "anomalous");
    for (const a of levels) {
      moment = Math.max(moment, Math.abs(a.g * a.m));
      for (const b of levels) {
        if (a.l === b.l && a.j !== b.j) {
          gap = Math.min(gap, Math.abs(a.zeroEnergy - b.zeroEnergy));
        }
      }
    }
  }
  return (0.1 * gap) / moment;
}

/** Coincident transitions are one spectral position; no oscillator-strength model is implied. */
export function distinctPhotonEnergies(transitions: readonly ZeemanTransition[], tolerance = 1e-12): number[] {
  const energies = transitions.map((transition) => transition.photonEnergy).sort((a, b) => a - b);
  return energies.filter((value, index) => index === 0 || Math.abs(value - (energies[index - 1] ?? value)) > tolerance);
}
