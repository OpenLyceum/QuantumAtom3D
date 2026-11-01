/** Wavelength positions, without intensities or a line-broadening model. */
import { Multilink, type UnknownMultilink } from "scenerystack/axon";
import { Line, Node, Text } from "scenerystack/scenery";
import { PhetFont } from "scenerystack/scenery-phet";
import { wavelengthNmForEnergy } from "../../common/model/AtomicUnits.js";
import { zeemanLevels, zeemanTransitions } from "../../common/model/angular/ZeemanLevels.js";
import QuantumAtom3DColors from "../../QuantumAtom3DColors.js";
import type { ZeemanModel } from "../model/ZeemanModel.js";
import { polarizationColor } from "./ZeemanDiagramNode.js";
export class ZeemanSpectrumNode extends Node {
  private readonly link: UnknownMultilink;
  public constructor(width: number, model: ZeemanModel) {
    const layer = new Node();
    super({ children: [layer] });
    this.link = Multilink.multilink(
      [
        model.transitionsProperty,
        model.upperNProperty,
        model.lowerNProperty,
        model.nuclearChargeProperty,
        model.capProperty,
        model.modeProperty,
      ],
      (transitions, upper, lower, z, cap, mode) => {
        for (const child of layer.children.slice()) {
          child.disposeSubtree();
        }
        layer.children = [];
        const full = zeemanTransitions(zeemanLevels(upper, z, cap, mode), zeemanLevels(lower, z, cap, mode), mode);
        const limits = full.map((entry) => wavelengthNmForEnergy(entry.photonEnergy));
        if (limits.length === 0) {
          return;
        }
        const min = Math.min(...limits);
        const max = Math.max(...limits);
        const padding = (max - min) * 0.1;
        const low = min - padding;
        const high = max + padding;
        layer.addChild(new Line(0, 70, width, 70, { stroke: QuantumAtom3DColors.textColorProperty }));
        const seen = new Set<string>();
        for (const transition of transitions) {
          const wavelength = wavelengthNmForEnergy(transition.photonEnergy);
          const x = (width * (wavelength - low)) / (high - low);
          const row = transition.polarization === "pi" ? 0 : transition.polarization === "sigmaPlus" ? 1 : 2;
          const key = `${row},${wavelength.toFixed(9)}`;
          if (seen.has(key)) {
            continue;
          }
          seen.add(key);
          layer.addChild(
            new Line(x, 8 + row * 20, x, 23 + row * 20, {
              stroke: polarizationColor(transition.polarization),
              lineWidth: 2,
            }),
          );
        }
        for (const [x, value] of [
          [0, low],
          [width / 2, (low + high) / 2],
          [width, high],
        ]) {
          layer.addChild(
            new Text(`${value?.toFixed(6)}`, {
              font: new PhetFont(10),
              fill: QuantumAtom3DColors.textColorProperty,
              centerX: x ?? 0,
              top: 76,
            }),
          );
        }
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
