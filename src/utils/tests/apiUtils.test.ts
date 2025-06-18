import { describe, expect, it } from "vitest";
import { FlagsInput, ParsedStyle } from "../../types/core.types";
import {
  cloneParsedStyle,
  compressStyles,
  normalizeFlags,
  parseCompositeKey,
  parseStyle,
} from "../apiUtils";

describe("cloneParsedStyle", () => {
  it("should clone all fields", () => {
    const ps: ParsedStyle = {
      breakpoints: ["a", "b"],
      pseudos: [":active", ":focus"],
    };

    const copy = cloneParsedStyle(ps);
    expect(copy).toEqual(ps);
  });
});

describe("parseCompositeKey", () => {
  it("should handle css prop key", () => {
    const val = parseCompositeKey("padding");
    expect(val).toEqual({
      prop: "padding",
    });
  });

  it("should handle pseudo key", () => {
    const val = parseCompositeKey(":hover");
    expect(val).toEqual({
      pseudos: ["hover"],
    });
  });

  it("should handle breakpoint key", () => {
    const val = parseCompositeKey("sm");
    expect(val).toEqual({
      breakpoints: ["sm"],
    });
  });

  it("should handle unknown key", () => {
    const val = parseCompositeKey("fake");
    expect(val.invalid).toBe(true);
  });

  it("should handle keys with multiple duplicate pseudos", () => {
    const val = parseCompositeKey(":hover:hover");
    expect(val).toEqual({
      pseudos: ["hover"],
    });
  });

  it("should handle keys with multiple duplicate breakpoints", () => {
    const val = parseCompositeKey("sm:sm");
    expect(val).toEqual({
      breakpoints: ["sm"],
    });
  });

  it("should handle keys with multiple breakpoints and pseudos", () => {
    const val = parseCompositeKey("sm:lg:hover:active");
    expect(val).toEqual({
      breakpoints: ["sm", "lg"],
      pseudos: ["hover", "active"],
    });
  });

  it("should handle keys with multiple breakpoints, pseudos, and props", () => {
    const val = parseCompositeKey("sm:lg:padding:hover:active");
    expect(val).toEqual({
      breakpoints: ["sm", "lg"],
      pseudos: ["hover", "active"],
      prop: "padding",
    });
  });

  it("should handle keys with multiple props", () => {
    const val = parseCompositeKey("padding:margin");
    expect(val).toEqual({
      prop: "padding",
      invalid: true,
    });
  });

  it("should handle keys with multiple vals containing invalids", () => {
    const val = parseCompositeKey("sm:lg:foo:hover:active");
    expect(val).toEqual({
      breakpoints: ["sm", "lg"],
      pseudos: ["hover", "active"],
      invalid: true,
    });
  });

  it("should treat a number as a breakpoint", () => {
    const val = parseCompositeKey("213");
    expect(val).toEqual({
      breakpoints: ["213px"],
    });
  });

  it("should handle complex keys with numbers", () => {
    const val = parseCompositeKey("sm:lg:123:14:hover:active");
    expect(val).toEqual({
      breakpoints: ["sm", "lg", "123px", "14px"],
      pseudos: ["hover", "active"],
    });
  });
});

describe("parseStyle", () => {
  it("should handle a simple style", () => {
    const val = parseStyle({
      padding: 10,
      color: "red",
    });

    expect(val).toEqual([
      {
        prop: "padding",
        value: 10,
      },
      {
        prop: "color",
        value: "red",
      },
    ]);
  });

  it("should handle with pseudo", () => {
    const val = parseStyle({
      padding: 10,
      color: "red",
      ":hover": {
        padding: 20,
      },
    });

    expect(val).toEqual([
      {
        prop: "padding",
        value: 10,
      },
      {
        prop: "color",
        value: "red",
      },
      {
        prop: "padding",
        pseudos: ["hover"],
        value: 20,
      },
    ]);
  });

  it("should handle breakpoints", () => {
    const val = parseStyle({
      sm: {
        padding: 10,
        ":hover": {
          padding: 20,
        },
      },
    });

    expect(val).toEqual([
      {
        breakpoints: ["sm"],
        prop: "padding",
        value: 10,
      },
      {
        breakpoints: ["sm"],
        prop: "padding",
        pseudos: ["hover"],
        value: 20,
      },
    ]);
  });

  it("should handle composite keys", () => {
    const val = parseStyle({
      sm: {
        padding: 10,
        "lg:hover:active": {
          padding: 20,
        },
      },
    });

    expect(val).toEqual([
      {
        breakpoints: ["sm"],
        prop: "padding",
        value: 10,
      },
      {
        breakpoints: ["sm", "lg"],
        prop: "padding",
        pseudos: ["hover", "active"],
        value: 20,
      },
    ]);
  });

  it("should ignore composite keys with a prop where the value is an object", () => {
    const val = parseStyle({
      sm: {
        padding: 10,
        "lg:color:hover:active": {
          padding: 20,
        },
      },
    });

    expect(val).toEqual([
      {
        breakpoints: ["sm"],
        prop: "padding",
        value: 10,
      },
    ]);
  });

  it("should handle deeply nested", () => {
    const val = parseStyle({
      sm: {
        ":hover": {
          "lg:active": {
            focus: {
              md: {
                ":hover": {
                  color: "red",
                },
              },
            },
          },
        },
      },
    });

    expect(val).toEqual([
      {
        breakpoints: ["sm", "lg", "md"],
        prop: "color",
        pseudos: ["hover", "active", "focus"],
        value: "red",
      },
    ]);
  });

  it("should handle deeply nested invalid composite key", () => {
    const val = parseStyle({
      sm: {
        ":hover": {
          "lg:foo:active": {
            focus: {
              md: {
                ":hover": {
                  color: "red",
                },
              },
            },
          },
        },
        "lg:active": 15,
        foo: "23",
      },
    });

    expect(val).toEqual([]);
  });
});

describe("normalizeFlags()", () => {
  it("returns object input unchanged", () => {
    const input = { a: true, b: false } as FlagsInput<any>;
    expect(normalizeFlags(input)).toEqual(input);
  });
  it("converts array input of keys and tuples to object", () => {
    const input = ["x", ["y", false]] as FlagsInput<{ x: any; y: any }>;
    expect(normalizeFlags(input)).toEqual({ x: true, y: false });
  });
});

describe("compressStyles", () => {
  it("properly compresses a list of styles", () => {
    const styles: ParsedStyle[] = [
      {
        breakpoints: ["sm", "md"],
        pseudos: ["hover", "active"],
        prop: "padding",
        value: 10,
      },
      {
        prop: "padding",
        value: 10,
      },
      {
        breakpoints: ["lg"],
        prop: "color",
        value: "green",
      },
    ];

    const compressed = compressStyles(styles);

    expect(compressed).toEqual(
      "sm:md:hover:active:padding=10|padding=10|lg:color=green"
    );
  });
});
