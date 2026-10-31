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

// ── Orbital model (atomic units) ──────────────────────────────────────────────

/** Largest principal quantum number offered (so l ≤ 4: s, p, d, f, g). */
export const MAX_N = 5;

/** Nuclear charge range: H, He⁺, Li²⁺, Be³⁺, B⁴⁺, C⁵⁺. */
export const MIN_NUCLEAR_CHARGE = 1;
export const MAX_NUCLEAR_CHARGE = 6;

/** The state the Orbitals screen opens on: 2p with m = 0 (2p_z). */
export const INITIAL_N = 2;
export const INITIAL_L = 1;
export const INITIAL_M = 0;

/**
 * Fraction of the probability the default view must enclose. The view is
 * sized for Z = 1 and depends on n and l only, so a larger Z visibly shrinks
 * the orbital (r ∝ 1/Z) instead of being silently re-fitted.
 */
export const VIEW_ENCLOSED_FRACTION = 0.99;

/**
 * The view zooms in integer levels; each level magnifies by ZOOM_STEP_FACTOR,
 * and level 0 fits the Z = 1 orbital. −2 … 6 spans 0.5× to 8×, enough to follow
 * a C⁵⁺ orbital (6× smaller than hydrogen's).
 */
export const MIN_ZOOM_LEVEL = -2;
export const MAX_ZOOM_LEVEL = 6;
export const ZOOM_STEP_FACTOR = Math.SQRT2;

/** Cells per side of the 2D slice sample grid. */
export const SLICE_RESOLUTION = 128;

// ── Preferences ───────────────────────────────────────────────────────────────

/**
 * Colour wheels that map the complex phase arg ψ ∈ (−π, π] to a hue. `hsv` is
 * the familiar rainbow wheel. `uniform` is an OKLCH wheel of constant lightness
 * and chroma, so equal phase steps look equally different and brightness is
 * left free to show |ψ|.
 */
export const PHASE_COLORMAP_VALUES = ["hsv", "uniform"] as const;
export type PhaseColormap = (typeof PHASE_COLORMAP_VALUES)[number];
export const DEFAULT_PHASE_COLORMAP: PhaseColormap = "hsv";

QuantumAtom3DNamespace.register("QuantumAtom3DConstants", {
  SCREEN_VIEW_MARGIN,
  PANEL_CORNER_RADIUS,
  MAX_N,
  MIN_NUCLEAR_CHARGE,
  MAX_NUCLEAR_CHARGE,
  VIEW_ENCLOSED_FRACTION,
  MIN_ZOOM_LEVEL,
  MAX_ZOOM_LEVEL,
  ZOOM_STEP_FACTOR,
  SLICE_RESOLUTION,
  PHASE_COLORMAP_VALUES,
  DEFAULT_PHASE_COLORMAP,
});
