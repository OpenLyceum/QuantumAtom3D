# Implementation Notes - Quantum Atom 3D

Developer-facing notes. The physics is in [model.md](./model.md).

## Architecture Overview

Five screens. Each screen has its own model, built from shared classes in `src/common/model/`.

```
main.ts                  awaits initializeGpuContext() once, then sim.start()
  ├─ OrbitalsScreen        eigenstate viewer: dots / volume / isosurface, P(r), slice, nodes
  ├─ SuperpositionScreen   up to 6 terms with complex coefficients, time evolution (TimeModel)
  ├─ AngularMomentumScreen vector model (L, S, J), 2D projection, no GPU
  ├─ ZeemanScreen          level diagram, selection rules, spectrum, no GPU
  └─ OscillatorScreen      isotropic oscillator, degeneracy ladder, Cartesian ↔ spherical

src/common/model/        pure TypeScript physics; never imports scenery
  math/                  special functions, Y_lm, quadrature
  hydrogen/ oscillator/  radial functions, energies, closed-form expectations
  orbital/               BasisTerm, Wavefunction, RadialLookupTable, sampler, nodes, grid
  angular/               vector model, Zeeman levels, selection rules
src/common/gpu/          WebGPU device, WGSL shaders, GPU and CPU orbital renderers
src/common/view/         OrbitCamera, OrbitalViewportNode (the Scenery/GPU boundary), charts
```

Data flows from model to view through AXON Properties. Models implement `step(dt)` and `reset()`.

## Rendering (WebGPU with a CPU reference backend)

This follows HeatTransfer's GPU architecture (`HeatTransfer/src/common/field/gpu/`):

- **One device for the whole sim.** `initializeGpuContext()` runs in `main.ts` before `sim.start()`,
  while the splash screen is up. It compiles and checks every shader there. Any failure (no adapter, a
  shader error, a presentation problem) demotes the whole sim to the CPU renderer. After that point
  everything is synchronous, so screen model factories stay synchronous.
- **The Scenery boundary is one `Image`.** It wraps the canvas that the renderer draws into (see
  HeatTransfer `FieldNode.ts`). Pointer and keyboard input attach to that node.
- **Bind-group layouts are explicit.** Never use `layout: "auto"`. Uniform byte sizes are
  hand-computed constants placed beside each WGSL struct, and a unit test checks them.

**ψ is evaluated in the shader, not uploaded as a grid.** Every state on the 3D screens is a list of up
to 16 terms c_k R_k(r) Y_{l_k m_k}(θ, φ):

- **Radial part.** R comes from a storage-buffer lookup table, with one row per (n, l) for hydrogen and
  per (n_r, l) for the oscillator. Rows are tabulated on a √ρ axis and linearly interpolated in WGSL.
  Z is a scale uniform, so the table never changes with Z.
- **Angular part.** P_l^m is evaluated by recurrence in WGSL (l ≤ 4).
- **Time evolution.** Per-term phases e^{−iE_k t} are computed in float64 on the CPU, wrapped mod 2π,
  and uploaded as cos/sin uniforms. Time evolution therefore costs no extra CPU or upload work.
- **Built from terms.** Real orbitals, hybrids and Cartesian oscillator states are all term lists of
  spherical states, so the shader has a single code path.

**Render passes:**

- **One fullscreen fragment pass.** It ray-marches emission and absorption (phase hue or |ψ|²). It finds
  the isosurface as the first crossing of level c. It intersects nodal surfaces analytically (spheres,
  cones, planes). It also samples the cutting plane exactly. The radial probe shell is a Scenery silhouette.
- **Dots.** An instanced billboard pipeline depth-tests the dots against one another. Each dot
  fragment composites the analytic surfaces in front of its own depth; the fullscreen pass supplies
  the surface background between dots. This preserves translucent node and cutting-plane colours.
- **Scenery overlays.** Axes, labels and drag handles are Scenery nodes projected with the same
  `OrbitCamera`.
- **On demand.** A frame is rendered only when the state or camera changed, or when time is running.
  Automatic GPU quality adapts resolution using completed GPU queue latency; fixed quality overrides it.

**CPU backend.** It is used when WebGPU is missing, a shader fails, or `?forceCpu` is set. It is the same
pipeline in TypeScript, calling the same `Wavefunction.evaluate`: a low-resolution ray-march that refines
progressively and is time-sliced across frames, plus dots drawn in a `CanvasNode`. It is also the
reference implementation: a browser spec compares GPU and CPU pixels.

**Other CPU-side work:**

- A 64³ density grid, used only to turn an enclosed-probability fraction into an iso level.
- The 128² slice heatmap.
- The Monte Carlo sampler: inverse-CDF sampling for eigenstates, Metropolis for superpositions, seeded.
- Analytic node positions, found by bisection.

## State of the Orbitals screen (M3)

The left column is a rotatable 3D orbital. The middle column switches between the radial chart with
readouts and the cross-section with its plane/offset controls. The right column selects the state.

- **3D volume.** WebGPU ray-marches 128 samples across the viewing sphere at 512² resolution,
  evaluating the angular functions in WGSL and interpolating a 1024-sample radial table. Both
  palettes and density colouring use the same lookup tables as the CPU reference. Brightness and
  opacity are visualization mappings, not absolute probability measurements.
- **Fallback.** No device, a shader diagnostic, or failed canvas presentation selects CPU at startup.
  Losing the device or encountering a rendering error switches existing viewports to CPU as well.
  The CPU image progresses through 32², 64², 128² and 256², with a 12 ms work budget checked after
  each row. This is a responsiveness budget rather than a strict deadline. Finished frames persist;
  stationary scenes do no further rendering work. `?forceCpu=true` forces this path.
- **Camera.** Physics z is up. Dragging, arrow keys and the azimuth/elevation sliders orbit the same
  camera. Plus/minus adjust the model's zoom. Reset All restores camera, state and detail panel.
- **Dots.** 6,000 fixed probability samples, generated by numerical inverse CDFs in r, cos θ and
  (for real orbitals) φ. `?seed=173` reproduces them. These are sampled measurements, not trajectories.
  GPU uses instanced circular billboards; CPU uses depth-sorted canvas circles. CPU dots are drawn
  in one frame, so their overlay workload does not have the volume renderer's row budget.
- **Isosurfaces.** The first crossing of a 90% or 95% density threshold is refined by bisection and
  shaded with the density gradient. A camera-independent 64³ midpoint grid spans the radius
  containing 99.99% of the radial probability. The selected fraction is of the probability captured
  by this finite grid, so it is approximate. Grid and thresholds are cached across camera, zoom and
  colour changes. Dense-grid construction is synchronous on state changes.
- **Surfaces.** Radial spheres, polar half-cones (or the equatorial plane), and real-basis azimuthal
  planes use analytic ray intersections. Translucent events are composited in depth order with the
  volume, isosurface or dots. The cutting plane samples ψ at its exact intersection. Its blue handle
  changes the same offset as the accessible slider; dragging elsewhere orbits the camera. The 2D
  heatmap normalizes brightness within the slice; the 3D plane uses the whole state's peak.
- **Radial probe.** Chart hover selects r; viewport hover uses the ray's closest approach to the
  nucleus. A keyboard slider selects the same radius. A dashed circle is the projected silhouette
  of that spherical shell. Zero hides the probe. This guide does not occlude orbital data.
- **Presets.** 1s, 2s, 2p_z, 3d_z² and complex 2p with m=±1. Charge and display settings are retained.
- **Angular detail.** The Y_lm tab plots a polar section of the selected complex or real angular
  density, with an accessible azimuth slider. Radius is normalized to the selected section’s peak.
  The full hybrid presets are on Superposition. Quality preferences apply to all three 3D screens.

The M1 tools remain available:

- **Cross-section** (`SliceHeatmapNode`). ψ is sampled at 128² on an xy, xz or yz plane, painted into
  an offscreen canvas, and scaled up by a `CanvasNode`. In phase colouring, hue is arg ψ and brightness
  is |ψ|/max. In density colouring, the inferno ramp shows |ψ|²/max. Dashed curves mark where the
  nodal surfaces cut the plane; `SliceNodalCurves` computes them analytically.
- **P(r) chart** (bamboo). It spans the same length as the cross-section, with ⟨r⟩ and the radial nodes
  marked.
- **Readouts.** All values are exact: E_n, ⟨r⟩, r_rms, the peak of P(r), and the node counts with cone
  and plane angles.
- **View scale.** It depends on n, l and the zoom level, never on Z. Scaling with Z is the lesson.

## Roadmap

| Milestone | Scope |
|---|---|
| M0 ✓ | Scaffold, fleet onboarding, phase-colour preference |
| M1 ✓ | Math core and tests; Orbitals screen in 2D (P(r), slice, readouts) |
| M2 ✓ | GPU engine, CPU renderer, camera; volume and phase rendering on Orbitals |
| M3 ✓ | Dots, isosurface, nodal surfaces, cutting plane, P(r) ↔ 3D hover, stationary presets |
| M4 ✓ | Superposition screen |
| M5 ✓ | Angular Momentum screen |
| M6 ✓ | Zeeman screen |
| M7 ✓ | 3D Oscillator screen |
| M8 ✓ | Display preferences, permalinks, angular tab, icons, live descriptions and locale/profile checks |

## Accessibility

- **Screen summaries.** Each screen has a `*ScreenSummaryContent` whose `currentDetailsContent` is a
  live `DerivedProperty`, for example "3d_z² orbital of He⁺, mean radius 3.5 a0, two conical nodes at
  54.7° from the z-axis".
- **3D viewport.** It is focusable: the arrow keys orbit the camera and +/− zoom.
- **Pointer-only gestures.** Each one, such as dragging the cutting plane, also has a slider.

## Testing

- **Vitest (happy-dom).** It covers the model and the CPU renderer. WebGPU is unavailable there.
- **Shader changes.** Verify them in a browser against the CPU backend. Run the specs in
  `tests/browser/` with Chrome flags `--enable-unsafe-webgpu --enable-features=Vulkan`. Run with
  `--disable-features=WebGPU,WebGPUService` to exercise the fallback.

### M2 verification (2026-10-31)

- Unit tests cover radial interpolation, ray-march physical landmarks, uniform packing, progressive
  CPU scheduling, camera reset and disposal of the renderer/viewport against live model properties.
- `tests/browser/volume.spec.ts` compares GPU and CPU pixels for six states, including real orbitals,
  a negative m, Z = 6 and l = 4, with both palettes and both colour modes. It checks the 1s centre
  and the edge-on 2p_z nodal plane separately. It also exercises real keyboard/pointer controls,
  Z-independent view scale, Reset All, missing WebGPU, shader errors and device-loss recovery.
- WSL Chromium on this machine cannot present WebGPU canvases, so GPU comparisons run in Windows
  Chrome against the WSL Vite server. Set `QUANTUM_CHROME` to the Chrome executable and
  `QUANTUM_REQUIRE_GPU=1` to disallow a skipped comparison. Use a freshly started Vite server and a
  Windows-local Playwright `--output` directory to avoid cross-filesystem trace locks.

### M3 verification

- Seeded-sampler moments and real p_x anisotropy are checked statistically; the 1s 90%/95%
  enclosed-density thresholds are checked against the analytic cumulative distribution.
- Analytic nodal ray intersections are checked against closed forms and zeros of ψ.
- The browser comparison covers 96 state/mode/palette/colour/overlay combinations at sampled
  pixels, with a maximum channel-error tolerance of 0.045. Browser interaction tests run on both
  backends and cover deterministic dots, enclosed fraction, radial probing, presets, cutting-plane
  dragging/slider parity and reset.

## Superposition (M4)

Six rows select n/l/m, a nonnegative coefficient magnitude and a phase in radians. Duplicate
basis states are combined before normalization. Complete cancellation produces an empty state and
an explanatory message. Controls retain their relative input weights; the combined wavefunction is
normalized. Editing a coefficient restarts physical time. Presets pause and reset time.

The physical clock is in atomic units, separate from the composed wall-clock timer. CPU float64
relative phases are wrapped before upload. A common phase is removed so degenerate n=2 hybrids
remain stationary in both density and phase colouring. Presets include dipole sloshing, breathing,
rotation, and representative sp/sp²/sp³ hybrids. The full hybrid families are tested for orthonormality.

Mean r and z use radial position matrix elements (cached Simpson quadrature) with exact angular
selection rules. The displayed period, frequency, wavelength and electric-dipole flag refer to the
first two distinct occupied states. A multi-term state can have additional frequencies. The live
history holds the most recent 600 samples, with instantaneous values in the screen summary.

Probability dots use independence Metropolis-Hastings with the incoherent mixture as proposal.
Initial clouds receive 16 sweeps; evolving clouds receive two sweeps per update at about 10 Hz.
They are stochastic probability samples; finite sweeps can lag rapid state changes. CPU animated
scenes update at about 10 Hz and refine while paused. Iso thresholds use the finite 64³ density grid,
refreshed at most four times per second during playback. Grid construction is synchronous.

M4 validation includes analytic dipole amplitude/period, breathing, norm conservation, hybrid
orthonormality, coherent-sampler moments, disposal checks, CPU/GPU pixel comparisons and browser
mixing/playback/reset tests. The earlier apparent hybrid-isosurface discrepancy was an error in visual inspection: direct PNG
pixel comparisons show identical cloud images across profiles. Displayed-image checks are retained.

## Angular Momentum (M5)

The screen uses Scenery paths and arrows, with no WebGPU dependency. Quantum-number spinners
maintain allowed projections as l and j change, including half-integer mj values. A phase slider
and play/pause/single-step controls drive schematic precession. The vector diagram shows the
outer precession cone, the internal L-about-J cone, the head-to-tail L+S triangle and a projection
ladder. The polar plot updates for the selected orbital or spin-traced coupled state.

Unit tests cover vector lengths, closure, projection, uncertainty bounds and spin weights for
all allowed l<=4 states. The shared memory harness checks model and diagram/plot disposal.
Browser tests cover clamps, half-integer controls, playback, reset, keyboard help, pointer fuzz
and keyboard fuzz. The earlier M4 screenshot concern was resolved by direct PNG pixel comparison.

## Zeeman (M6)

The screen offers normal/anomalous mode, Halpha/Lyman-alpha series, charge Z=1–6,
viewing direction, field and selected upper sublevel. Models keep magnetic field in atomic
units. The field slider stores a fraction of the current cap; its visible and accessible values
are mapped to teslas. The cap updates when mode, charge or series changes.

Each l,j group is centred independently on its labelled zero-field energy, with magnetic
shifts magnified on a common scale. Thus the diagram displays splitting rather than the
absolute optical energy gap. Lines originate at the selected upper sublevel. The spectrum
includes every allowed transition, in three polarization rows, on a wavelength axis whose
bounds correspond to the current cap. Degenerate sublevels collapse at B=0.

Changing series briefly produces intermediate property states. Same-shell optical transitions
are rejected and an empty intermediate spectrum is safely skipped. Tests cover this path,
field-unit accessibility, weak-field scaling, polarization filtering, playback and reset.
Unit physics tests include Landé factors, Dirac limits, normal triplets, the ten anomalous
Lyman-alpha positions, wavelength shifts and field caps. No GPU is needed.

## 3D Oscillator (M7)

The screen implements shells N=0–4 in Cartesian and complex spherical bases. The Cartesian
basis uses normalized physicists' Hermite polynomials; the spherical basis uses normalized
r^l L_nr^(l+1/2)(r²) exp(-r²/2) Y_lm. All coordinates are reduced oscillator lengths and
energies are in hbar omega. Spherical terms store n_r in the shared term.n field.

The overlap matrix is computed by five-point Gauss-Hermite quadrature on each axis. It is
exact up to floating-point error for the degree-at-most-eight overlap polynomials. The
matrix display encodes squared magnitude; the selected Cartesian row and spherical column
report the full complex <Cartesian|spherical> coefficient. Tests verify every shell's unitarity
and compare expanded Cartesian states against independent direct Hermite evaluation.

Rendering shares the existing analytic angular shader and radial storage table. Nine oscillator
radial rows follow the 15 hydrogenic rows. The uniform block now has 16 term slots (720 bytes):
Cartesian (4,0,0) requires nine terms, exceeding the original eight-slot plan. Hydrogen remains
the default Wavefunction family. Oscillator CPU and GPU paths use the same term expansions.

The oscillator offers volume and approximately 90% isosurface modes, a phase/density legend,
orbit and zoom controls. Isosurfaces use a 64³ grid in a fixed reduced-coordinate box. Peak
normalization is a coarse 3D visualization estimate. The degeneracy comparison excludes spin
and pairs oscillator shell N with hydrogen principal number n=N+1 to show their growth.

### Display validation

A visual inspection initially suggested missing phase-coloured lobes. Direct pixel checks of the
saved PNGs showed identical M4 cloud RGB pixels and identical M7 cyan-lobe coverage across
French/default and Spanish/projector captures. The apparent discrepancy was an inspection error.
Experimental canvas-copy changes were removed. Browser tests now compare displayed phase-colour
coverage with the renderer bitmap, capturing the display before reading renderer pixels.

## Display and accessibility polish (M8)

All five screen summaries update with model state. Orbitals names the ion, energy, radius,
node counts and node angles; Angular Momentum includes vector magnitudes and the uncoupled
uncertainty product; Zeeman includes wavelength bounds and the selected upper sublevel.
Each summary disposes its derived text and the framework's combined voicing strings. Browser
checks exercise named focusable controls, keyboard help, and live descriptions in en/fr/es
with projector mode. Screen icons are distinct programmatic motifs in profile colours.

Length preferences affect orbital readouts, radial ticks, view scale, probes, superposition
readouts, graph labels and accessible descriptions. Physical model values and history stay
in atomic units. Oscillator coordinates retain their reduced units. The explanatory equation
in the Y_lm tab has its own formula-visibility preference.

Low/medium/high quality chooses GPU dimensions 128/256/512. A stable display canvas avoids
changing viewport bounds. Automatic quality starts at 512 and steps down after six consecutive
completed frames above 40 ms, or up after 48 frames below 18 ms. Idle gaps are excluded.
Resizing replaces the depth attachment but retains pipelines and storage buffers. CPU quality
caps progressive refinement at 64/128/256; auto retains the 12 ms per-frame scheduling budget.
This is a workload mitigation, not a verified 30 fps guarantee on mobile hardware.

URL parameters n/l/m/Z/basis configure the initial Orbitals state. Individual invalid values
are rejected by QueryStringMachine; valid but inconsistent l/m values are clamped. Reset All
returns to the launch state, retaining dialog preferences. quality/lengthUnit/showFormulas
seed their corresponding preferences. No persistence beyond the session is added.

Release tagging and real low-end/mobile performance measurements remain separate follow-up
work. Isosurface grid construction remains synchronous, and the superposition phase control
is a keyboard-accessible slider rather than the dial sketched in the original plan.
