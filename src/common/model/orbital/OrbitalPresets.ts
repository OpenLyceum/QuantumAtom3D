/** Stationary states illustrating radial nodes, angular nodes and opposite phase winding. */
export const ORBITAL_PRESETS = [
  { key: "ground", n: 1, l: 0, m: 0, basis: "complex" },
  { key: "radial", n: 2, l: 0, m: 0, basis: "complex" },
  { key: "polar", n: 2, l: 1, m: 0, basis: "real" },
  { key: "cones", n: 3, l: 2, m: 0, basis: "real" },
  { key: "positive", n: 2, l: 1, m: 1, basis: "complex" },
  { key: "negative", n: 2, l: 1, m: -1, basis: "complex" },
] as const;
