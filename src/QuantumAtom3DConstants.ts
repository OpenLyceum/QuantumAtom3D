/**
 * QuantumAtom3DConstants.ts
 *
 * Central repository for every named numeric constant used across the
 * simulation. Bare numbers that carry semantic meaning (sizes, margins,
 * physics defaults, ranges) belong here rather than inline in model or view
 * code, so they are named, documented, and changed in one place.
 *
 * Conventions
 * ───────────
 *  - Physics / model values use Hartree atomic units (ħ = mₑ = e = 4πε₀ = 1:
 *    lengths in Bohr radii a0, energies in hartrees, times in ħ/E_h); note
 *    the unit in a comment on each value. Conversions to display units live
 *    in common/model/AtomicUnits.ts.
 *  - Layout / chrome values are in screen pixels.
 *  - Colour strings live in QuantumAtom3DColors.ts, not here.
 *  - Computed expressions (e.g. `2 * Math.PI`) may stay inline.
 */

import QuantumAtom3DNamespace from "./QuantumAtom3DNamespace.js";

// ── Layout / chrome (screen pixels) ───────────────────────────────────────────

/** Margin between the screen edge and edge-anchored controls (e.g. Reset All). */
export const SCREEN_VIEW_MARGIN = 20;

/** Corner radius shared by control panels and dialogs. */
export const PANEL_CORNER_RADIUS = 6;

// ── Preferences ───────────────────────────────────────────────────────────────

/**
 * Colour wheels that map the complex phase arg ψ ∈ (−π, π] to a hue. `hsv` is
 * the familiar rainbow wheel; `twilight` is perceptually uniform, so equal phase
 * steps look equally different.
 */
export const PHASE_COLORMAP_VALUES = ["hsv", "twilight"] as const;
export type PhaseColormap = (typeof PHASE_COLORMAP_VALUES)[number];
export const DEFAULT_PHASE_COLORMAP: PhaseColormap = "hsv";

QuantumAtom3DNamespace.register("QuantumAtom3DConstants", {
  SCREEN_VIEW_MARGIN,
  PANEL_CORNER_RADIUS,
  PHASE_COLORMAP_VALUES,
  DEFAULT_PHASE_COLORMAP,
});
