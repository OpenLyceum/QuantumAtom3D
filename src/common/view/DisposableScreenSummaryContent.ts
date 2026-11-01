/** Screens own their summaries and derived text, including the framework's combined voicing strings. */
import { ScreenSummaryContent } from "scenerystack/sim";
export class DisposableScreenSummaryContent extends ScreenSummaryContent {
  public override dispose(): void {
    this.setPlayAreaContent(null);
    this.setControlAreaContent(null);
    this.setCurrentDetailsContent(null);
    this.setInteractionHintContent(null);
    for (const child of this.children.slice()) {
      child.disposeSubtree();
    }
    super.dispose();
  }
}
