import { describe, it, expect, beforeEach } from "vitest";
import { __resetStylesheet } from "../../stylesheetClient";
import { globalConfig } from "../../config";
import { format } from "../stylesheetClient.utils";

describe("format()", () => {
  beforeEach(() => {
    // Reset globals
    globalConfig.defaultUnit = "px";
    globalConfig.activeTheme = "default";
    globalConfig.tokens = {
      default: { foo: "FOO", baz: "#ABC" },
    };
  });

  it("appends defaultUnit for number props that are not unitless", () => {
    expect(format("width", 10)).toBe("10px");
    expect(format("marginTop", -5)).toBe("-5px");
  });

  it("omits units for known unitless props", () => {
    expect(format("opacity", 0.5)).toBe("0.5");
    expect(format("zIndex", 100)).toBe("100");
  });

  it("resolves single-token strings using activeTheme", () => {
    expect(format("color", "$foo$")).toBe("FOO");
  });

  it("resolves multi-token strings", () => {
    globalConfig.tokens.dark = { foo: "DARCOLOR" };
    const input = "1px solid $foo$ and $baz$ and $missing$";
    // Only active tokens replaced, baz from default
    expect(format("border", input)).toBe(
      "1px solid FOO and #ABC and $missing$"
    );
  });

  it("resolves explicit-theme token syntax", () => {
    globalConfig.tokens.dark = { foo: "DARCOLOR" };
    expect(format("color", "$dark:foo$")).toBe("DARCOLOR");
  });

  it("falls back to default token when explicit theme missing key", () => {
    globalConfig.tokens.dark = {};
    expect(format("color", "$dark:foo$")).toBe("$dark:foo$");
  });

  it("leaves unmatched placeholders intact", () => {
    expect(format("color", "$missing$")).toBe("$missing$");
    expect(format("background", "$dark:missing$")).toBe("$dark:missing$");
  });

  it("returns raw strings when no tokens present", () => {
    expect(format("fontFamily", "Arial, sans-serif")).toBe("Arial, sans-serif");
  });

  it("stringifies other types", () => {
    expect(format("dummy", true as any)).toBe("true");
    expect(format("dummy", { x: 1 } as any)).toBe("[object Object]");
    const sym = Symbol("s");
    expect(format("dummy", sym as any)).toBe(sym.toString());
  });
});

describe("format() - default-token fallback", () => {
  beforeEach(() => {
    globalConfig.defaultUnit = "px";
    globalConfig.activeTheme = "default";
    // Simulate missing default map:
    globalConfig.tokens = {};
  });

  it("falls back to empty object when default tokens are missing", () => {
    // Since tokens["default"] is undefined, def becomes {}
    // and no replacement occurs, so the placeholder remains
    expect(format("color", "$foo$")).toBe("$foo$");
  });

  it("also leaves explicit-theme placeholders intact if both maps missing", () => {
    expect(format("color", "$dark:bar$")).toBe("$dark:bar$");
  });
});
