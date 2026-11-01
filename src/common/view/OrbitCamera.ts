/**
 * OrbitCamera.ts
 *
 * The 3D view's orthographic camera, orbiting the nucleus. Physics z is up.
 * The camera sits in direction d = (cos p cos y, cos p sin y, sin p), at yaw y
 * and pitch p, and looks back at the origin, with
 *
 *   forward = −d
 *   right   = (−sin y, cos y, 0)
 *   up      = (−sin p cos y, −sin p sin y, cos p)
 *
 * so right × up = d: a right-handed screen frame with the viewer out of the
 * page. A world point p appears at screen (p·right, p·up), and the view spans
 * ±halfHeight in both directions.
 *
 * Yaw and pitch are view state, not physics; Reset All resets them through the
 * screen view.
 */

import { NumberProperty } from "scenerystack/axon";
import { Range } from "scenerystack/dot";

export type Vec3 = readonly [number, number, number];

export type CameraFrame = {
  readonly right: Vec3;
  readonly up: Vec3;
  readonly forward: Vec3;
};

/** Pitch stays short of the poles, where yaw would stop meaning anything. */
export const MAX_PITCH = (89 * Math.PI) / 180;

/** Opening view: looking down 20° onto the xy-plane, with x toward the viewer's left. */
const INITIAL_YAW = (30 * Math.PI) / 180;
const INITIAL_PITCH = (20 * Math.PI) / 180;

/** The camera frame for yaw y and pitch p (radians). */
export function orbitCameraFrame(yaw: number, pitch: number): CameraFrame {
  const cy = Math.cos(yaw);
  const sy = Math.sin(yaw);
  const cp = Math.cos(pitch);
  const sp = Math.sin(pitch);
  return {
    right: [-sy, cy, 0],
    up: [-sp * cy, -sp * sy, cp],
    forward: [-cp * cy, -cp * sy, -sp],
  };
}

/** Screen coordinates (along right, along up) of a world point. */
export function projectToScreen(frame: CameraFrame, point: Vec3): readonly [number, number] {
  const [x, y, z] = point;
  return [
    x * frame.right[0] + y * frame.right[1] + z * frame.right[2],
    x * frame.up[0] + y * frame.up[1] + z * frame.up[2],
  ];
}

export class OrbitCamera {
  public readonly yawProperty = new NumberProperty(INITIAL_YAW, { range: new Range(-Math.PI, Math.PI) });
  public readonly pitchProperty = new NumberProperty(INITIAL_PITCH, { range: new Range(-MAX_PITCH, MAX_PITCH) });

  /** Turns the camera by the given angles (radians); pitch is clamped short of the poles. */
  public orbit(deltaYaw: number, deltaPitch: number): void {
    const yaw = this.yawProperty.value + deltaYaw;
    this.yawProperty.value = ((((yaw + Math.PI) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) - Math.PI;
    this.pitchProperty.value = Math.max(-MAX_PITCH, Math.min(MAX_PITCH, this.pitchProperty.value + deltaPitch));
  }

  public get frame(): CameraFrame {
    return orbitCameraFrame(this.yawProperty.value, this.pitchProperty.value);
  }

  public reset(): void {
    this.yawProperty.reset();
    this.pitchProperty.reset();
  }

  public dispose(): void {
    this.yawProperty.dispose();
    this.pitchProperty.dispose();
  }
}
