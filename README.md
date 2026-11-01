# Quantum Atom 3D

[![CI](../../actions/workflows/ci.yml/badge.svg)](../../actions/workflows/ci.yml)

An interactive 3D hydrogenic atom for upper-year quantum mechanics, built with
[SceneryStack](https://scenerystack.org/). It shows orbitals and probability density with
complex-phase colouring, radial distributions, superpositions that evolve in time, the
angular-momentum vector model, Zeeman splitting with selection rules, and the degeneracy of the
isotropic 3D oscillator.

**Status:** Orbitals, Superposition, Angular Momentum and Zeeman screens are implemented. A Superposition
isosurface visual check remains open. The 3D Oscillator screen remains planned; see
[`doc/implementation-notes.md`](doc/implementation-notes.md).

## Features

- **Orbitals:** ψ_nlm for n ≤ 5, in the complex or real basis, with Z = 1–6 (H, He⁺, Li²⁺, …).
  Volume rendering with phase or density colours, pointer/keyboard orbit and zoom, camera sliders,
  probability dots, 90%/95% isosurfaces, analytic 3D nodes, a draggable cutting plane and linked
  P(r) probing. Includes stationary-state presets and expectation-value readouts.
- **Superposition (M4 in validation):** mix up to six eigenstates, evolve their relative phases,
  track mean radius and mean z, and explore dipole, breathing, rotation and sp/sp²/sp³ presets.
- **Angular Momentum:** orbital precession cones, projections and uncertainties; L + S → J
  coupling, half-integer projections and a spin-traced angular-density plot.
- **Zeeman:** normal/anomalous splitting, Dirac fine structure, weak-field limits, selection rules,
  polarization filtering, spectral positions and schematic Larmor precession.
- **3D Oscillator (planned):** (N+1)(N+2)/2 degeneracy, Cartesian ↔ spherical basis, comparison with hydrogen.
- WebGPU rendering with a progressive CPU fallback, including recovery after device loss. Use
  `?forceCpu=true` to select the CPU renderer explicitly; `?seed=173` reproduces the dot samples.
- English, Spanish and French. Default and projector colour profiles. Installable as a PWA.

## Quick Start

```bash
npm install
npm run icons    # generate PNG icons from public/icons/icon.svg
npm start        # dev server → http://localhost:5173
```

## Scripts

| Command | Description |
|---|---|
| `npm start` / `npm run dev` | Start Vite dev server |
| `npm run build` | Type-check + production build → `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm test` | Run Vitest unit tests (includes memory-leak suite) |
| `npm run test:fuzz` | Optional Playwright fuzz smoke: pointer (`?fuzz`) + keyboard (`?fuzzBoard`), with `?ea`, 30s each |
| `npm run test:fuzz -- 90` | Same fuzz for 90 seconds (`--duration 90` or `FUZZ_DURATION=90` also work) |
| `npm run test:fuzz:quick` | Shorter fuzz smoke (10s) |
| `npm run test:fuzz:long` | Longer fuzz smoke (300s) |
| `npm run check` | TypeScript type check |
| `npm run lint` | Biome lint check |
| `npm run format` | Auto-format all files |
| `npm run fix` | Lint + auto-fix |
| `npm run icons` | Regenerate PNG icons from `public/icons/icon.svg` |
| `npm run release` | `check && lint && build && test`, then version patch + push tags |
| `npm run clean` | Remove `dist/` |

New sims start at `version: "0.0.0"` in `package.json`. Bump only when cutting a release (for example `npm version patch` and a matching git tag). Keep `name` in kebab-case; it is separate from the SceneryStack sim identifier in `src/init.ts`, which reads its `version` from `package.json`.

## Tech Stack

| Tool | Version | Purpose |
|---|---|---|
| [SceneryStack](https://scenerystack.org/) | ^3.0.0 | Simulation framework |
| [Vite](https://vitejs.dev/) | ^8 | Build tool + dev server |
| [TypeScript](https://www.typescriptlang.org/) | ^7 | Type-safe JavaScript |
| [Biome](https://biomejs.dev/) | ^2.5 | Linting + formatting |
| [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) | ^2 | PWA + service worker |

## License

GNU Affero General Public License v3.0 — see [OpenLyceum org license](https://github.com/OpenLyceum/.github/blob/main/LICENSE).

## Contributing

See [OpenLyceum contributing guidelines](https://github.com/OpenLyceum/.github/blob/main/CONTRIBUTING.md).
Report bugs via GitHub Issues; use org issue templates.
