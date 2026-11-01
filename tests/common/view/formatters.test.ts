import { expect, it } from "vitest";
import { formatLength } from "../../../src/common/view/formatters.js";

it("converts first and second length moments with the corresponding power of the Bohr radius", () => {
  expect(formatLength(1, "pm")).toBe("52.92");
  expect(formatLength(3, "pm", 2)).toBe("8400.86");
  expect(formatLength(-2, "a0")).toBe("−2.00");
});
