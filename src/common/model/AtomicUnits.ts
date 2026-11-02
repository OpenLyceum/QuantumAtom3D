/**
 * AtomicUnits.ts
 *
 * Every model in this sim works in Hartree atomic units: ħ = mₑ = e = 4πε₀ = 1,
 * so lengths are in Bohr radii (a0), energies in hartrees (E_h) and times in
 * ħ/E_h. This file is the one place where those units meet the display units
 * (pm, eV, fs, nm, T). Never scale by a bare number elsewhere.
 *
 * Values are CODATA 2018.
 */

import QuantumAtom3DNamespace from "../../QuantumAtom3DNamespace.js";

/** One hartree in electronvolts. */
const HARTREE_IN_EV = 27.211386245988;

/** One Bohr radius in picometres. */
const BOHR_RADIUS_IN_PM = 52.91772109;

/** One atomic unit of time (ħ/E_h) in femtoseconds. */
const ATOMIC_TIME_IN_FS = 0.024188843265857;

/** Fine-structure constant α (dimensionless). */
export const FINE_STRUCTURE_CONSTANT = 7.2973525693e-3;

/** Bohr magneton μ_B in eV per tesla. */
const BOHR_MAGNETON_EV_PER_T = 5.788381806e-5;

/** hc in eV·nm, so λ(nm) = HC_EV_NM / ΔE(eV). */
const HC_EV_NM = 1239.84198;

/** Converts an energy in hartrees to electronvolts. */
export function hartreeToEv(energy: number): number {
  return energy * HARTREE_IN_EV;
}

/** Converts a length in Bohr radii to picometres. */
export function bohrToPm(length: number): number {
  return length * BOHR_RADIUS_IN_PM;
}

/** Converts a time in atomic units to femtoseconds. */
export function atomicTimeToFs(time: number): number {
  return time * ATOMIC_TIME_IN_FS;
}

/** Atomic magnetic field: mu_B B = B_atomic/2 hartrees. */
export function teslaToAtomicField(field: number): number {
  return (2 * BOHR_MAGNETON_EV_PER_T * field) / HARTREE_IN_EV;
}
export function atomicFieldToTesla(field: number): number {
  return (field * HARTREE_IN_EV) / (2 * BOHR_MAGNETON_EV_PER_T);
}

/** Photon wavelength in nanometres for a transition energy in hartrees (sign ignored). */
export function wavelengthNmForEnergy(energy: number): number {
  return HC_EV_NM / Math.abs(hartreeToEv(energy));
}

QuantumAtom3DNamespace.register("AtomicUnits", {
  HARTREE_IN_EV,
  BOHR_RADIUS_IN_PM,
  ATOMIC_TIME_IN_FS,
  FINE_STRUCTURE_CONSTANT,
  BOHR_MAGNETON_EV_PER_T,
  HC_EV_NM,
});
