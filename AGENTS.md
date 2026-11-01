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
| Planned | `src/common/model/oscillator/` (M7), `angular/` (M5–M6) |
| GPU engine | `src/common/gpu/` — `GpuContext.ts`, WGSL in `shaders/`, `WebGpuOrbitalRenderer.ts`, `CpuOrbitalRenderer.ts` |
| Scenery/GPU boundary | `src/common/view/OrbitalViewportNode.ts` (one `Image` around the engine canvas) |
| Clock | `src/common/TimeModel.ts`, composed by `SuperpositionModel` |
| Screens | `src/<screen>/` — `*Screen.ts`, `model/`, `view/`; icons in `src/common/QuantumAtom3DScreenIcons.ts` |
| i18n | `src/i18n/StringManager.ts`, `strings_{en,es,fr}.json` |
| Preferences / query params | `src/preferences/` — phase colour wheel (`hsv` / `uniform`) |

## Model

- **Units.** Hartree atomic units in every model (lengths in a0, energies in E_h, times in ħ/E_h).
  Conversions to pm, eV, fs and nm belong in one place, `common/model/AtomicUnits.ts`. Never scale
  inline.
- **States are term lists.** Each 3D state is a list of up to 8 terms: a coefficient, quantum numbers
  and a basis kind. Real orbitals, hybrids and Cartesian oscillator states are all term lists of
  spherical states. The CPU's `Wavefunction.evaluate` and the WGSL field chunk have to agree term for
  term.
- **No shared model.** Each screen model composes the common classes; there is no `SharedModel`.

## Accessibility

Follows the shared [OpenLyceum accessibility convention](https://github.com/OpenLyceum/Baton/blob/main/ACCESSIBILITY.md).
Each screen ships PDOM names, a `*ScreenSummaryContent`, and a `*KeyboardHelpContent`, with an explicit
`pdomOrder`. Strings are under `a11y.<screenKey>` (`orbitals`, `superposition`, `angularMomentum`,
`zeeman`, `oscillator`), exposed through `StringManager.get<Screen>A11yStrings()`.

- Keep the 3D viewport keyboard-operable: arrows orbit and +/− zoom.
- Give every pointer gesture in 3D a slider equivalent.
- Orbitals' keyboard help covers its spinners, sliders, radio buttons and checkbox. The other four
  are still scaffold stubs; fill each one in when its screen gains interactions.
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

### Template-owned files (drift-checked)

Infrastructure files are owned by this template and must stay byte-identical in every sim
(after substituting the sim's own name). `Baton/scripts/check-template-drift.sh <Sim>` compares a
sim against this repo using `Baton/config/template-manifest.json`, which lists the exact files,
the required `package.json` scripts, and the few keys a sim may extend (extra `biome.json`
ignores, extra tsconfig `types`, CSP/Permissions additions).

To diverge on purpose, add a bullet to the sim's own `## Compliance carve-outs` section naming
the file in backticks and the reason, e.g. ``- `tests/setup.ts`: adds a WebGPU mock``. The drift
checker treats a file named there as approved. Fix template-owned files **here first**, then
propagate — never hand-edit one in a single sim.

### `package.json` overrides

JSON cannot carry comments, so the rationale for forced transitive pins lives here. Prefer
**tilde (`~`) or exact** versions — caret (`^`) lets minors drift under what is meant to be a
hard pin. Dependabot ignores these three names (see `.github/dependabot.yml`) so it does not
open PRs that fight the overrides. Revisit when SceneryStack drops or re-pins them upstream.

| Override | Pin | Why |
|---|---|---|
| `lodash` | `~4.18.1` | SceneryStack declares `~4.17.12`. Bump clears Dependabot/npm advisories patched in 4.18.x (e.g. GHSA-r5fr-rjxr-66jc, GHSA-f23m-r3pf-42rh). |
| `three` | `~0.125.2` | Only SceneryStack's transitive dependency; this sim does not use mobius or three.js. SceneryStack declares `^0.104.0`. Floor is 0.125.0 for GHSA-fq6p-x6j3-cmmq (ReDoS). Staying on the 0.125 line avoids a larger API jump; **0.125.x still has open CVEs** (e.g. XSS GHSA-7vvq-7r29-5vg3, fixed only in ≥0.137.0). Remove this override if/when SceneryStack stops depending on `three` or pins a patched line itself. |
| `brace-expansion` | `~5.0.12` | Transitive via `vite-plugin-pwa` / Workbox. Clears npm audit (originally GHSA-mh99-v99m-4gvg; keep ≥5.0.9 for GHSA-rgw5-rvv9-x895; ≥5.0.12 for the CPU-DoS advisory). |

## Testing

Fleet-standard Vitest layout (`happy-dom`, `tests/setup.ts`, `execArgv: ["--expose-gc"]`). Unit tests go
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
  under test. Landé g_J and oscillator degeneracy come with M6 and M7.
- **WebGPU.** It is unavailable under Vitest, so test the CPU renderer there. Compare GPU and CPU in
  `tests/browser/` with Chrome flags `--enable-unsafe-webgpu --enable-features=Vulkan`.
  `QUANTUM_CHROME` optionally supplies a Chrome executable; `QUANTUM_REQUIRE_GPU=1` makes unavailable
  GPU presentation fail instead of skip. Run against a freshly started Vite server: importing a
  module without an HMR timestamp after editing source creates a second module instance.

## Commands

```bash
npm run lint && npm run check && npm run build && npm test
```

| Command | Description |
|---|---|
| `npm start` / `npm run dev` | Vite dev server |
| `npm run build` | Type-check + production build |
| `npm run build:single` | Single-file build mode |
| `npm run check` | TypeScript (`tsc --noEmit` on app, scripts, and tests) |
| `npm run lint` / `npm run fix` | Biome check / auto-fix |
| `npm test` | Vitest unit tests |
| `npm run test:fuzz` | Playwright fuzz smoke (pointer + keyboard, `?ea`, 30s each; `npm run test:fuzz -- 90` to change) |
| `npm run test:fuzz:quick` | 10s fuzz |
| `npm run test:fuzz:long` | 300s fuzz |
| `npm run icons` | Regenerate PWA icons; seed missing screenshots, preserve existing ones |
| `npm run release` | `check && lint && build && test`, then version patch + push tags |

`src/init.ts` reads `version` from `package.json`, so the patch bump shows up in the About dialog
without a second edit.

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
