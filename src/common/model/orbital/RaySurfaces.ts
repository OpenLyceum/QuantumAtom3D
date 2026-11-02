/** Analytic intersections in atomic units. Rays have a unit direction. */
import type { NodalSurfaceSet } from "./NodalSurfaces.js";

export type Point3 = readonly [number, number, number];
const EPSILON = 1e-10;

function quadraticRoots(a: number, b: number, c: number): number[] {
  if (Math.abs(a) < EPSILON) {
    return Math.abs(b) < EPSILON ? [] : [-c / b];
  }
  const discriminant = b * b - 4 * a * c;
  if (discriminant < 0) {
    return [];
  }
  const root = Math.sqrt(discriminant);
  return root === 0 ? [-b / (2 * a)] : [(-b - root) / (2 * a), (-b + root) / (2 * a)];
}

export function planeHit(origin: Point3, direction: Point3, normal: Point3, offset = 0): number | null {
  const denominator = dot(direction, normal);
  return Math.abs(denominator) < EPSILON ? null : (offset - dot(origin, normal)) / denominator;
}

function dot(a: Point3, b: Point3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

/** The plane at θ=π/2 is handled separately; other angles represent one half-cone each. */
export function nodalRayHits(origin: Point3, direction: Point3, nodes: NodalSurfaceSet, radius: number): number[] {
  const hits: number[] = [];
  const originSquared = dot(origin, origin);
  const od = dot(origin, direction);
  const add = (t: number | null) => {
    if (t !== null && originSquared + 2 * od * t + t * t <= radius * radius * (1 + EPSILON)) {
      hits.push(t);
    }
  };
  for (const r of nodes.radialNodeRadii) {
    for (const t of quadraticRoots(1, 2 * od, originSquared - r * r)) {
      add(t);
    }
  }
  for (const theta of nodes.polarNodeAngles) {
    const cos = Math.cos(theta);
    if (Math.abs(cos) < EPSILON) {
      add(planeHit(origin, direction, [0, 0, 1]));
      continue;
    }
    const c2 = cos * cos;
    const roots = quadraticRoots(
      direction[2] ** 2 - c2,
      2 * (origin[2] * direction[2] - c2 * od),
      origin[2] ** 2 - c2 * originSquared,
    );
    for (const t of roots) {
      if ((origin[2] + t * direction[2]) * cos >= -EPSILON) {
        add(t);
      }
    }
  }
  for (const phi of nodes.azimuthalNodeAngles) {
    add(planeHit(origin, direction, [-Math.sin(phi), Math.cos(phi), 0]));
  }
  return hits.sort((a, b) => a - b);
}
