import { DerivedProperty, type TReadOnlyProperty } from "scenerystack/axon";
import type { Range } from "scenerystack/dot";
import { HBox, Node, RichText, VBox } from "scenerystack/scenery";
import { PhetFont, ResetAllButton } from "scenerystack/scenery-phet";
import type { ScreenViewOptions } from "scenerystack/sim";
import { AquaRadioButtonGroup, HSlider, NumberSpinner } from "scenerystack/sun";
import {
  cartesianExpansion,
  cartesianStates,
  oscillatorDegeneracy,
  oscillatorEnergy,
  sphericalStates,
} from "../../common/model/oscillator/OscillatorStates.js";
import {
  FLAT_RECTANGULAR_BUTTON_OPTIONS,
  FLAT_RESET_ALL_BUTTON_OPTIONS,
} from "../../common/QuantumAtom3DButtonOptions.js";
import { QUANTUM_ATOM_3D_SLIDER_OPTIONS } from "../../common/QuantumAtom3DControlOptions.js";
import { ResponsiveScreenView } from "../../common/view/ResponsiveScreenView.js";
import { StringManager } from "../../i18n/StringManager.js";
import { OrbitalColorControl } from "../../orbitals/view/OrbitalColorControl.js";
import type { QuantumAtom3DPreferencesModel } from "../../preferences/QuantumAtom3DPreferencesModel.js";
import QuantumAtom3DColors from "../../QuantumAtom3DColors.js";
import type { PhaseColormap } from "../../QuantumAtom3DConstants.js";
import type { OscillatorModel } from "../model/OscillatorModel.js";
import { BasisOverlapNode } from "./BasisOverlapNode.js";
import { OscillatorScreenSummaryContent } from "./OscillatorScreenSummaryContent.js";
import { OscillatorViewportNode } from "./OscillatorViewportNode.js";
export type OscillatorScreenViewOptions = ScreenViewOptions & {
  preferences?: QuantumAtom3DPreferencesModel;
  phaseColormapProperty: TReadOnlyProperty<PhaseColormap>;
};
export class OscillatorScreenView extends ResponsiveScreenView {
  public readonly viewport: OscillatorViewportNode;
  public constructor(model: OscillatorModel, options: OscillatorScreenViewOptions) {
    super({ ...options, screenSummaryContent: new OscillatorScreenSummaryContent(model) });
    const strings = StringManager.getInstance().getOscillatorStrings();
    const orbital = StringManager.getInstance().getOrbitalStrings();
    const text = (value: string | TReadOnlyProperty<string>, maxWidth = 500) =>
      new RichText(value, { font: new PhetFont(13), fill: QuantumAtom3DColors.textColorProperty, maxWidth });
    const spinner = (
      property: typeof model.shellProperty,
      range: TReadOnlyProperty<Range>,
      name: TReadOnlyProperty<string>,
      offset = 0,
    ) =>
      new NumberSpinner(property, range, {
        arrowsPosition: "leftRight",
        arrowButtonOptions: FLAT_RECTANGULAR_BUTTON_OPTIONS,
        numberDisplayOptions: {
          textOptions: { font: new PhetFont(14) },
          numberFormatter: (value) => `${value + offset}`,
          minBackgroundWidth: 35,
        },
        accessibleName: name,
      });
    this.viewport = new OscillatorViewportNode(
      320,
      model,
      options.phaseColormapProperty,
      options.preferences?.qualityProperty,
    );
    const viewport = this.viewport;
    viewport.left = this.layoutBounds.minX + 25;
    viewport.top = this.layoutBounds.minY + 50;
    const title = text(strings.unitsStringProperty, 340);
    title.left = viewport.left;
    title.bottom = viewport.top - 10;
    const cameraRows = (
      [
        [orbital.volume.yawStringProperty, viewport.camera.yawProperty],
        [orbital.volume.pitchStringProperty, viewport.camera.pitchProperty],
        [orbital.zoomStringProperty, model.zoomProperty],
      ] as const
    ).map(
      ([name, property]) =>
        new HBox({
          spacing: 12,
          children: [
            text(name, 100),
            new HSlider(property, property.range, {
              ...QUANTUM_ATOM_3D_SLIDER_OPTIONS,
              accessibleName: name,
              keyboardStep: property === model.zoomProperty ? 1 : Math.PI / 36,
              shiftKeyboardStep: property === model.zoomProperty ? 1 : Math.PI / 180,
              pageKeyboardStep: property === model.zoomProperty ? 1 : Math.PI / 6,
              ...(property === model.zoomProperty && { constrainValue: (value: number) => Math.round(value) }),
            }),
          ],
        }),
    );
    const modes = new AquaRadioButtonGroup(
      model.modeProperty,
      (["volume", "isosurface"] as const).map((value) => ({
        value,
        createNode: () => text(orbital.volume[`${value}StringProperty`]),
        options: { accessibleName: orbital.volume[`${value}StringProperty`] },
      })),
      { orientation: "horizontal", spacing: 15, radioButtonOptions: { radius: 6 } },
    );
    const below = new VBox({
      align: "left",
      spacing: 10,
      children: [
        modes,
        new OrbitalColorControl({ sliceColoringProperty: model.coloringProperty }, options.phaseColormapProperty),
        ...cameraRows,
      ],
      left: viewport.left,
      top: viewport.bottom + 10,
    });
    const right = this.layoutBounds.minX + 435;
    const bases = new AquaRadioButtonGroup(
      model.basisProperty,
      (["cartesian", "spherical"] as const).map((value) => ({
        value,
        createNode: () => text(strings[`${value}StringProperty`]),
        options: { accessibleName: strings[`${value}StringProperty`] },
      })),
      { orientation: "horizontal", spacing: 20, radioButtonOptions: { radius: 7 } },
    );
    const cartLabel = new DerivedProperty(
      [model.shellProperty, model.cartesianIndexProperty],
      (N, index) => `(${(cartesianStates(N)[index] ?? cartesianStates(N)[0])?.join(",")})`,
    );
    const sphereLabel = new DerivedProperty([model.shellProperty, model.sphericalIndexProperty], (N, index) => {
      const s = sphericalStates(N)[index] ?? sphericalStates(N)[0];
      return s ? `(${s.nr},${s.l},${s.m})` : "";
    });
    const controls = new VBox({
      align: "left",
      spacing: 10,
      children: [
        new HBox({
          spacing: 15,
          children: [
            text(strings.shellStringProperty),
            spinner(model.shellProperty, model.shellProperty.rangeProperty, strings.shellStringProperty),
          ],
        }),
        bases,
        new HBox({
          spacing: 12,
          children: [
            text(strings.cartStateStringProperty),
            spinner(model.cartesianIndexProperty, model.indexRangeProperty, strings.cartStateStringProperty, 1),
            text(cartLabel),
          ],
        }),
        new HBox({
          spacing: 12,
          children: [
            text(strings.sphereStateStringProperty),
            spinner(model.sphericalIndexProperty, model.indexRangeProperty, strings.sphereStateStringProperty, 1),
            text(sphereLabel),
          ],
        }),
      ],
      left: right,
      top: this.layoutBounds.minY + 20,
    });
    const energy = text(
      new DerivedProperty(
        [model.shellProperty],
        (N) =>
          `E = ${oscillatorEnergy(N)} ℏω; d<sub>N</sub> = ${oscillatorDegeneracy(N)}; l = ${[...new Set(sphericalStates(N).map((s) => s.l))].join(", ")}`,
      ),
    );
    energy.left = right;
    energy.top = this.layoutBounds.minY + 165;
    const matrixTitle = text(strings.overlapStringProperty);
    matrixTitle.left = right;
    matrixTitle.top = this.layoutBounds.minY + 195;
    const coefficient = new DerivedProperty(
      [model.shellProperty, model.cartesianIndexProperty, model.sphericalIndexProperty],
      (N, row, column) => {
        const c = cartesianStates(N)[row];
        const s = sphericalStates(N)[column];
        const t =
          c && s
            ? cartesianExpansion(c).find((entry) => entry.n === s.nr && entry.l === s.l && entry.m === s.m)
            : undefined;
        return `⟨${c?.join(",") ?? ""}|${s ? `${s.nr},${s.l},${s.m}` : ""}⟩ = ${(t?.re ?? 0).toFixed(4)} ${-(t?.im ?? 0) < 0 ? "−" : "+"} ${Math.abs(t?.im ?? 0).toFixed(4)}i`;
      },
    );
    const coefficientLabel = text(coefficient);
    coefficientLabel.left = right;
    coefficientLabel.top = this.layoutBounds.minY + 220;
    const overlap = new BasisOverlapNode(model);
    overlap.left = right;
    overlap.top = this.layoutBounds.minY + 250;
    const ladder = text(
      new DerivedProperty(
        [model.shellProperty, strings.comparisonStringProperty],
        (N, caption) =>
          `${caption}<br>${Array.from({ length: 5 }, (_, shell) => `${shell === N ? "▶ " : ""}N=${shell}: ${oscillatorDegeneracy(shell)} / n=${shell + 1}: ${(shell + 1) ** 2}`).join("<br>")}`,
      ),
      500,
    );
    ladder.left = right + 390;
    ladder.top = this.layoutBounds.minY + 275;
    ladder.maxWidth = 140;
    ladder.lineWrap = 140;
    const note = text(strings.noteStringProperty, 920);
    note.left = viewport.left;
    note.bottom = this.layoutBounds.maxY - 15;
    const reset = new ResetAllButton({
      ...FLAT_RESET_ALL_BUTTON_OPTIONS,
      listener: () => {
        model.reset();
        viewport.reset();
      },
      right: this.layoutBounds.maxX - 18,
      bottom: this.layoutBounds.maxY - 18,
    });
    const content = new Node({
      children: [viewport, title, below, controls, energy, matrixTitle, coefficientLabel, overlap, ladder, note, reset],
    });
    this.addChild(content);
    this.pdomPlayAreaNode.pdomOrder = [viewport];
    this.pdomControlAreaNode.pdomOrder = [controls, below, reset];
    this.setResponsiveContent(content, [
      [viewport, title],
      [below],
      [controls, energy],
      [matrixTitle, coefficientLabel, overlap],
      [ladder],
      [note],
      [reset],
    ]);
  }
  public override step(_dt: number): void {
    this.viewport.step();
  }
}
