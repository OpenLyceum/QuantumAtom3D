/**
 * formatters.ts
 *
 * Display formatting for model values, which arrive in atomic units. Unit
 * conversion goes through AtomicUnits; this file only chooses how many digits
 * to show.
 */

import { toFixed } from "scenerystack/dot";
import { hartreeToEv } from "../model/AtomicUnits.js";

/** Digits after the point for lengths in a0 and energies in eV. */
const LENGTH_DECIMALS = 2;
const ENERGY_DECIMALS = 3;
const ANGLE_DECIMALS = 1;

/** Typographic minus, so negative readouts line up with the labels' "−". */
const MINUS = "−";

function withMinus(text: string): string {
  return text.startsWith("-") ? `${MINUS}${text.slice(1)}` : text;
}

/** An energy in hartrees, shown in eV (e.g. "−3.401"). */
export function formatEnergyEv(energy: number): string {
  return withMinus(toFixed(hartreeToEv(energy), ENERGY_DECIMALS));
}

/** A length in a0 (e.g. "5.00"). */
export function formatLength(length: number): string {
  return withMinus(toFixed(length, LENGTH_DECIMALS));
}

/** A list of angles in radians, shown in degrees (e.g. "54.7°, 125.3°"). */
export function formatAngles(angles: readonly number[]): string {
  return angles.map((angle) => `${toFixed((angle * 180) / Math.PI, ANGLE_DECIMALS)}°`).join(", ");
}

/** A magnetic quantum number with an explicit sign ("+2", "0", "−1"). */
export function formatSigned(value: number): string {
  if (value > 0) {
    return `+${value}`;
  }
  return withMinus(`${value}`);
}
