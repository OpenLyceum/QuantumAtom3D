# AGENTS.md — Quantum Atom 3D

Sim-specific context for AI assistants. General SceneryStack guidance: [OpenLyceum/.github/AGENTS.md](https://github.com/OpenLyceum/.github/blob/main/AGENTS.md).

## Project

This is a five-screen sim for upper-year undergraduate quantum mechanics. It covers hydrogenic orbitals
in 3D (Z = 1–6), superpositions that evolve in time, the angular-momentum vector model, normal and
anomalous Zeeman splitting with selection rules, and the degeneracy of the isotropic 3D oscillator. The
3D views are rendered with **WebGPU**, using HeatTransfer's GPU architecture. A CPU reference renderer
serves as the fallback.

Educator physics: [`doc/model.md`](doc/model.md). Architecture and roadmap: [`doc/implementation-notes.md`](doc/implementation-notes.md).

| Screen | Folder | Focus | GPU |
|---|---|---|---|
| Orbitals | `src/orbitals/` | ψ_nlm, real/complex basis, Z, dots/volume/isosurface, P(r), slice, nodes | yes |
| Superposition | `src/superposition/` | Σ c_k ψ_k e^{−iE_k t}, presets (dipole sloshing, hybrids), ⟨z⟩(t) | yes |
| Angular Momentum | `src/angular-momentum/` | L cone, L_z ladder, L+S→J vector model | no |
| Zeeman | `src/zeeman/` | Normal/anomalous splitting, Δm selection rules, π/σ± polarization | no |
| 3D Oscillator | `src/oscillator/` | N = 2n_r + l, (N+1)(N+2)/2, Cartesian ↔ spherical basis | yes |

Shared code uses the `QuantumAtom3D` prefix. The oscillator screen's classes are `Oscillator*`; an
identifier cannot start with a digit. Its title remains "3D Oscillator".

## Key files

| Area | Location |
|---|---|
| Colors / constants / namespace | `src/QuantumAtom3DColors.ts`, `QuantumAtom3DConstants.ts` (atomic units), `QuantumAtom3DNamespace.ts` |
| Units | `src/common/model/AtomicUnits.ts` — the only place atomic units meet eV, pm, fs, nm, T |
| Special functions | `src/common/model/math/` — `specialFunctions.ts` (Laguerre, root finder), `sphericalHarmonics.ts` (Y_lm, P_l^m, Condon–Shortley) |
| Hydrogen | `src/common/model/hydrogen/` — `HydrogenRadial.ts` (R_nl, nodes, peak, enclosing radius), `HydrogenExpectations.ts` (E_n, ⟨r⟩, ⟨r²⟩), `HydrogenicIons.ts` |
| States | `src/common/model/orbital/` — `OrbitalTerm.ts`, `OrbitalCatalog.ts` (real orbitals as term lists), `Wavefunction.ts` (CPU evaluator), `NodalSurfaces.ts`, `SliceSampler.ts`, `SliceNodalCurves.ts`, `OrbitalSummary.ts`, `QuantumNumbersModel.ts` |
| Shared views | `src/common/view/` — `SliceHeatmapNode.ts`, `RadialDistributionChartNode.ts`, `QuantumNumberControl.ts`, `OrbitalReadoutPanel.ts`, `ColormapLegendNode.ts`, `Colormaps.ts`, `formatters.ts` |
| Oscillator / angular | `src/common/model/oscillator/`, `angular/` |
| GPU engine | `src/common/gpu/` — `GpuContext.ts`, WGSL in `shaders/`, `WebGpuOrbitalRenderer.ts`, `CpuOrbitalRenderer.ts` |
| Scenery/GPU boundary | `src/common/view/OrbitalViewportNode.ts` (one `Image` around the engine canvas) |
| Clock | `src/common/TimeModel.ts`, composed by `SuperpositionModel` |
| Screens | `src/<screen>/` — `*Screen.ts`, `model/`, `view/`; icons in `src/common/QuantumAtom3DScreenIcons.ts` |
| i18n | `src/i18n/StringManager.ts`, `strings_{en,es,fr}.json` |
| Preferences / query params | `src/preferences/` — phase wheel, render quality, length units, formula visibility and orbital permalinks |

## Model

- **Units.** Hartree atomic units in every model (lengths in a0, energies in E_h, times in ħ/E_h).
  Conversions to pm, eV, fs and nm belong in one place, `common/model/AtomicUnits.ts`. Never scale
  inline.
- **States are term lists.** Each 3D state is a list of up to 16 terms: a coefficient, quantum numbers
  and a basis kind. Real orbitals, hybrids and Cartesian oscillator states are all term lists of
  spherical states. The CPU's `Wavefunction.evaluate` and the WGSL field chunk have to agree term for
  term.
- **Oscillator units.** Oscillator models use reduced length sqrt(hbar/m omega) and energy hbar omega.
  `Wavefunction.family` selects hydrogenic or oscillator radial functions; oscillator `term.n` means n_r.
  The oscillator radial rows follow the 15 hydrogenic rows in the shared GPU table. Sixteen term slots
  are required because Cartesian (4,0,0) has nine nonzero spherical coefficients.
- **No shared model.** Each screen model composes the common classes; there is no `SharedModel`.

## Accessibility

Follows the shared [OpenLyceum accessibility convention](https://github.com/OpenLyceum/Baton/blob/main/ACCESSIBILITY.md).
Each screen ships PDOM names, a `*ScreenSummaryContent`, and a `*KeyboardHelpContent`, with an explicit
`pdomOrder`. Strings are under `a11y.<screenKey>` (`orbitals`, `superposition`, `angularMomentum`,
`zeeman`, `oscillator`), exposed through `StringManager.get<Screen>A11yStrings()`.

- Keep the 3D viewport keyboard-operable: arrows orbit and +/− zoom.
- The cutting-plane handle shares its offset with the slice slider; radial hover shares a probe slider.
- Node overlays are analytic ray events; maintain CPU/WGSL parity when changing their intersections.
- `Params` occupies 720 bytes. The dot pass composites foreground surfaces per fragment.
- Give every pointer gesture in 3D a slider equivalent.
- All five screens provide live summaries and keyboard help. Summary subclasses own and dispose their
  derived text through `DisposableScreenSummaryContent`, which also releases the framework text nodes.
- The n, l, m spinners are exposed to assistive technology as sliders (`role="slider"`), which is
  how scenery's `NumberSpinner` works. Browser tests should query them by that role.

## Compliance carve-outs

- **Hardcoded colors** in `src/common/view/Colormaps.ts` and `ColormapLegendNode.ts`: these are data
  colours computed from ψ (the phase wheels and the inferno density ramp). They must not follow the
  colour profile, or the legend would stop matching the heatmap. Theme chrome around them still comes
  from `QuantumAtom3DColors.ts`.

- `src/common/gpu/`: GPU-only state, as in FluidDynamics.
- `src/common/gpu/webgpu-globals.d.ts`: an ambient declaration of the WebGPU flag namespaces. It is
  copied from HeatTransfer, and `tsconfig.test.json` includes it.

## Testing

only under root `tests/`, mirroring `src/`.

| Path | Purpose |
|---|---|
| `tests/common/model/math/` | Y_lm closed forms, the Condon–Shortley relation, orthonormality on the sphere |
| `tests/common/model/hydrogen/` | R_nl closed forms, normalization, ⟨r⟩/⟨r²⟩ against quadrature, node positions, r_peak = n²/Z, 1s enclosed probability |
| `tests/common/model/orbital/` | Real orbitals (orientation, reality, norm), 3D normalization, phase winding, slices, nodal cones and planes, nodal curves lying on ψ = 0, the n/l/m clamping |
| `tests/common/view/Colormaps.test.ts` | Uniform wheel in gamut with nearly constant luminance; HSV and inferno anchors |
| `tests/TimeModel.test.ts` | Composable play/pause timer |
| `tests/memory-leak.test.ts` | Every disposable model: `TimeModel`, `SuperpositionModel`, `QuantumNumbersModel`, `OrbitalsModel` |
| `tests/fuzz/fuzz.spec.ts` | Template-owned Playwright fuzz smoke |

- **Physics tests.** Check against closed forms or independent quadrature, never against the code
  under test. Landé g_J and oscillator degeneracy have independent physics checks.
- **WebGPU.** It is unavailable under Vitest, so test the CPU renderer there. Compare GPU and CPU in
  `tests/browser/` with Chrome flags `--enable-unsafe-webgpu --enable-features=Vulkan`.
  `QUANTUM_CHROME` optionally supplies a Chrome executable; `QUANTUM_REQUIRE_GPU=1` makes unavailable
  GPU presentation fail instead of skip. Run against a freshly started Vite server: importing a
  module without an HMR timestamp after editing source creates a second module instance.

## Responsive display and deferred work

- `ResponsiveScreenView` owns portrait grouping, clipping, scrolling and focus reveal. Give every
  top-level content node exactly one portrait section; preserve desktop PDOM order for restoration.
- Surface requests use `ProbabilitySurfaceTask` and `ProgressiveSurface`: weighted spherical
  cubature plus a cooperative threshold search. Keep the uniform Cartesian grid as a reference.
- Views advance jobs only while their screen steps. Supersede paused requests on state changes;
  never publish an older request over the newest paused state. Show a localized status while pending.
- `MetropolisSampler.begin/advance` must retain the exact synchronous `update` seeded sequence.
- `main.ts` installs portrait toolbar controls after the framework constructs views. Its links and
  screen views intentionally live for the sim lifetime. Do not access the private NavigationBar.
- [Functional review and release gaps](doc/review-2026-11-01.md).

## Display preferences

- Pass the shared preferences instance through screen options. Reset All restores launch-time state,
  including orbital permalinks, but retains preferences chosen in the dialog.
- `n`, `l`, `m`, `Z`, `basis` configure Orbitals. Validate each value in the query schema and clamp
  dependent l/m before constructing the constrained model. `seed` reproduces probability dots.
- Length conversion is display-only; squared lengths require the square of the conversion factor.
  The radial plot retains atomic-unit coordinates and regenerates its tick cache when the unit changes.
- `quality=low|medium|high|auto`: GPU sizes 128/256/512 with a stable 512 display canvas; CPU maximum
  refinement 64/128/256 (auto uses the CPU frame budget). Automatic GPU quality uses completed queue
  latency and hysteresis, never idle-frame spacing. Direct reference renderer tests retain fixed sizes.
- `showFormulas` controls the explanatory wavefunction equation in Orbitals' Y_lm tab. Mathematical
  symbols in controls and physical readouts remain visible.

## Development notes

- **Startup.** Do backend selection once, asynchronously, in `main.ts` before `sim.start()`; model
  factories cannot await. HeatTransfer `GpuContext.ts` has the pattern.
- **Bind groups.** Use explicit bind-group layouts, never `layout: "auto"`. Keep the hand-computed
  uniform byte sizes beside each WGSL struct.
- **Phases.** Compute per-term phases in float64 on the CPU and wrap them mod 2π before uploading. A
  float32 E·t drifts visibly within seconds.
- **Weak-field Zeeman.** It is only valid for μ_B B much smaller than the fine-structure splitting, which
  for hydrogen n = 2 means B well below 1 T. Cap the anomalous-mode B range, and do not quietly extend it
  into the Paschen–Back regime.
- **View scale is independent of Z.** `viewHalfWidthProperty` fits the Z = 1 orbital for the current
  n and l, divided by √2 per zoom level. Raising Z must visibly shrink the orbital, so do not auto-fit
  on Z.
- **Phase wheels.** The heatmap multiplies the hue by |ψ|, so a phase wheel must have constant
  lightness, as the OKLCH `uniform` wheel does. Wheels with dark hues, such as twilight, hide whole
  lobes.
- **PWA.** After `npm run build`, the sim is installable offline via Workbox (`dist/manifest.webmanifest`).
