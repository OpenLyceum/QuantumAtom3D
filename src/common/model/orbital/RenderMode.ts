import { RENDER_MODE_SETTINGS } from "../../../QuantumAtom3DConstants.js";
export const RENDER_MODES = ["volume", "dots", "isosurface"] as const;
export type RenderMode = (typeof RENDER_MODES)[number];
export const DOT_COUNT: number = RENDER_MODE_SETTINGS.DOT_COUNT;
export const MAX_DOTS: number = RENDER_MODE_SETTINGS.MAX_DOTS;
