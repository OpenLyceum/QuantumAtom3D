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
| Shared physics (planned M1) | `src/common/model/` — `math/`, `hydrogen/`, `oscillator/`, `orbital/`, `angular/` |
| GPU engine (planned M2) | `src/common/gpu/` — `GpuContext.ts`, WGSL in `shaders/`, `WebGpuOrbitalRenderer.ts`, `CpuOrbitalRenderer.ts` |
| Scenery/GPU boundary (planned M2) | `src/common/view/OrbitalViewportNode.ts` (one `Image` around the engine canvas) |
| Clock | `src/common/TimeModel.ts`, composed by `SuperpositionModel` |
| Screens | `src/<screen>/` — `*Screen.ts`, `model/`, `view/`; icons in `src/common/QuantumAtom3DScreenIcons.ts` |
| i18n | `src/i18n/StringManager.ts`, `strings_{en,es,fr}.json` |
| Preferences / query params | `src/preferences/` — phase colour wheel (`hsv` / `twilight`) |

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
- The keyboard-help files are still the scaffold stubs. Fill each one in when its screen gains
  interactions.

## Compliance carve-outs

None yet. When the GPU engine lands (M2), add these two:

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
| `three` | `~0.125.2` | SceneryStack declares `^0.104.0`. Floor is 0.125.0 for GHSA-fq6p-x6j3-cmmq (ReDoS). Staying on the 0.125 line avoids a larger API jump; **0.125.x still has open CVEs** (e.g. XSS GHSA-7vvq-7r29-5vg3, fixed only in ≥0.137.0). Remove this override if/when SceneryStack stops depending on `three` or pins a patched line itself. |
| `brace-expansion` | `~5.0.12` | Transitive via `vite-plugin-pwa` / Workbox. Clears npm audit (originally GHSA-mh99-v99m-4gvg; keep ≥5.0.9 for GHSA-rgw5-rvv9-x895; ≥5.0.12 for the CPU-DoS advisory). |

### `package.json` overrides

The template's overrides are unchanged. The `three` pin is only there for SceneryStack's transitive
dependency: this sim does not use mobius or three.js.

| Override | Pin | Why |
|---|---|---|
| `lodash` | `~4.18.1` | SceneryStack declares `~4.17.12`; 4.18.x clears Dependabot/npm advisories. |
| `three` | `~0.125.2` | SceneryStack declares `^0.104.0`; floor 0.125.0 for GHSA-fq6p-x6j3-cmmq. Unused by this sim's code. |
| `brace-expansion` | `~5.0.12` | Transitive via `vite-plugin-pwa` / Workbox; clears npm audit advisories. |

## Testing

Fleet-standard Vitest layout (`happy-dom`, `tests/setup.ts`, `execArgv: ["--expose-gc"]`). Unit tests go
only under root `tests/`, mirroring `src/`.

| Path | Purpose |
|---|---|
| `tests/TimeModel.test.ts` | Composable play/pause timer |
| `tests/memory-leak.test.ts` | Every disposable model, including `SuperpositionModel` |
| `tests/fuzz/fuzz.spec.ts` | Template-owned Playwright fuzz smoke |

- **Physics tests.** Planned from M1: checks against closed forms (⟨r⟩, normalization, node counts,
  Landé g_J, oscillator degeneracy) and against quadrature.
- **WebGPU.** It is unavailable under Vitest, so test the CPU renderer there. Compare GPU and CPU in
  `tests/browser/` with Chrome flags `--enable-unsafe-webgpu --enable-features=Vulkan`.

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
- **PWA.** After `npm run build`, the sim is installable offline via Workbox (`dist/manifest.webmanifest`).
