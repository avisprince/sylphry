import { describe, it, expect } from "vitest";
import type { ParsedRules } from "../../types/core.types";
import { parseRules } from "../../in-progress/parseRules";

describe("parseRules", () => {
  it("handles simple static properties", () => {
    const input = { color: "blue", padding: 10 };
    const result = parseRules(input);
    expect(result).toEqual<ParsedRules>({
      statics: [
        ["color", "blue"],
        ["padding", 10],
      ],
      pseudos: [],
      variants: {},
    });
  });

  it("handles a single breakpoint nesting", () => {
    const input = {
      sm: {
        margin: 8,
        ":hover": { color: "red" },
      },
    };
    const result = parseRules(input);
    expect(result.variants.sm).toContainEqual({
      prop: "margin",
      raw: 8,
      pseudo: undefined,
    });
    expect(result.variants.sm).toContainEqual({
      prop: "color",
      raw: "red",
      pseudo: "hover",
    });
  });

  it("handles inline qualifiers on keys", () => {
    const input = {
      "md:backgroundColor": "black",
      "lg:opacity:focus": 0.5,
    };
    const result = parseRules(input);
    expect(result.variants.md).toContainEqual({
      prop: "backgroundColor",
      raw: "black",
      pseudo: undefined,
    });
    expect(result.variants.lg).toContainEqual({
      prop: "opacity",
      raw: 0.5,
      pseudo: "focus",
    });
  });

  it("accumulates multiple breakpoints and pseudos in one key", () => {
    const input = {
      "sm:md:hover:color": "green",
    };
    const result = parseRules(input);
    expect(result.variants.sm).toContainEqual({
      prop: "color",
      raw: "green",
      pseudo: "hover",
    });
    expect(result.variants.md).toContainEqual({
      prop: "color",
      raw: "green",
      pseudo: "hover",
    });
  });

  it("recurses deeply through mixed nesting", () => {
    const input = {
      sm: {
        ":active": {
          lg: {
            focus: { padding: 4 },
          },
        },
      },
    };
    const result = parseRules(input);
    expect(result.variants.sm).toContainEqual({
      prop: "padding",
      raw: 4,
      pseudo: "active:focus",
    });
    expect(result.variants.lg).toContainEqual({
      prop: "padding",
      raw: 4,
      pseudo: "active:focus",
    });
  });

  it("handles multiple pseudos on a primitive leaf without breakpoints", () => {
    const input = {
      ":hover:active:color": "blue",
    };
    const result = parseRules(input);
    // Two entries: one for hover, one for active
    expect(result.pseudos).toContainEqual(["hover", "color", "blue"]);
    expect(result.pseudos).toContainEqual(["active", "color", "blue"]);
  });

  it("throws error for primitive leaf with zero props", () => {
    expect(() => parseRules({ "sm:hover": 10 })).toThrow(
      /expected exactly one CSS property/
    );
  });

  it("throws error for primitive leaf with multiple props", () => {
    expect(() => parseRules({ "md:color:padding": 5 })).toThrow(
      /expected exactly one CSS property/
    );
  });

  it("throws error for grouping object containing props", () => {
    expect(() => parseRules({ "md:color": { color: "red" } })).toThrow(
      /cannot be combined with object value containing props/
    );
  });

  it("handles deep nested breakpoints and pseudos stacking context", () => {
    const input = {
      sm: {
        lg: {
          ":focus": {
            margin: 3,
          },
        },
      },
    };
    const result = parseRules(input);
    expect(result.variants.sm).toContainEqual({
      prop: "margin",
      raw: 3,
      pseudo: "focus",
    });
    expect(result.variants.lg).toContainEqual({
      prop: "margin",
      raw: 3,
      pseudo: "focus",
    });
  });

  it("handles composite breakpoints and pseudos stacking context", () => {
    const input = {
      "sm:lg": {
        ":focus": {
          margin: 3,
        },
      },
    };
    const result = parseRules(input);
    expect(result.variants.sm).toContainEqual({
      prop: "margin",
      raw: 3,
      pseudo: "focus",
    });
    expect(result.variants.lg).toContainEqual({
      prop: "margin",
      raw: 3,
      pseudo: "focus",
    });
  });

  it("returns empty for non-object rules (null input)", () => {
    const result = parseRules(null as any);
    expect(result).toEqual<ParsedRules>({
      statics: [],
      pseudos: [],
      variants: {},
    });
  });

  it("skips array values and continues parsing siblings", () => {
    const input = { arr: [1, 2, 3], border: "1px solid" };
    const result = parseRules(input as any);
    // array is skipped entirely
    expect(Object.keys(result.variants)).toHaveLength(0);
    expect(result.pseudos).toHaveLength(0);
    // but border still shows up as static
    expect(result.statics).toContainEqual(["border", "1px solid"]);
  });

  it("skips null or undefined raw values", () => {
    const input = { color: undefined, margin: null, padding: 5 };
    const result = parseRules(input as any);
    expect(result.statics).toContainEqual(["padding", 5]);
    expect(result.statics).not.toContainEqual(["color", undefined]);
    expect(result.statics).not.toContainEqual(["margin", null]);
  });

  it("handles multiple breakpoints without pseudos", () => {
    const input = { "sm:md:color": "purple" };
    const result = parseRules(input);
    expect(result.variants.sm).toContainEqual({
      prop: "color",
      raw: "purple",
      pseudo: undefined,
    });
    expect(result.variants.md).toContainEqual({
      prop: "color",
      raw: "purple",
      pseudo: undefined,
    });
  });

  it("throws error for primitive leaf with zero props (e.g. only qualifiers)", () => {
    expect(() => parseRules({ "sm:hover": 10 } as any)).toThrow(
      /expected exactly one CSS property/
    );
  });

  it("handles deep grouping recursion for unknown keys", () => {
    const input = {
      wrapper: {
        inner: {
          color: "orange",
        },
      },
    };
    const result = parseRules(input as any);
    // wrapper & inner are both ignored as CSS props & qualifiers
    expect(result.statics).toContainEqual(["color", "orange"]);
  });
});
