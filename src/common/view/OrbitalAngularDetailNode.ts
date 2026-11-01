/** Polar section of angular density. For real orbitals the selected azimuth matters. */
import {
  DerivedProperty,
  Multilink,
  NumberProperty,
  type TReadOnlyProperty,
  type UnknownMultilink,
} from "scenerystack/axon";
import { Dimension2, Range } from "scenerystack/dot";
import { Shape } from "scenerystack/kite";
import { StringUtils } from "scenerystack/phetcommon";
import { Circle, Line, Node, Path, RichText, VBox } from "scenerystack/scenery";
import { PhetFont } from "scenerystack/scenery-phet";
import { HSlider } from "scenerystack/sun";
import { StringManager } from "../../i18n/StringManager.js";
import type { OrbitalsModel } from "../../orbitals/model/OrbitalsModel.js";
import QuantumAtom3DColors from "../../QuantumAtom3DColors.js";
import { sphericalHarmonicTheta } from "../model/math/sphericalHarmonics.js";
import { orbitalTerms } from "../model/orbital/OrbitalCatalog.js";
import { QUANTUM_ATOM_3D_SLIDER_OPTIONS } from "../QuantumAtom3DControlOptions.js";

const SIZE = 230;
const RADIUS = 100;
const SAMPLES = 360;
export class OrbitalAngularDetailNode extends VBox {
  private readonly link: UnknownMultilink;
  private readonly description: TReadOnlyProperty<string>;
  public readonly phiProperty = new NumberProperty(0, { range: new Range(0, 360) });
  public constructor(model: OrbitalsModel, formulas?: TReadOnlyProperty<boolean>) {
    const strings = StringManager.getInstance().getOrbitalStrings().angularDetail;
    const curve = new Path(null, { stroke: QuantumAtom3DColors.radialCurveColorProperty, lineWidth: 2 });
    const plot = new Node({
      children: [
        new Circle(RADIUS, {
          centerX: SIZE / 2,
          centerY: SIZE / 2,
          stroke: QuantumAtom3DColors.chartGridColorProperty,
          lineDash: [4, 4],
        }),
        new Line(SIZE / 2, 0, SIZE / 2, SIZE, { stroke: QuantumAtom3DColors.chartGridColorProperty }),
        new RichText("z", { font: new PhetFont(12), fill: QuantumAtom3DColors.textColorProperty, left: SIZE / 2 + 5 }),
        curve,
      ],
    });
    super({ spacing: 12, align: "left" });
    this.description = new DerivedProperty([this.phiProperty, strings.descriptionStringProperty], (phi, pattern) =>
      StringUtils.fillIn(pattern, { phi: Math.round(phi) }),
    );
    this.children = [
      new RichText(strings.titleStringProperty, {
        font: new PhetFont(14),
        fill: QuantumAtom3DColors.textColorProperty,
        maxWidth: 275,
      }),
      plot,
      new RichText("ψ = Rₙₗ(r) ∑ₘ cₘ Yₗₘ(θ,φ)", {
        font: new PhetFont(13),
        fill: QuantumAtom3DColors.textColorProperty,
        ...(formulas && { visibleProperty: formulas }),
        maxWidth: 260,
      }),
      new HSlider(this.phiProperty, this.phiProperty.range, {
        ...QUANTUM_ATOM_3D_SLIDER_OPTIONS,
        trackSize: new Dimension2(220, 3),
        keyboardStep: 5,
        shiftKeyboardStep: 1,
        accessibleName: strings.phiStringProperty,
      }),
      new RichText(this.description, {
        font: new PhetFont(12),
        fill: QuantumAtom3DColors.textColorProperty,
        lineWrap: 260,
        tagName: "p",
        accessibleParagraph: this.description,
      }),
    ];
    this.link = Multilink.multilink([model.summaryProperty, this.phiProperty], (summary, phiDegrees) => {
      const terms = orbitalTerms(summary.n, summary.l, summary.m, summary.basis);
      const phi = (phiDegrees * Math.PI) / 180;
      const values = Array.from({ length: SAMPLES + 1 }, (_, i) => {
        const angle = (2 * Math.PI * i) / SAMPLES;
        // The left half-plane has azimuth phi+pi and the same polar angle acos(cos(angle)).
        const azimuth = phi + (Math.sin(angle) < 0 ? Math.PI : 0);
        let re = 0,
          im = 0;
        for (const term of terms) {
          const y = sphericalHarmonicTheta(term.l, term.m, Math.cos(angle));
          const c = Math.cos(term.m * azimuth),
            s = Math.sin(term.m * azimuth);
          re += y * (term.re * c - term.im * s);
          im += y * (term.re * s + term.im * c);
        }
        return re * re + im * im;
      });
      const peak = Math.max(...values);
      const shape = new Shape();
      values.forEach((value, i) => {
        const a = (2 * Math.PI * i) / SAMPLES;
        const radius = peak > 1e-24 ? (RADIUS * value) / peak : 0;
        const x = SIZE / 2 + radius * Math.sin(a),
          y = SIZE / 2 - radius * Math.cos(a);
        if (i === 0) {
          shape.moveTo(x, y);
        } else {
          shape.lineTo(x, y);
        }
      });
      curve.shape = shape;
    });
  }
  public reset(): void {
    this.phiProperty.reset();
  }
  public override dispose(): void {
    this.link.dispose();
    for (const child of this.children.slice()) {
      child.disposeSubtree();
    }
    this.description.dispose();
    this.phiProperty.dispose();
    super.dispose();
  }
}
