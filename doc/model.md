# Model - Quantum Atom 3D

This document describes the physics and mathematics behind the simulation, in terms appropriate for an
educator. It is the companion to [implementation-notes.md](./implementation-notes.md), which targets
developers.

> **Status.** The sim is being built in milestones (see implementation-notes §"Roadmap"). This file
> describes the target model for all five screens; each section notes the screen that uses it.

## Overview

The simulation treats a single electron bound to a point nucleus of charge Ze (a *hydrogenic* atom:
H, He⁺, Li²⁺, …) and, for contrast, a particle in an isotropic three-dimensional harmonic well. Both
potentials are spherically symmetric, so every stationary state factors into a radial function and a
spherical harmonic. Students see the three-dimensional probability density |ψ|², the complex phase of
ψ as colour, the radial distribution P(r), and the nodal surfaces, and they connect what they see to
the quantum numbers n, l, m.

The later screens add time and fields. A superposition of states with different energies is no longer
stationary: its charge cloud oscillates at the Bohr frequency ΔE/h, which is the classical picture of
the emitted light. The vector model shows angular momentum as a vector of fixed length precessing on a
cone, and a magnetic field splits each level into Zeeman components whose allowed transitions obey
dipole selection rules. The oscillator screen shows why the oscillator's degeneracy is (N+1)(N+2)/2 while
hydrogen's is n², and how the Cartesian and spherical bases span the same degenerate subspaces.

## Quantities and units

The model works in Hartree atomic units (ħ = mₑ = e = 4πε₀ = 1) and converts for display.

| Quantity | Symbol | Model unit | Displayed as | Range |
|---|---|---|---|---|
| Nuclear charge | Z | e | integer | 1 – 6 |
| Principal quantum number | n | – | integer | 1 – 5 |
| Orbital quantum number | l | – | integer | 0 – n−1 |
| Magnetic quantum number | m | – | integer | −l – l |
| Distance from nucleus | r | a0 (52.918 pm) | a0 or pm | 0 – ~60 a0/Z |
| Energy | E | E_h (27.2114 eV) | eV | −13.6 Z² eV and up |
| Time | t | ħ/E_h (24.189 as) | fs | 0 – ∞ |
| Magnetic field | B | T | T | 0 – a few T |
| Oscillator energy, length | E, r | ħω, √(ħ/mω) | same | N = 0 – 4 |

## Governing equations

### Hydrogenic eigenstates (Orbitals, Superposition)

ψ_nlm(r, θ, φ) = R_nl(r) Y_lm(θ, φ), with energy E_n = −Z²/(2n²) E_h.

R_nl(r) = N_nl · ρ^l · e^{−ρ/2} · L_{n−l−1}^{(2l+1)}(ρ), where ρ = 2Zr/(n a0) and L is an associated
Laguerre polynomial. The normalization is ∫ R² r² dr = 1.

Y_lm(θ, φ) = N_lm P_l^m(cos θ) e^{imφ}, with the Condon–Shortley phase. Real orbitals (2p_x, 3d_z², …)
are the combinations (Y_l,−m ± Y_lm)/√2, which have φ-nodal planes instead of a winding phase.

The radial distribution is P(r) = r² |R_nl(r)|², so P(r) dr is the probability of finding the electron
in a thin shell. Exact expectation values are

- ⟨r⟩ = (a0 / 2Z) [3n² − l(l+1)]
- ⟨r²⟩ = (a0² n² / 2Z²) [5n² + 1 − 3l(l+1)], and r_rms = √⟨r²⟩

so the size of the atom grows as n² and shrinks as 1/Z.

The state has n − l − 1 radial nodes (spheres) and l angular nodes. Of the angular nodes, l − |m| are
cones (or the xy-plane) where P_l^m(cos θ) = 0. In the real basis the other |m| are planes containing
the z-axis. In the complex basis those |m| nodes are replaced by a phase that winds by 2π|m| around the
z-axis.

The isosurface encloses a chosen fraction of the probability (90 % or 95 %). The sim finds the density
level c such that the region where |ψ|² > c contains that fraction.

### Superpositions (Superposition)

ψ(t) = Σ_k c_k ψ_k e^{−iE_k t/ħ}, normalized so Σ|c_k|² = 1. The density contains cross terms that
oscillate at ω_jk = (E_j − E_k)/ħ. The dipole moment ⟨z⟩(t) oscillates only when the pair satisfies the
electric-dipole selection rules Δl = ±1, Δm = 0, ±1; the sim shows ⟨z⟩(t) and ⟨r⟩(t) and the photon
wavelength λ = hc/|ΔE|. A mixture of degenerate states (such as the sp³ hybrids, built entirely from
n = 2) does not change in time, even though its shape is not spherical.

### Angular-momentum vector model (Angular Momentum)

|L| = √(l(l+1)) ħ and L_z = mħ, so L lies on a cone of half-angle cos⁻¹(m/√(l(l+1))) and never points
along z. L_x and L_y are undetermined; ⟨L_x²⟩ = ⟨L_y²⟩ = [l(l+1) − m²] ħ²/2. With spin, S has
|S| = (√3/2) ħ, the allowed values are j = l ± ½, and L and S precess about J = L + S, which in turn
precesses about the field axis.

### Zeeman effect (Zeeman)

**Normal (spin neglected).** ΔE = μ_B B m_l with μ_B = 5.788 × 10⁻⁵ eV/T. Every Δm_l = 0, ±1 transition
between two levels has the same splitting, so each line becomes three.

**Anomalous (weak field, with spin).** The fine-structure energy is
E_nj = E_n [1 + (Zα)²/n² (n/(j+½) − ¾)]. The weak-field shift is ΔE = g_J μ_B B m_j with the Landé factor
g_J = 1 + [j(j+1) + s(s+1) − l(l+1)] / [2j(j+1)] (taking g_s = 2). Allowed lines obey Δl = ±1,
Δj = 0, ±1, Δm_j = 0, ±1.

**Polarization.** Δm = 0 lines are π (linear, along B) and Δm = ±1 lines are σ± (circular about B).
Looking along B, only σ± lines are visible. Looking perpendicular to B, all lines are visible.

### Isotropic harmonic oscillator (3D Oscillator)

E = (N + 3/2) ħω with N = n_x + n_y + n_z = 2n_r + l. The Cartesian states are products of
one-dimensional Hermite functions; the spherical states have R ∝ r^l e^{−r²/2} L_{n_r}^{(l+½)}(r²).
Level N contains (N+1)(N+2)/2 states, with l = N, N−2, …, down to 0 or 1. The two bases are related
within each level by a unitary matrix ⟨n_x n_y n_z | n_r l m⟩, which the sim shows.

## Simplifications and assumptions

- Infinite nuclear mass: the reduced-mass correction (about 0.05 % for hydrogen) is ignored.
- Non-relativistic Schrödinger states throughout. Fine structure appears only in the Zeeman screen's
  anomalous mode, as an energy shift. The states drawn are not the coupled |j m_j⟩ spinors.
- No Lamb shift and no hyperfine structure.
- Anomalous Zeeman uses the weak-field (Landé) formula only. For hydrogen this holds when μ_B B is much
  smaller than the fine-structure splitting (n = 2: about 4.5 × 10⁻⁵ eV). The B slider is capped and
  labelled accordingly. The cap scales as Z⁴ for ions. The strong-field Paschen–Back regime is not
  modelled.
- The Zeeman shift is taken as linear in B. The diamagnetic (B²) term is neglected.

## References

- D. J. Griffiths and D. F. Schroeter, *Introduction to Quantum Mechanics*, 3rd ed., §4.1–4.4, §6.4–6.5.
- B. H. Bransden and C. J. Joachain, *Physics of Atoms and Molecules*, 2nd ed., ch. 3 and 6.
- NIST Digital Library of Mathematical Functions, §14 (Legendre functions) and §18 (orthogonal
  polynomials).
