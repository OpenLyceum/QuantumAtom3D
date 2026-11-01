/**
 * SliceNodalCurves.ts
 *
 * Where the nodal surfaces of an orbital cut a slice plane, as polylines in the
 * slice's own (u, v) coordinates (see SliceSampler for the axes). The cuts are:
 *
 *   sphere r = R          circle u² + v² = R² − d², if R > |d|
 *   cone θ = θ₀           in a plane containing z: v = cot θ₀ · √(u² + d²)
 *                         in the xy-plane (z = d): circle of radius d·tan θ₀,
 *                         on the side of the nucleus where cos θ₀ has d's sign
 *   plane φ = φ₀          in the xy-plane: the line through the origin at φ₀
 *                         in a plane x = d or y = d: a vertical line
 *
 * A nodal surface that coincides with the slice (the xy-plane node of p_z on
 * an xy slice at d = 0) leaves no curve: the whole slice is dark.
 */

import type { NodalSurfaceSet } from "./NodalSurfaces.js";
import type { SlicePlane } from "./SliceSampler.js";

/** Points per sampled curve (circles and hyperbolas). */
const CURVE_SAMPLES = 96;

/** Below this, an angle or offset counts as exactly zero. */
const EPSILON = 1e-9;

export type SlicePoint = readonly [number, number];
export type SliceCurve = readonly SlicePoint[];

function circle(radius: number): SliceCurve {
  const points: SlicePoint[] = [];
  for (let i = 0; i <= CURVE_SAMPLES; i++) {
    const angle = (2 * Math.PI * i) / CURVE_SAMPLES;
    points.push([radius * Math.cos(angle), radius * Math.sin(angle)]);
  }
  return points;
}

/** The cut of cone θ₀ by a plane containing the z-axis direction, at normal offset d. */
function coneInVerticalPlane(theta: number, offset: number, extent: number): SliceCurve {
  const cotangent = Math.cos(theta) / Math.sin(theta);
  const points: SlicePoint[] = [];
  for (let i = 0; i <= CURVE_SAMPLES; i++) {
    const u = -extent + (2 * extent * i) / CURVE_SAMPLES;
    points.push([u, cotangent * Math.sqrt(u * u + offset * offset)]);
  }
  return points;
}

/** Every nodal curve of `nodes` on the slice `plane` at normal offset `offset`, within ±extent. */
export function sliceNodalCurves(
  nodes: NodalSurfaceSet,
  plane: SlicePlane,
  offset: number,
  extent: number,
): SliceCurve[] {
  const curves: SliceCurve[] = [];
  const reach = extent * Math.SQRT2;

  for (const radius of nodes.radialNodeRadii) {
    if (radius > Math.abs(offset)) {
      curves.push(circle(Math.sqrt(radius * radius - offset * offset)));
    }
  }

  for (const theta of nodes.polarNodeAngles) {
    const cosTheta = Math.cos(theta);
    if (plane !== "xy") {
      curves.push(coneInVerticalPlane(theta, offset, extent));
    } else if (Math.abs(cosTheta) > EPSILON && offset * cosTheta > 0) {
      curves.push(circle(offset * Math.tan(theta)));
    }
  }

  for (const phi of nodes.azimuthalNodeAngles) {
    if (plane === "xy") {
      const dx = reach * Math.cos(phi);
      const dy = reach * Math.sin(phi);
      curves.push([
        [-dx, -dy],
        [dx, dy],
      ]);
    } else {
      // y = x tan φ₀. On y = d (xz-plane) this is x = d cot φ₀; on x = d (yz-plane), y = d tan φ₀.
      const along = plane === "xz" ? Math.cos(phi) : Math.sin(phi);
      const across = plane === "xz" ? Math.sin(phi) : Math.cos(phi);
      if (Math.abs(across) > EPSILON) {
        const u = (offset * along) / across;
        curves.push([
          [u, -reach],
          [u, reach],
        ]);
      }
    }
  }
  return curves;
}
