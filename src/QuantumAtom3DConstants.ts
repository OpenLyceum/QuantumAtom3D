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

/** Settings for angular-momentum/model/AngularMomentumModel.ts. */
export const ANGULAR_MOMENTUM_MODEL_SETTINGS = {
  /** Illustrative angular-momentum precession rate (rad/s). */
  PRECESSION_RATE: 0.7,
  /** L range max (dimensionless). */
  L_RANGE_MAX: 4,
  /** Mj default (dimensionless). */
  MJ_DEFAULT: 0.5,
  /** Mj range min (dimensionless). */
  MJ_RANGE_MIN: -1.5,
  /** Mj range max (dimensionless). */
  MJ_RANGE_MAX: 1.5,
} as const;

/** Settings for angular-momentum/view/AngularDensityNode.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const ANGULAR_DENSITY_NODE_SETTINGS = {
  LINE_DASH_DASH: 4, // px
  CURVE_LINE_WIDTH: 2,
  RADIUS: 90,
  CENTER_X: 100,
  CENTER_Y: 100,
  START_X: 100,
  START_Y: 5,
  END_X: 100,
  END_Y: 195,
  FONT_SIZE: 12,
  LEFT: 105,
} as const;

/** Settings for angular-momentum/view/AngularMomentumDiagramNode.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const ANGULAR_MOMENTUM_DIAGRAM_NODE_SETTINGS = {
  SPIN_LABEL_MIDPOINT_X_OFFSET: 22,
  CONE_LINE_DASH_DASH: 5, // px
  CONE_LINE_DASH_GAP: 4, // px
  INNER_CONE_LINE_DASH_DASH: 3, // px
  INNER_CONE_LINE_DASH_GAP: 4, // px
  POINT_X_OFFSET: 210, // px
  POINT_Y_OFFSET: 205, // px
  TOP_OFFSET: 20, // px
  LINE_WIDTH: 3, // px
  LEFT_OFFSET: 8, // px

  AXIS_START_X: 210,
  AXIS_START_Y: 340,
  AXIS_END_X: 210,
  AXIS_END_Y: 20,
  AXIS_LABEL_FONT_SIZE: 15,
  AXIS_LABEL_LEFT: 218,
  AXIS_LABEL_TOP: 20,
  ARROWS_TAIL_WIDTH: 3,
  ARROWS_HEAD_WIDTH: 12,
  ARROWS_HEAD_HEIGHT: 12,
  LABELS_FONT_SIZE: 17,
  WIDTH: 420,
  HEIGHT: 370,
  STARTS_X: 210,
  STARTS_Y: 205,
  LINK_START_X: 330,
  LINK_END_X: 355,
  LINK_FONT_SIZE: 12,
  LINK_LEFT: 360,
} as const;

/** Settings for angular-momentum/view/AngularMomentumScreenView.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const ANGULAR_MOMENTUM_SCREEN_VIEW_SETTINGS = {
  READOUTS_DECIMAL_PLACES_SEGMENT_2: 2, // digits
  DENSITY_LABEL_MAX_WIDTH: 420, // px
  DENSITY_HELP_LABEL_MAX_WIDTH: 430, // px
  NOTE_LABEL_MAX_WIDTH: 930, // px

  DIAGRAM_LEFT_INSET: 25,
  DIAGRAM_TOP_INSET: 45,
  TITLE_GAP: 10,
  READOUTS_DECIMAL_PLACES: 3, // digits
  CONTROLS_LEFT_OFFSET: 55, // px
  PHASE_TOP_OFFSET: 20, // px
  RESET_RIGHT_OFFSET: 20, // px
  RESET_BOTTOM_OFFSET: 20, // px
  TOP_OFFSET: 15, // px
  LEFT_OFFSET: 15, // px
  BOTTOM_OFFSET: 20, // px

  DEFAULT_MAX_WIDTH: 420,
  LABEL_FONT_SIZE: 14,
  SPINNER_FONT_SIZE: 15,
  M_CONTROL_SPACING: 15,
  J_CONTROL_SPACING: 15,
  J_CONTROL_RADIUS: 7,
  MJ_CONTROL_SPACING: 15,
  CONTROLS_SPACING: 15,
  PHASE_SPACING: 20,
} as const;

/** Settings for common/QuantumAtom3DControlOptions.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const QUANTUM_ATOM_3D_CONTROL_OPTIONS_SETTINGS = {
  SLIDER_THUMB_SIZE_WIDTH: 12,
  SLIDER_THUMB_SIZE_HEIGHT: 22,
  STANDALONE_SLIDER_TRACK_SIZE_WIDTH: 150,
  STANDALONE_SLIDER_TRACK_SIZE_HEIGHT: 3,
  NUMBER_CONTROL_SLIDER_TRACK_SIZE_WIDTH: 110,
  NUMBER_CONTROL_SLIDER_TRACK_SIZE_HEIGHT: 3,
  CHECKBOX_BOX_WIDTH: 16,
  /** NumberControl arrow-button scale (dimensionless). */
  NUMBER_CONTROL_OPTIONS_SCALE: 0.75,
  NUMBER_CONTROL_OPTIONS_SLIDER_PADDING: 4,
  NUMBER_CONTROL_OPTIONS_ARROW_BUTTON_SPACING: 3,
  NUMBER_CONTROL_OPTIONS_VERTICAL_SPACING: 4,
  CHECKBOX_OPTIONS_SPACING: 4,
} as const;

/** Settings for common/QuantumAtom3DPanel.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const QUANTUM_ATOM_3D_PANEL_SETTINGS = {
  OPTIONS_X_MARGIN: 12,
  OPTIONS_Y_MARGIN: 10,
} as const;

/** Settings for common/QuantumAtom3DScreenIcons.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const QUANTUM_ATOM_3D_SCREEN_ICONS_SETTINGS = {
  CREATE_SUPERPOSITION_ICON_RADIUS_SEGMENT_2: 69, // px
  CREATE_SUPERPOSITION_ICON_CENTER_X_VARIANT_2: 337, // px
  CREATE_SUPERPOSITION_ICON_OPACITY_VARIANT_2: 0.85, // dimensionless
  CREATE_ANGULAR_MOMENTUM_ICON_CENTER_X_VARIANT_2: 274, // px
  CREATE_ANGULAR_MOMENTUM_ICON_CENTER_Y_VARIANT_2: 97, // px
  CREATE_ANGULAR_MOMENTUM_ICON_LINE_WIDTH_VARIANT_2: 3, // px
  CREATE_ANGULAR_MOMENTUM_ICON_START_X_ARROW_NODE_END_X: 384, // px
  CREATE_ZEEMAN_ICON_START_X_SEGMENT_2: 330, // px
  CREATE_ZEEMAN_ICON_END_X_SEGMENT_2: 465, // px
  CREATE_ZEEMAN_ICON_START_X_SEGMENT_3: 210, // px
  CREATE_ZEEMAN_ICON_END_X_SEGMENT_3: 330, // px
  CREATE_ZEEMAN_ICON_LINE_WIDTH_VARIANT_2: 3, // px

  ANGULAR_MOMENTUM_DASH_LENGTH: 8,
  CREATE_ANGULAR_MOMENTUM_ICON_LINE_DASH_DASH: 6, // px

  AXIS_START_X: 274,
  AXIS_START_Y: 40,
  AXIS_END_X: 274,
  AXIS_END_Y: 333,
  AXIS_LINE_WIDTH: 3,
  LOBE_CENTER_X: 50,
  LOBE_CENTER_Y: 67.5,
  /** Lobe opacity (dimensionless). */
  LOBE_OPACITY: 0.85,
  CREATE_SUPERPOSITION_ICON_RADIUS: 96,
  CREATE_SUPERPOSITION_ICON_CENTER_X: 230,
  CREATE_SUPERPOSITION_ICON_CENTER_Y: 187,
  /** Create superposition icon opacity (dimensionless). */
  CREATE_SUPERPOSITION_ICON_OPACITY: 0.75,
  CREATE_SUPERPOSITION_ICON_START_X: 151,
  CREATE_SUPERPOSITION_ICON_START_Y: 305,
  CREATE_SUPERPOSITION_ICON_END_X: 397,
  CREATE_SUPERPOSITION_ICON_END_Y: 305,
  CREATE_SUPERPOSITION_ICON_TAIL_WIDTH: 4,
  CREATE_SUPERPOSITION_ICON_HEAD_WIDTH: 22,
  CREATE_SUPERPOSITION_ICON_HEAD_HEIGHT: 24,
  CREATE_ANGULAR_MOMENTUM_ICON_CENTER_X: 110,
  CREATE_ANGULAR_MOMENTUM_ICON_CENTER_Y: 32.5,
  CREATE_ANGULAR_MOMENTUM_ICON_LINE_WIDTH: 5,
  CREATE_ANGULAR_MOMENTUM_ICON_START_X: 274,
  CREATE_ANGULAR_MOMENTUM_ICON_START_Y: 285,
  CREATE_ANGULAR_MOMENTUM_ICON_END_X: 164,
  CREATE_ANGULAR_MOMENTUM_ICON_END_Y: 97,
  CREATE_ANGULAR_MOMENTUM_ICON_TAIL_WIDTH: 8,
  CREATE_ANGULAR_MOMENTUM_ICON_HEAD_WIDTH: 26,
  CREATE_ANGULAR_MOMENTUM_ICON_HEAD_HEIGHT: 30,
  CREATE_ZEEMAN_ICON_START_X: 90,
  CREATE_ZEEMAN_ICON_START_Y: 187,
  CREATE_ZEEMAN_ICON_END_X: 210,
  CREATE_ZEEMAN_ICON_END_Y: 187,
  CREATE_ZEEMAN_ICON_LINE_WIDTH: 7,
  CREATE_OSCILLATOR_ICON_LINE_WIDTH: 7,
} as const;

/** Settings for common/gpu/CpuOrbitalRenderer.ts. */
export const CPU_ORBITAL_RENDERER_SETTINGS = {
  /** Wall-clock budget per animation frame, in milliseconds. */
  CPU_FRAME_BUDGET_MS: 12,
  /** Full 8-bit channel scale for packing RGBA bytes. */
  BYTE: 255,
} as const;

/** Settings for common/gpu/GpuContext.ts. */
export const GPU_CONTEXT_SETTINGS = {
  /** Edge length of the throwaway canvas used by the presentation check. */
  PRESENTATION_PROBE_SIZE: 4,
} as const;

/** Settings for common/gpu/OrbitalRayMarcher.ts. */
export const ORBITAL_RAY_MARCHER_SETTINGS = {
  /** Accumulated opacity past which the march stops; the rest cannot show. */
  OPAQUE_ENOUGH: 0.99,
} as const;

/** Settings for common/gpu/OrbitalScene.ts. */
export const ORBITAL_SCENE_SETTINGS = {
  /** Most terms a scene can carry (the uniform block has room for exactly this many). */
  MAX_RENDER_TERMS: 16,
  /** Ray-march samples across the sphere's diameter. */
  RENDER_STEPS: 128,
  /** Optical depth per unit amplitude across one sphere radius. */
  VOLUME_OPACITY_GAIN: 4,
} as const;

/** Settings for common/gpu/RenderQualityController.ts. */
export const RENDER_QUALITY_CONTROLLER_SETTINGS = {
  /** Frame latency (ms) above which a frame counts as slow. */
  SLOW_FRAME_MS: 40,
  /** Frame latency (ms) below which a frame counts as fast. */
  FAST_FRAME_MS: 18,
  /** Consecutive slow frames before stepping quality down. */
  SLOW_FRAME_COUNT: 6,
  /** Consecutive fast frames before stepping quality up. */
  FAST_FRAME_COUNT: 48,
} as const;

/** Settings for common/gpu/createOrbitalRenderer.ts. */
export const CREATE_ORBITAL_RENDERER_SETTINGS = {
  /** Square resolution of GPU frames, in device pixels. */
  GPU_RENDER_RESOLUTION: 512,
} as const;

/** Settings for common/model/angular/ZeemanLevels.ts. */
export const ZEEMAN_LEVELS_SETTINGS = {
  /** Largest magnetic perturbation relative to the fine-structure gap. */
  MAX_FINE_STRUCTURE_FRACTION: 0.1,
  /** Default tolerance (dimensionless). */
  DEFAULT_TOLERANCE: 1e-12,
} as const;

/** Settings for common/model/hydrogen/HydrogenRadial.ts. */
export const HYDROGEN_RADIAL_SETTINGS = {
  /** Grid points for the numerical P(r) integrals (cumulative probability, maximum). */
  RADIAL_GRID_POINTS: 4000,
  /** Scan steps for the node search; far more than the at most four nodes at n ≤ 5. */
  NODE_SCAN_SAMPLES: 2000,
  /** Cutoff n2 factor (dimensionless). */
  CUTOFF_N2_FACTOR: 4,
  /** Cutoff offset (Bohr radii). */
  CUTOFF_OFFSET: 10,
  /** Golden section steps (dimensionless). */
  GOLDEN_SECTION_STEPS: 60,
} as const;

/** Settings for common/model/math/specialFunctions.ts. */
export const SPECIAL_FUNCTIONS_SETTINGS = {
  /** Bisection steps (dimensionless). */
  BISECTION_STEPS: 60,
} as const;

/** Settings for common/model/orbital/NodalSurfaces.ts. */
export const NODAL_SURFACES_SETTINGS = {
  /** Scan steps on (−1, 1) for the polar-node search (at most four roots for l ≤ 4). */
  POLAR_SCAN_SAMPLES: 2000,
  /** Edge (dimensionless). */
  EDGE: 1e-9,
} as const;

/** Settings for common/model/orbital/OrbitalsModel.ts. */
export const ORBITALS_MODEL_SETTINGS = {
  /** Enclosed fraction default (dimensionless). */
  ENCLOSED_FRACTION_DEFAULT: 0.9,
} as const;

/** Settings for common/model/orbital/PeakDensity.ts. */
export const PEAK_DENSITY_SETTINGS = {
  /** Radial samples (dimensionless). */
  RADIAL_SAMPLES: 4000,
  /** Polar samples (dimensionless). */
  POLAR_SAMPLES: 181,
  /** Azimuth samples (dimensionless). */
  AZIMUTH_SAMPLES: 360,
  /** Grid samples (dimensionless). */
  GRID_SAMPLES: 41,
} as const;

/** Settings for common/model/orbital/ProbabilitySampler.ts. */
export const PROBABILITY_SAMPLER_SETTINGS = {
  /** Seeded inverse-CDF sampling of separable hydrogenic eigenstates and real orbitals. */
  CDF_BINS: 4096,
} as const;

/** Settings for common/model/orbital/ProbabilitySurfaceTask.ts. */
export const PROBABILITY_SURFACE_TASK_SETTINGS = {
  /** Maximum Gauss–Legendre Newton refinements (count). */
  ROOT_MAX_ITERATIONS: 20,
  /** Absolute Gauss–Legendre root convergence tolerance. */
  ROOT_TOLERANCE: 1e-15,
  /** Cooperative spherical cubature: a square-root radial mesh resolves compact and diffuse terms together.  Unlike a uniform Cartesian box, its radial spacing does not discard the inner cloud in 1s + 5g.  The threshold search is also incremental; no large synchronous sort runs at completion. */
  RADIAL_BINS: 128,
  /** Cooperative spherical cubature: a square-root radial mesh resolves compact and diffuse terms together.  Unlike a uniform Cartesian box, its radial spacing does not discard the inner cloud in 1s + 5g.  The threshold search is also incremental; no large synchronous sort runs at completion. */
  POLAR_BINS: 48,
  /** Cooperative spherical cubature: a square-root radial mesh resolves compact and diffuse terms together.  Unlike a uniform Cartesian box, its radial spacing does not discard the inner cloud in 1s + 5g.  The threshold search is also incremental; no large synchronous sort runs at completion. */
  AZIMUTH_BINS: 64,
  /** Check interval (dimensionless). */
  CHECK_INTERVAL: 256,
  /** Threshold iterations (dimensionless). */
  THRESHOLD_ITERATIONS: 26,
  /** Surface work budget ms (ms). */
  SURFACE_WORK_BUDGET_MS: 4,
} as const;

/** Settings for common/model/orbital/RadialLookupTable.ts. */
export const RADIAL_LOOKUP_TABLE_SETTINGS = {
  /** Samples per row. */
  RADIAL_TABLE_SAMPLES: 1024,
} as const;

/** Settings for common/model/orbital/RaySurfaces.ts. */
export const RAY_SURFACES_SETTINGS = {
  /** Analytic intersections in atomic units. Rays have a unit direction. */
  EPSILON: 1e-10,
} as const;

/** Settings for common/model/orbital/RenderMode.ts. */
export const RENDER_MODE_SETTINGS = {
  /** Dot count (dimensionless). */
  DOT_COUNT: 6000,
  /** Max dots (dimensionless). */
  MAX_DOTS: 8192,
} as const;

/** Settings for common/model/orbital/SliceNodalCurves.ts. */
export const SLICE_NODAL_CURVES_SETTINGS = {
  /** Points per sampled curve (circles and hyperbolas). */
  CURVE_SAMPLES: 96,
  /** Below this, an angle or offset counts as exactly zero. */
  EPSILON: 1e-9,
} as const;

/** Settings for common/view/ColormapLegendNode.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const COLORMAP_LEGEND_NODE_SETTINGS = {
  RING_SEGMENTS: 72,
  RING_OUTER_RADIUS: 24,
  RING_INNER_RADIUS: 13,
  BAR_WIDTH: 90,
  BAR_HEIGHT: 12,
  GRADIENT_STOPS: 16,
  LABEL_FONT_SIZE: 11,
  AXIS_LABEL_GAP: 3,
  CREATE_PHASE_RING_LINE_WIDTH: 0.5,
} as const;

/** Settings for common/view/Colormaps.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const COLORMAPS_SETTINGS = {
  /** OKLCH lightness and chroma of the uniform wheel; this chroma stays inside sRGB at every hue. */
  UNIFORM_LIGHTNESS: 0.72,
  /** OKLCH lightness and chroma of the uniform wheel; this chroma stays inside sRGB at every hue. */
  UNIFORM_CHROMA: 0.11,
  /** OKLCH hue (radians) shown at phase 0: a warm red, like the HSV wheel. */
  UNIFORM_HUE_AT_ZERO_PHASE: 0.5,
  /** Entries in the precomputed uniform wheel. */
  UNIFORM_TABLE_SIZE: 720,
  /** Full 8-bit channel scale for packing RGBA bytes. */
  BYTE: 255,
  /** Entries per colour lookup table handed to the 3D renderers. */
  COLOR_LUT_SIZE: 256,
} as const;

/** Settings for common/view/InteractiveOrbitalCanvas.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const INTERACTIVE_ORBITAL_CANVAS_SETTINGS = {
  CENTER_X_OFFSET: 45, // px
  CENTER_X_FACTOR: 35, // px
  CENTER_Y_OFFSET: 45, // px
  CENTER_Y_FACTOR: 35, // px
  CHILDREN_LINE_WIDTH: 1.5,
} as const;

/** Settings for common/view/OrbitalAngularDetailNode.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const ORBITAL_ANGULAR_DETAIL_NODE_SETTINGS = {
  FONT_SIZE: 13, // px
  FONT_SIZE_SEGMENT_2: 12, // px

  PLOT_LINE_DASH_DASH: 4, // px
  PLOT_LEFT_OFFSET: 5, // px
  MAX_WIDTH: 260, // px
  LINE_WRAP: 260, // px
  SIZE: 230,
  RADIUS: 100,
  SAMPLES: 360,
  /** Phi range max (in the source module’s documented units). */
  PHI_RANGE_MAX: 360,
  CURVE_LINE_WIDTH: 2,
  PLOT_FONT_SIZE: 12,
  SPACING: 12,
  CHILDREN_FONT_SIZE: 14,
  CHILDREN_MAX_WIDTH: 275,
  CHILDREN_WIDTH: 220,
  CHILDREN_HEIGHT: 3,
  /** Children keyboard step (dimensionless). */
  CHILDREN_KEYBOARD_STEP: 5,
} as const;

/** Settings for common/view/OrbitalColorControl.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const ORBITAL_COLOR_CONTROL_SETTINGS = {
  LABEL_FONT_SIZE: 13,
  LABEL_MAX_WIDTH: 150,
  COLORING_RADIO_BUTTONS_SPACING: 8,
  COLORING_RADIO_BUTTONS_RADIUS: 7,
  SPACING: 24,
} as const;

/** Settings for common/view/OrbitalReadoutPanel.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const ORBITAL_READOUT_PANEL_SETTINGS = {
  TITLE_FONT_SIZE: 14,
  READOUT_FONT_SIZE: 13,
  DETAIL_FONT_SIZE: 11,
  COLUMN_SPACING: 12,
  ROW_SPACING: 4,
  VALUE_MAX_WIDTH: 150,
  /** A polar node within this of θ = 90° (radians) is the xy-plane. */
  EQUATORIAL_TOLERANCE: 1e-6,
} as const;

/** Settings for common/view/OrbitalViewportNode.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const ORBITAL_VIEWPORT_NODE_SETTINGS = {
  PROBE_SHELL_LINE_DASH_DASH: 4, // px
  PROBE_SHELL_LINE_DASH_GAP: 3, // px
  /** Floor for Math.max so the probe shell never collapses to a zero radius. */
  EPSILON_RADIUS: 0.01,
  CENTER_X_OFFSET: 10, // px
  CENTER_Y_OFFSET: 10, // px
  AXIS_LENGTH: 28,
  PLANE_HANDLE_RADIUS: 7,
  LINE_WIDTH: 1.5,
} as const;

/** Settings for common/view/ProgressiveSurface.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const PROGRESSIVE_SURFACE_SETTINGS = {
  /** Owns one bounded-work surface request. Superseded paused states can never publish stale thresholds. */
  ANIMATION_REFRESH_MS: 250,
} as const;

/** Settings for common/view/QuantumNumberControl.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const QUANTUM_NUMBER_CONTROL_SETTINGS = {
  LABEL_FONT_SIZE: 16,
  SPINNER_FONT_SIZE: 15,
  STATE_FONT_SIZE: 18,
  SPINNER_SPACING: 14,
  SPINNER_DISPLAY_WIDTH: 40,
  ROW_SPACING: 10,
  CREATE_SPINNER_SPACING: 2,
  STATE_LABEL_MAX_WIDTH: 220,
} as const;

/** Settings for common/view/RadialDistributionChartNode.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const RADIAL_DISTRIBUTION_CHART_NODE_SETTINGS = {
  CURSOR_LINE_DASH_DASH: 3, // px
  /** Samples along r for the curve. */
  CURVE_SAMPLES: 300,
  /** Headroom above the curve's peak. */
  Y_HEADROOM: 1.1,
  /** Roughly how many labelled ticks the r axis gets. */
  TARGET_TICKS: 5,
  LABEL_FONT_SIZE: 12,
  TITLE_FONT_SIZE: 14,
  /** Roughly how many labelled ticks the r axis gets. */
  CURVE_LINE_WIDTH: 2,
  /** Roughly how many labelled ticks the r axis gets. */
  MARKER_LINE_WIDTH: 1.5,
  /** Roughly how many labelled ticks the r axis gets. */
  NODE_DOT_RADIUS: 3,
  /** Roughly how many labelled ticks the r axis gets. */
  TICK_LABEL_SPACING: 4,
  /** Roughly how many labelled ticks the r axis gets. */
  TITLE_SPACING: 6,
  /** Below the tick labels. */
  AXIS_LABEL_OFFSET: 22,
} as const;

/** Settings for common/view/ResponsiveScreenView.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const RESPONSIVE_SCREEN_VIEW_SETTINGS = {
  DIMENSION2_WIDTH: 24, // px
  DIMENSION2_HEIGHT: 40, // px

  LAYOUT_CENTER_X_OFFSET: 16, // px
  PORTRAIT_WIDTH: 400,
  MARGIN: 16,
  CONTENT_WIDTH: 350,
  SECTION_GAP: 24,
  SCROLL_MARGIN: 12,
  SCROLL_BAR_WIDTH: 3,
  SCROLL_BAR_HEIGHT: 200,
  /** Scroll bar keyboard step (dimensionless). */
  SCROLL_BAR_KEYBOARD_STEP: 0.06,
  /** Scroll bar shift keyboard step (dimensionless). */
  SCROLL_BAR_SHIFT_KEYBOARD_STEP: 0.015,
} as const;

/** Settings for common/view/SliceHeatmapNode.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const SLICE_HEATMAP_NODE_SETTINGS = {
  FRAME_LINE_WIDTH: 1.5,
  NODE_LINE_WIDTH: 1.2,
} as const;

/** Settings for common/view/createLeftRightSpinner.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const CREATE_LEFT_RIGHT_SPINNER_SETTINGS = {
  DEFAULT_FONT_SIZE: 14,
  DEFAULT_MIN_BACKGROUND_WIDTH: 40,
} as const;

/** Settings for common/view/formatters.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const FORMATTERS_SETTINGS = {
  /** Digits after the point for lengths in a0 and energies in eV. */
  LENGTH_DECIMALS: 2,
  /** Digits after the point for lengths in a0 and energies in eV. */
  ENERGY_DECIMALS: 3,
} as const;

/** Settings for common/view/orbitalViewportChrome.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const ORBITAL_VIEWPORT_CHROME_SETTINGS = {
  CREATE_PENDING_TEXT_MAX_WIDTH_OFFSET: 20, // px

  /** Camera orbit per pixel of drag, in radians. */
  DRAG_ORBIT_ANGLE: 0.008,
  CREATE_PENDING_TEXT_FONT_SIZE: 12,
  CREATE_PENDING_TEXT_LEFT: 10,
  CREATE_PENDING_TEXT_TOP: 10,
  LABEL_FONT_SIZE: 12,
} as const;

/** Settings for orbitals/view/OrbitalsControlPanel.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const ORBITALS_CONTROL_PANEL_SETTINGS = {
  SECTION_CONTENT_SPACING: 6, // px

  TITLE_FONT_SIZE: 14,
  LABEL_FONT_SIZE: 13,
  ION_FONT_SIZE: 16,
  SECTION_SPACING: 7,
  RADIO_SPACING: 6,
  RADIO_RADIUS: 7,
  ZOOM_ICON_SIZE_WIDTH: 10,
  ZOOM_ICON_SIZE_HEIGHT: 2,
  PANEL_CONTENT_WIDTH: 230,
  /** Fixed slot for the ion symbol, wide enough for "Be³⁺", so the panel keeps its width as Z changes. */
  ION_LABEL_WIDTH: 44,
  CONTENT_SPACING: 10,
} as const;

/** Settings for orbitals/view/OrbitalsScreenView.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const ORBITALS_SCREEN_VIEW_SETTINGS = {
  CAMERA_ROWS_MAX_WIDTH: 100, // px
  MODES_MAX_WIDTH: 100, // px
  RADIAL_TAB_LABEL_MAX_WIDTH: 140, // px
  SLICE_TAB_LABEL_MAX_WIDTH: 110, // px

  VIEW_SIZE: 340,
  DETAIL_SIZE: 275,
  CHART_HEIGHT: 150,
  COLUMN_GAP: 30,
  GAP: 12,
  TITLE_ROOM: 30,
  LABEL_FONT_SIZE: 13,
  DEFAULT_MAX_WIDTH: 150,
  CAMERA_ROWS_WIDTH: 170,
  CAMERA_ROWS_HEIGHT: 3,
  MODES_SPACING: 8,
  MODES_RADIUS: 6,
  FRACTION_SPACING: 8,
  FRACTION_RADIUS: 6,
  DETAIL_CHOICE_SPACING: 10,
  DETAIL_CHOICE_RADIUS: 6,
  PROBE_CONTROL_HEIGHT: 3,
  /** Probe control keyboard step (dimensionless). */
  PROBE_CONTROL_KEYBOARD_STEP: 0.01,
  /** Probe control shift keyboard step (dimensionless). */
  PROBE_CONTROL_SHIFT_KEYBOARD_STEP: 0.001,
} as const;

/** Settings for orbitals/view/SliceControlPanel.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const SLICE_CONTROL_PANEL_SETTINGS = {
  LABEL_FONT_SIZE: 13,
  PLANE_FONT_SIZE: 14,
  ROW_SPACING: 8,
  ITEM_SPACING: 12,
  RADIO_RADIUS: 7,
  /** Slider keyboard steps, as fractions of the view half-width. */
  OFFSET_KEYBOARD_STEP: 0.05,
  /** Slider keyboard steps, as fractions of the view half-width. */
  OFFSET_SHIFT_KEYBOARD_STEP: 0.01,
} as const;

/** Settings for oscillator/model/OscillatorModel.ts. */
export const OSCILLATOR_MODEL_SETTINGS = {
  /** Shell range max (dimensionless). */
  SHELL_RANGE_MAX: 4,
  /** Zoom range min (dimensionless). */
  ZOOM_RANGE_MIN: -2,
  /** Zoom range max (dimensionless). */
  ZOOM_RANGE_MAX: 3,
} as const;

/** Settings for oscillator/view/BasisOverlapNode.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const BASIS_OVERLAP_NODE_SETTINGS = {
  CENTER_Y_OFFSET: 45, // px
  CENTER_X_OFFSET: 70, // px

  CELL: 19,
  ROWS_FONT_SIZE: 10,
  COLUMNS_FONT_SIZE: 9,
  SELECTED_ROW_LINE_WIDTH: 1.5,
  SELECTED_COLUMN_LINE_WIDTH: 1.5,
  RIGHT_RIGHT: 60,
  BOTTOM_BOTTOM: 35,
} as const;

/** Settings for oscillator/view/OscillatorScreenView.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const OSCILLATOR_SCREEN_VIEW_SETTINGS = {
  UNITS_TEXT_MAX_WIDTH: 340, // px
  CAMERA_ROWS_MAX_WIDTH: 100, // px
  CONTROLS_ITEM_3_SPACING: 12, // px
  CONTROLS_ITEM_4_SPACING: 12, // px
  LADDER_MAX_WIDTH: 500, // px
  NOTE_TEXT_MAX_WIDTH: 920, // px

  LEFT_OFFSET: 25, // px
  TOP_OFFSET: 50, // px
  BOTTOM_OFFSET: 10, // px
  BELOW_TOP_OFFSET: 10, // px
  CONTROL_COLUMN_SPACING: 15, // px
  CONTROLS_TOP_OFFSET: 20, // px
  COEFFICIENT_DECIMAL_PLACES: 4, // digits
  LINE_WRAP: 140, // px
  RESET_RIGHT_OFFSET: 18, // px
  RESET_BOTTOM_OFFSET: 18, // px

  DEFAULT_MAX_WIDTH: 500,
  TEXT_FONT_SIZE: 13,
  CAMERA_ROWS_SPACING: 12,
  MODES_SPACING: 15,
  MODES_RADIUS: 6,
  BELOW_SPACING: 10,
  BASES_SPACING: 20,
  BASES_RADIUS: 7,
  CONTROLS_SPACING: 10,
  MAX_WIDTH_MAX_WIDTH: 140,
} as const;

/** Settings for preferences/QuantumAtom3DPreferencesNode.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const QUANTUM_ATOM_3D_PREFERENCES_NODE_SETTINGS = {
  CREATE_ITEM_TEXT_LINE_WRAP: 260, // px

  HEADER_FONT_SIZE: 18,
  COLORMAP_LABEL_FONT_SIZE: 14,
  CREATE_ITEM_TEXT_FONT_SIZE: 14,
  COLORMAP_RADIO_BUTTONS_SPACING: 8,
  COLORMAP_RADIO_BUTTONS_RADIUS: 6,
  CREATE_CHOICE_BUTTONS_SPACING: 12,
  SPACING: 12,
} as const;

/** Settings for superposition/model/SuperpositionModel.ts. */
export const SUPERPOSITION_MODEL_SETTINGS = {
  /** Minimum viewport half-width (Bohr radii). */
  MIN_VIEW_HALF_WIDTH: 5,
  /** Probability enclosed when fitting the viewport to a state (dimensionless). */
  VIEW_ENCLOSED_PROBABILITY: 0.995,
  /** Speed default (atomic time units per s). */
  SPEED_DEFAULT: 4,
  /** Speed range min (atomic time units per s). */
  SPEED_RANGE_MIN: 0.25,
  /** Speed range max (atomic time units per s). */
  SPEED_RANGE_MAX: 12,
  /** Nuclear charge range max (dimensionless). */
  NUCLEAR_CHARGE_RANGE_MAX: 6,
  /** Term count default (dimensionless). */
  TERM_COUNT_DEFAULT: 2,
  /** Term count range max (dimensionless). */
  TERM_COUNT_RANGE_MAX: 6,
  /** Zoom range min (dimensionless). */
  ZOOM_RANGE_MIN: -2,
  /** Zoom range max (dimensionless). */
  ZOOM_RANGE_MAX: 3,
} as const;

/** Settings for superposition/view/ExpectationTimeSeriesNode.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const EXPECTATION_TIME_SERIES_NODE_SETTINGS = {
  TIME_LABEL_TOP_OFFSET: 5, // px
  DECIMAL_PLACES: 3, // digits

  /** Chart range max (in the source module’s documented units). */
  CHART_RANGE_MAX: 5,
  R_PLOT_LINE_WIDTH: 2,
  Z_PLOT_LINE_WIDTH: 2,
  TITLE_SPACING: 20,
  TITLE_FONT_SIZE: 13,
  TITLE_BOTTOM: -5,
  TIME_LABEL_FONT_SIZE: 12,
  R_DOT_RADIUS: 3,
  Z_DOT_RADIUS: 3,
  Y_LABELS_FONT_SIZE: 10,
  RIGHT_RIGHT: -4,
} as const;

/** Settings for superposition/view/SuperpositionScreenView.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const SUPERPOSITION_SCREEN_VIEW_SETTINGS = {
  SPEED_SLIDER_WIDTH: 95, // px
  BELOW_ITEM_4_SPACING: 10, // px
  YAW_TEXT_MAX_WIDTH: 70, // px
  YAW_SLIDER_WIDTH: 95, // px
  PITCH_TEXT_MAX_WIDTH: 70, // px
  PITCH_SLIDER_WIDTH: 95, // px
  BELOW_ITEM_5_SPACING: 10, // px
  ZOOM_TEXT_MAX_WIDTH: 70, // px
  ZOOM_SLIDER_WIDTH: 95, // px
  NUCLEAR_CHARGE_TEXT_MAX_WIDTH: 90, // px
  NUCLEAR_CHARGE_SLIDER_WIDTH: 70, // px
  COEFFICIENT_SLIDER_DECIMAL_PLACES: 2, // digits
  COEFFICIENT_SLIDER_WIDTH: 95, // px
  STATUS_LABEL_MAX_WIDTH: 500, // px
  NORMALIZATION_TEXT_MAX_WIDTH: 510, // px

  TOP_OFFSET: 35, // px
  TIME_TEXT_DECIMAL_PLACES: 3, // digits
  BOTTOM_OFFSET: 8, // px
  BELOW_TOP_OFFSET: 10, // px
  BELOW_PANEL_SPACING: 16, // px
  MIXER_TOP_OFFSET: 20, // px
  STATUS_DECIMAL_PLACES: 3, // digits

  FONT_SIZE: 13,
  SIZE: 340,
  DEFAULT_MAX_WIDTH: 180,
  DEFAULT_WIDTH: 110,
  SLIDER_HEIGHT: 3,
  MODES_SPACING: 8,
  MODES_RADIUS: 6,
  BELOW_SPACING: 9,
  COUNT_SPACING: 10,
  PRESET_BUTTONS_MAX_WIDTH: 100,
  PRESET_BOX_SPACING: 6,
  BOX_SPACING: 7,
  BOX_MAX_Y: 30,
  COEFFICIENT_SLIDER_FONT_SIZE: 11,
  COEFFICIENT_SLIDER_MAX_WIDTH: 110,
  MIXER_SPACING: 9,
} as const;

/** Settings for zeeman/model/ZeemanModel.ts. */
export const ZEEMAN_MODEL_SETTINGS = {
  /** Nuclear charge range max (dimensionless). */
  NUCLEAR_CHARGE_RANGE_MAX: 6,
  /** Field fraction default (dimensionless). */
  FIELD_FRACTION_DEFAULT: 0.5,
  /** Schematic Larmor phase advance rate at full field fraction (rad/s). */
  PRECESSION_RATE: 2,
  /** Phase advance on step-forward at full field fraction (rad). */
  STEP_PHASE: 0.05,
} as const;

/** Settings for zeeman/view/ZeemanDiagramNode.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const ZEEMAN_DIAGRAM_NODE_SETTINGS = {
  DRAW_BAND_FONT_SIZE_SEGMENT_2: 9, // px

  POSITION_X_OFFSET: 35, // px
  POSITION_X_FACTOR: 112, // dimensionless
  DRAW_BAND_TOP_OFFSET: 105, // px
  DRAW_BAND_DECIMAL_PLACES: 6, // digits
  BAND_LABEL_TOP_OFFSET: 88, // px
  DRAW_BAND_LINE_WIDTH: 3, // px
  DRAW_BAND_LEFT_OFFSET: 20, // px

  DRAW_BAND_FONT_SIZE: 11,
  LINK_LINE_WIDTH: 1.5,
} as const;

/** Settings for zeeman/view/ZeemanScreenView.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const ZEEMAN_SCREEN_VIEW_SETTINGS = {
  DIAGRAM_TEXT_MAX_WIDTH: 560, // px
  CENTRED_TEXT_MAX_WIDTH: 560, // px
  SPECTRUM_TITLE_MAX_WIDTH: 550, // px
  PERIOD_LABEL_MAX_WIDTH: 335, // px
  NOTE_TEXT_MAX_WIDTH: 920, // px

  LEFT_OFFSET: 25, // px
  TOP_OFFSET: 15, // px
  LINE_WRAP: 560, // px
  FIELD_VALUE_SIGNIFICANT_FIGURES: 4, // digits
  SIGNIFICANT_FIGURES: 8, // digits
  CONTROL_COLUMN_SPACING: 10, // px
  CONTROLS_LEFT_OFFSET: 365, // px
  CONTROLS_TOP_OFFSET: 20, // px
  SELECTED_DECIMAL_PLACES: 3, // digits
  ENERGY_DECIMAL_PLACES: 8, // digits
  PERIOD_SIGNIFICANT_FIGURES: 4, // digits
  PRECESSION_X_OFFSET: 70, // px
  PRECESSION_Y_OFFSET: 525, // px
  BOTTOM_OFFSET: 12, // px
  RESET_RIGHT_OFFSET: 18, // px
  RESET_BOTTOM_OFFSET: 18, // px

  DEFAULT_MAX_WIDTH: 335,
  TEXT_FONT_SIZE: 13,
  /** Field slider keyboard step (dimensionless). */
  FIELD_SLIDER_KEYBOARD_STEP: 0.01,
  /** Field slider shift keyboard step (dimensionless). */
  FIELD_SLIDER_SHIFT_KEYBOARD_STEP: 0.001,
  FIELD_CONTROL_SPACING: 8,
  MODES_SPACING: 14,
  MODES_RADIUS: 7,
  LINES_SPACING: 14,
  LINES_RADIUS: 7,
  DIRECTIONS_SPACING: 8,
  DIRECTIONS_RADIUS: 7,
  CONTROLS_SPACING: 14,
  LEGEND_SPACING: 25,
  LEGEND_FONT_SIZE: 12,
  AXIS_START_Y: 50,
  AXIS_END_Y: -50,
  ARROW_END_X: 20,
  ARROW_END_Y: -20,
  ARROW_TAIL_WIDTH: 3,
  ARROW_HEAD_WIDTH: 10,
  ARROW_HEAD_HEIGHT: 10,
} as const;

/** Settings for zeeman/view/ZeemanSpectrumNode.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const ZEEMAN_SPECTRUM_NODE_SETTINGS = {
  KEY_DECIMAL_PLACES: 9, // digits

  LINK_START_Y: 70,
  LINK_END_Y: 70,
  LINK_LINE_WIDTH: 2,
  LINK_FONT_SIZE: 10,
  LINK_TOP: 76,
} as const;

/** Numerical thresholds for the corresponding model. */
export const ANGULAR_NUMERICS = {
  /** Minimum nonzero Clebsch–Gordan probability (dimensionless). */
  MIN_WEIGHT: 1e-14,
} as const;

/** Numerical thresholds for the corresponding model. */
export const SUPERPOSITION_NUMERICS = {
  /** Minimum retained squared coefficient magnitude (dimensionless). */
  MIN_COEFFICIENT_NORM_SQUARED: 1e-24,
} as const;

/** Layout lengths in px; precision values count digits; factors are dimensionless. */
export const ZEEMAN_SCREEN_SUMMARY_CONTENT_SETTINGS = {
  DETAILS_SIGNIFICANT_FIGURES: 4, // digits
  DETAILS_DECIMAL_PLACES: 6, // digits
  G_FACTOR_DECIMAL_PLACES: 4, // digits
} as const;

/** Layout lengths in px; precision values count digits; factors are dimensionless. */
export const SUPERPOSITION_SCREEN_SUMMARY_CONTENT_SETTINGS = {
  DETAILS_DECIMAL_PLACES: 3, // digits
} as const;

/** Layout lengths in px; precision values count digits; factors are dimensionless. */
export const OSCILLATOR_SCREEN_SUMMARY_CONTENT_SETTINGS = {
  DETAILS_DECIMAL_PLACES: 4, // digits
} as const;

/** Layout lengths in px; precision values count digits. */
export const ANGULAR_MOMENTUM_SCREEN_SUMMARY_CONTENT_SETTINGS = {
  DETAILS_DECIMAL_PLACES: 3, // digits
} as const;

/** Numerical settings; units are specified per value. */
export const METROPOLIS_SETTINGS = {
  /** Default cooperative sampling budget (ms). */
  DEFAULT_WORK_BUDGET_MS: 4,
  /** Proposals between wall-clock budget checks (count). */
  BATCH_SIZE: 64,
} as const;

/** Numerical settings; units are specified per value. */
export const EXPECTATION_NUMERICS = {
  /** Even number of Simpson-rule radial integration intervals (count). */
  RADIAL_INTERVALS: 4096,
} as const;

/** Numerical settings; units are specified per value. */
export const OSCILLATOR_NUMERICS = {
  /** Coefficient magnitudes below this are rounded to zero. */
  COEFFICIENT_EPSILON: 1e-12,
  /** Radial samples in the oscillator peak search (count). */
  PEAK_SAMPLES: 4000,
  /** Outer radius of the oscillator peak scan (reduced oscillator length). */
  PEAK_RADIUS_LIMIT: 6,
} as const;

/** Finite numerical domains used for the oscillator renderer. */
export const OSCILLATOR_DOMAIN = {
  /** Radial lookup-table cutoff (reduced oscillator lengths). */
  RADIAL_CUTOFF: 9,
  /** Reference viewport half-width (reduced oscillator lengths). */
  VIEW_HALF_WIDTH: 5.5,
} as const;

/** Component dimensions in px; ratios and control steps are dimensionless; precision counts digits. */
export const QUANTUM_ATOM_3D_QUERY_PARAMETERS_SETTINGS = {
  SEED_DEFAULT_VALUE: 173, // dimensionless
} as const;

/** Component dimensions in px; ratios and control steps are dimensionless; precision counts digits. */
export const MAIN_SETTINGS = {
  LABEL_FONT_SIZE: 13, // px
  LABEL_MAX_WIDTH: 165, // px
  LAUNCH_SPACING: 12, // px
} as const;

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
