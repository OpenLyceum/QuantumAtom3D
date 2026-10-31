/**
 * QuantumNumbersModel.ts
 *
 * The (n, l, m) picker state with its constraints 1 ≤ n ≤ n_max, 0 ≤ l ≤ n − 1
 * and −l ≤ m ≤ l. The ranges of l and m are Properties of their own, so
 * spinners can follow them. Lowering n or l clamps the dependent number
 * before its range shrinks, so a value never sits outside its range.
 */

import { NumberProperty, Property } from "scenerystack/axon";
import { Range } from "scenerystack/dot";
import type { Tandem } from "scenerystack/tandem";

export type QuantumNumbersModelOptions = {
  readonly maxN: number;
  readonly initialN: number;
  readonly initialL: number;
  readonly initialM: number;
  readonly tandem?: Tandem;
};

export class QuantumNumbersModel {
  public readonly nProperty: NumberProperty;
  public readonly lProperty: NumberProperty;
  public readonly mProperty: NumberProperty;

  /** [0, n − 1], following n. */
  public readonly lRangeProperty: Property<Range>;

  /** [−l, l], following l. */
  public readonly mRangeProperty: Property<Range>;

  public constructor(options: QuantumNumbersModelOptions) {
    const { tandem } = options;
    this.nProperty = new NumberProperty(options.initialN, {
      range: new Range(1, options.maxN),
      numberType: "Integer",
      ...(tandem && { tandem: tandem.createTandem("nProperty") }),
    });
    this.lProperty = new NumberProperty(options.initialL, {
      numberType: "Integer",
      ...(tandem && { tandem: tandem.createTandem("lProperty") }),
    });
    this.mProperty = new NumberProperty(options.initialM, {
      numberType: "Integer",
      ...(tandem && { tandem: tandem.createTandem("mProperty") }),
    });
    this.lRangeProperty = new Property(new Range(0, options.initialN - 1));
    this.mRangeProperty = new Property(new Range(-options.initialL, options.initialL));

    this.nProperty.lazyLink((n) => {
      this.lProperty.value = Math.min(this.lProperty.value, n - 1);
      this.lRangeProperty.value = new Range(0, n - 1);
    });
    this.lProperty.lazyLink((l) => {
      this.mProperty.value = Math.max(-l, Math.min(this.mProperty.value, l));
      this.mRangeProperty.value = new Range(-l, l);
    });
  }

  /** Sets all three at once, in an order that respects the constraints. */
  public set(n: number, l: number, m: number): void {
    this.nProperty.value = n;
    this.lProperty.value = l;
    this.mProperty.value = m;
  }

  public reset(): void {
    // n first: its listener clamps l, then l's listener clamps m.
    this.nProperty.reset();
    this.lProperty.reset();
    this.mProperty.reset();
  }

  public dispose(): void {
    this.nProperty.dispose();
    this.lProperty.dispose();
    this.mProperty.dispose();
    this.lRangeProperty.dispose();
    this.mRangeProperty.dispose();
  }
}
