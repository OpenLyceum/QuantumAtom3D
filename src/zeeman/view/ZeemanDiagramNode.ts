/** Magnetic sublevels grouped by l,j. Each group is centred at its own zero-field energy. */
import { Multilink, type UnknownMultilink } from "scenerystack/axon";
import { Line, Node, Text } from "scenerystack/scenery";
import { PhetFont } from "scenerystack/scenery-phet";
import { hartreeToEv } from "../../common/model/AtomicUnits.js";
import type { Polarization, ZeemanLevel } from "../../common/model/angular/ZeemanLevels.js";
import QuantumAtom3DColors from "../../QuantumAtom3DColors.js";
import type { ZeemanModel } from "../model/ZeemanModel.js";

export const polarizationColor = (polarization: Polarization) =>
  polarization === "pi"
    ? QuantumAtom3DColors.radialCurveColorProperty
    : polarization === "sigmaPlus"
      ? QuantumAtom3DColors.meanRadiusColorProperty
      : QuantumAtom3DColors.nodeMarkerColorProperty;

function projectionLabel(level: ZeemanLevel, zeroField: boolean): string {
  return zeroField && level.j > 0 ? `${-level.j}…${level.j}` : `${level.m}`;
}

function highlightedLevel(
  level: ZeemanLevel,
  chosen: ZeemanLevel | undefined,
  index: number,
  selected: number,
  isUpper: boolean,
  zeroField: boolean,
): boolean {
  return (
    isUpper &&
    (index === selected || (zeroField && chosen !== undefined && chosen.l === level.l && chosen.j === level.j))
  );
}

export class ZeemanDiagramNode extends Node {
  private readonly link: UnknownMultilink;
  public constructor(model: ZeemanModel) {
    const layer = new Node();
    super({ children: [layer] });
    this.link = Multilink.multilink(
      [
        model.upperLevelsProperty,
        model.lowerLevelsProperty,
        model.transitionsProperty,
        model.selectedIndexProperty,
        model.capProperty,
        model.modeProperty,
      ],
      (upper, lower, transitions, selected, cap, mode) => {
        for (const child of layer.children.slice()) {
          child.disposeSubtree();
        }
        layer.children = [];
        const maxMoment = Math.max(
          1,
          ...upper.map((level) => Math.abs(level.g * level.m)),
          ...lower.map((level) => Math.abs(level.g * level.m)),
        );
        const scale = 70 / ((cap * maxMoment) / 2);
        const position = (levels: readonly ZeemanLevel[], level: ZeemanLevel, centreY: number) => {
          const groups = [...new Set(levels.map((entry) => `${entry.l},${entry.j}`))];
          const column = groups.indexOf(`${level.l},${level.j}`);
          return { x: 35 + column * 112, y: centreY - (level.energy - level.zeroEnergy) * scale };
        };
        const drawBand = (levels: readonly ZeemanLevel[], centreY: number, isUpper: boolean) => {
          const keys = new Set<string>();
          levels.forEach((level, index) => {
            const p = position(levels, level, centreY);
            const key = `${level.l},${level.j}`;
            const first = !keys.has(key);
            if (first) {
              keys.add(key);
              layer.addChild(
                new Text(mode === "normal" ? `l=${level.l}` : `l=${level.l}, j=${level.j}`, {
                  font: new PhetFont(11),
                  fill: QuantumAtom3DColors.textColorProperty,
                  centerX: p.x,
                  top: centreY - 105,
                }),
              );
              layer.addChild(
                new Text(`${hartreeToEv(level.zeroEnergy).toFixed(6)} eV`, {
                  font: new PhetFont(9),
                  fill: QuantumAtom3DColors.textColorProperty,
                  centerX: p.x,
                  top: centreY - 88,
                }),
              );
            }
            const zeroField = model.fieldProperty.value === 0;
            if (zeroField && !first) {
              return;
            }
            const chosen = upper[selected];
            const highlighted = highlightedLevel(level, chosen, index, selected, isUpper, zeroField);
            const color = highlighted
              ? QuantumAtom3DColors.radialCurveColorProperty
              : QuantumAtom3DColors.textColorProperty;
            layer.addChild(
              new Line(p.x - 18, p.y, p.x + 18, p.y, {
                stroke: color,
                lineWidth: highlighted ? 3 : 1,
              }),
            );
            layer.addChild(
              new Text(projectionLabel(level, zeroField), {
                font: new PhetFont(9),
                fill: color,
                left: p.x + 20,
                centerY: p.y,
              }),
            );
          });
        };
        const selectedLevel = upper[selected];
        if (selectedLevel) {
          for (const transition of transitions.filter((entry) => entry.upper === selectedLevel)) {
            const a = position(upper, transition.upper, 110);
            const b = position(lower, transition.lower, 340);
            layer.addChild(
              new Line(a.x, a.y, b.x, b.y, { stroke: polarizationColor(transition.polarization), lineWidth: 1.5 }),
            );
          }
        }
        drawBand(upper, 110, true);
        drawBand(lower, 340, false);
      },
    );
  }
  public override dispose(): void {
    this.link.dispose();
    for (const child of this.children.slice()) {
      child.disposeSubtree();
    }
    super.dispose();
  }
}
