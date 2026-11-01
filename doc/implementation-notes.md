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
to 8 terms c_k R_k(r) Y_{l_k m_k}(θ, φ):

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
  cones, planes). It also draws the cutting plane and the highlighted shell.
- **Dots.** An instanced billboard pipeline draws the dots, depth-tested against the depth written by the
  first pass.
- **Scenery overlays.** Axes, labels and drag handles are Scenery nodes projected with the same
  `OrbitCamera`.
- **On demand.** A frame is rendered only when the state or camera changed, or when time is running.
  Resolution scales with measured frame time.

**CPU backend.** It is used when WebGPU is missing, a shader fails, or `?forceCpu` is set. It is the same
pipeline in TypeScript, calling the same `Wavefunction.evaluate`: a low-resolution ray-march that refines
progressively and is time-sliced across frames, plus dots drawn in a `CanvasNode`. It is also the
reference implementation: a browser spec compares GPU and CPU pixels.

**Other CPU-side work:**

- A 64³ density grid, used only to turn an enclosed-probability fraction into an iso level.
- The 128² slice heatmap.
- The Monte Carlo sampler: inverse-CDF sampling for eigenstates, Metropolis for superpositions, seeded.
- Analytic node positions, found by bisection.

## State of the Orbitals screen (M2)

The left column is a rotatable 3D volume. The middle column switches between the radial chart with
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
- **Current limits.** Adaptive GPU resolution and quality preferences are pending. Dots, isosurfaces,
  nodal surfaces in 3D, picking, and linked chart hover belong to M3. The nodes checkbox currently
  affects the cross-section only.

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
| M3 | Dots, isosurface, nodal surfaces, cutting plane, P(r) ↔ 3D hover, presets |
| M4 | Superposition screen |
| M5 | Angular Momentum screen |
| M6 | Zeeman screen |
| M7 | 3D Oscillator screen |
| M8 | Accessibility descriptions, es/fr review, thumbnails, release |

## Accessibility

- **Screen summaries.** Each screen has a `*ScreenSummaryContent` whose `currentDetailsContent` will be a
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
