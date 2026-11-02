/** Screens own their summaries and derived text, including the framework's combined voicing strings. */
import type { TReadOnlyProperty } from "scenerystack/axon";
import { ScreenSummaryContent } from "scenerystack/sim";

/** The fixed summary sentences in each screen's `a11y.<screenKey>.screenSummary` strings. */
type ScreenSummaryStrings = {
  readonly playAreaStringProperty: TReadOnlyProperty<string>;
  readonly controlAreaStringProperty: TReadOnlyProperty<string>;
  readonly interactionHintStringProperty: TReadOnlyProperty<string>;
};

export class DisposableScreenSummaryContent extends ScreenSummaryContent {
  private readonly currentDetailsProperty: TReadOnlyProperty<string>;

  /** Takes ownership of `currentDetailsProperty`: it is disposed with the summary. */
  public constructor(summary: ScreenSummaryStrings, currentDetailsProperty: TReadOnlyProperty<string>) {
    super({
      playAreaContent: summary.playAreaStringProperty,
      controlAreaContent: summary.controlAreaStringProperty,
      currentDetailsContent: currentDetailsProperty,
      interactionHintContent: summary.interactionHintStringProperty,
    });
    this.currentDetailsProperty = currentDetailsProperty;
  }

  public override dispose(): void {
    this.setPlayAreaContent(null);
    this.setControlAreaContent(null);
    this.setCurrentDetailsContent(null);
    this.setInteractionHintContent(null);
    for (const child of this.children.slice()) {
      child.disposeSubtree();
    }
    super.dispose();
    this.currentDetailsProperty.dispose();
  }
}
