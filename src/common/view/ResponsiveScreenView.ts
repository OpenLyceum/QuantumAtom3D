/** Desktop composition plus a readable, scrollable portrait column using the same live controls.
 * Touch drags on controls/3D keep their own listeners; swipes on other content scroll the column.
 * Focusing an offscreen PDOM control brings it into view before keyboard interaction.
 */
import { BooleanProperty, MappedProperty, NumberProperty } from "scenerystack/axon";
import { Bounds2, Dimension2, Matrix3, Range } from "scenerystack/dot";
import { Shape } from "scenerystack/kite";
import { DragListener, Node, Rectangle, type SceneryEvent, VBox } from "scenerystack/scenery";
import { ScreenView, type ScreenViewOptions } from "scenerystack/sim";
import { VSlider } from "scenerystack/sun";
import { StringManager } from "../../i18n/StringManager.js";
import QuantumAtom3DColors from "../../QuantumAtom3DColors.js";
import { QUANTUM_ATOM_3D_SLIDER_OPTIONS } from "../QuantumAtom3DControlOptions.js";

const PORTRAIT_WIDTH = 400;
const MARGIN = 16;
const CONTENT_WIDTH = 350;
const SECTION_GAP = 24;
const SCROLL_MARGIN = 12;
export class ResponsiveScreenView extends ScreenView {
  public readonly portraitProperty = new BooleanProperty(false);
  public readonly scrollProperty = new NumberProperty(0, { range: new Range(0, 1) });
  private readonly invertedScroll = new MappedProperty(this.scrollProperty, {
    bidirectional: true,
    map: (value: number) => 1 - value,
    inverseMap: (value: number) => 1 - value,
  });
  private readonly column = new VBox({ align: "left", spacing: SECTION_GAP });
  private readonly clip = new Node();
  private readonly background = new Rectangle(0, 0, PORTRAIT_WIDTH, 1, {
    fill: QuantumAtom3DColors.backgroundColorProperty,
  });
  private readonly scrollBar: VSlider;
  private content: Node | null = null;
  private tools: Node | null = null;
  private sections: Node[][] = [];
  private nodes: Node[] = [];
  private matrices: Matrix3[] = [];
  private playOrder: (Node | null)[] | null = null;
  private controlOrder: (Node | null)[] | null = null;
  private viewportHeight = 1;
  private maximumScroll = 0;
  private changing = false;
  private readonly swipe: DragListener;
  public constructor(options?: ScreenViewOptions) {
    super(options);
    const strings = StringManager.getInstance().getOrbitalStrings().mobile;
    this.clip.children = [this.background, this.column];
    this.scrollBar = new VSlider(this.invertedScroll, new Range(0, 1), {
      ...QUANTUM_ATOM_3D_SLIDER_OPTIONS,
      trackSize: new Dimension2(3, 200),
      thumbSize: new Dimension2(24, 40),
      keyboardStep: 0.06,
      shiftKeyboardStep: 0.015,
      accessibleName: strings.scrollStringProperty,
      accessibleHelpText: strings.helpStringProperty,
    });
    this.addChild(this.clip);
    this.addChild(this.scrollBar);
    this.clip.visible = this.scrollBar.visible = false;
    this.scrollProperty.link(() => this.positionColumn());
    this.column.boundsProperty.lazyLink(() => this.updateScrollRange());
    this.clip.addInputListener({
      wheel: (event) => {
        if (this.portraitProperty.value && event.domEvent instanceof WheelEvent) {
          event.domEvent.preventDefault();
          this.scrollBy(event.domEvent.deltaY * (event.domEvent.deltaMode === 1 ? 16 : 1));
        }
      },
    });
    this.column.addInputListener({ focusin: (event) => this.reveal(event) });
    let previousY = 0;
    this.swipe = new DragListener({
      canStartPress: (event) => this.portraitProperty.value && event !== null && event.pointer.type === "touch",
      start: (event) => {
        previousY = this.globalToLocalPoint(event.pointer.point).y;
      },
      drag: (event) => {
        const y = this.globalToLocalPoint(event.pointer.point).y;
        this.scrollBy(previousY - y);
        previousY = y;
      },
    });
    this.clip.addInputListener(this.swipe);
  }
  /** Called after each screen has defined its desktop content and PDOM order. */
  protected setResponsiveContent(content: Node, sections: Node[][]): void {
    this.content = content;
    this.sections = sections;
    this.nodes = content.children.slice();
    this.playOrder = this.pdomPlayAreaNode.pdomOrder;
    this.controlOrder = this.pdomControlAreaNode.pdomOrder;
  }
  public setPortraitTools(tools: Node): void {
    this.tools = new Node({ children: [tools] });
    if (this.portraitProperty.value) {
      this.column.insertChild(0, this.tools);
    }
  }
  private scrollBy(delta: number): void {
    if (this.maximumScroll > 0) {
      this.scrollProperty.value = Math.max(0, Math.min(1, this.scrollProperty.value + delta / this.maximumScroll));
    }
  }
  private reveal(event: SceneryEvent<Event>): void {
    if (!this.portraitProperty.value || event.target === this.scrollBar) {
      return;
    }
    const bounds = this.globalToLocalBounds(event.target.globalBounds);
    if (!bounds.isFinite()) {
      return;
    }
    if (bounds.top < SCROLL_MARGIN) {
      this.scrollBy(bounds.top - SCROLL_MARGIN);
    } else if (bounds.bottom > this.viewportHeight - SCROLL_MARGIN) {
      this.scrollBy(bounds.bottom - this.viewportHeight + SCROLL_MARGIN);
    }
  }
  private positionColumn(): void {
    if (this.portraitProperty.value) {
      this.column.left = MARGIN;
      this.column.top = MARGIN - this.maximumScroll * this.scrollProperty.value;
    }
  }
  private updateScrollRange(): void {
    if (this.changing || !this.portraitProperty.value) {
      return;
    }
    this.maximumScroll = Math.max(0, this.column.height + 2 * MARGIN - this.viewportHeight);
    this.scrollBar.visible = this.maximumScroll > 0;
    this.positionColumn();
  }
  public override layout(viewBounds: Bounds2): void {
    const portrait = this.content !== null && viewBounds.width / viewBounds.height < 0.9;
    if (portrait !== this.portraitProperty.value && this.content) {
      this.changing = true;
      this.interruptSubtreeInput();
      if (portrait) {
        this.matrices = this.nodes.map((node) => node.matrix.copy());
        this.content.children = [];
        const sections = this.sections.map((nodes) => {
          const section = new Node({ children: nodes });
          section.localBoundsProperty.link((bounds) => {
            if (bounds.width > 0) {
              section.setScaleMagnitude(Math.min(1, CONTENT_WIDTH / bounds.width));
            }
          });
          return section;
        });
        this.column.children = this.tools ? [this.tools, ...sections] : sections;
        this.pdomPlayAreaNode.pdomOrder = [this.column];
        this.pdomControlAreaNode.pdomOrder = [this.scrollBar];
      } else {
        for (const section of this.column.children.slice()) {
          if (section === this.tools) {
            continue;
          }
          section.children = [];
          section.dispose();
        }
        this.column.children = [];
        this.content.children = this.nodes;
        this.nodes.forEach((node, index) => {
          const matrix = this.matrices[index];
          if (matrix) {
            node.matrix = matrix;
          }
        });
        this.pdomPlayAreaNode.pdomOrder = this.playOrder;
        this.pdomControlAreaNode.pdomOrder = this.controlOrder;
      }
      this.portraitProperty.value = portrait;
      this.scrollProperty.value = 0;
      this.changing = false;
    }
    this.clip.visible = portrait;
    if (!portrait) {
      this.scrollBar.visible = false;
      super.layout(viewBounds);
      return;
    }
    const scale = viewBounds.width / PORTRAIT_WIDTH;
    this.matrix = Matrix3.translation(viewBounds.left, viewBounds.top).timesMatrix(Matrix3.scaling(scale));
    this.viewportHeight = viewBounds.height / scale;
    this.visibleBoundsProperty.value = new Bounds2(0, 0, PORTRAIT_WIDTH, this.viewportHeight);
    this.background.setRect(0, 0, PORTRAIT_WIDTH, this.viewportHeight);
    this.clip.clipArea = Shape.rect(0, 0, PORTRAIT_WIDTH, this.viewportHeight);
    this.scrollBar.preferredHeight = Math.max(50, this.viewportHeight - 60);
    this.scrollBar.centerX = PORTRAIT_WIDTH - 16;
    this.scrollBar.centerY = this.viewportHeight / 2;
    this.updateScrollRange();
  }
}
