export const RENDER_MODES = ["volume", "dots", "isosurface"] as const;
export type RenderMode = (typeof RENDER_MODES)[number];
export const DOT_COUNT = 6000;
export const MAX_DOTS = 8192;
