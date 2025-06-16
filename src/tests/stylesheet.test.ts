// test/runtime.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import {
  __resetStylesheet,
  clearStylesheet,
  format,
  getStylesheet,
  injectRules,
  rebuildStylesheet,
} from "../stylesheet";
import { styleRegistry } from "../globals";
import { ParsedRules, Primitive } from "../types/core.types";
import { globalConfig } from "../config";

describe("getStylesheet", () => {
  beforeEach(() => {
    // Clear any existing <style> tags
    document.head.innerHTML = "";
    __resetStylesheet();
  });

  it("creates a <style> element on first call", () => {
    const sheet1 = getStylesheet();
    expect(sheet1).toHaveProperty("cssRules");
    expect(document.head.querySelectorAll("style").length).toBe(1);
  });

  it("returns the same sheet on subsequent calls", () => {
    const sheet1 = getStylesheet();
    const sheet2 = getStylesheet();
    expect(sheet2).toBe(sheet1);
    expect(document.head.querySelectorAll("style").length).toBe(1);
  });
});

describe("clearStylesheet", () => {
  beforeEach(() => {
    // Clear any existing <style> tags
    document.head.innerHTML = "";
    __resetStylesheet();
  });

  it("removes all rules from the stylesheet", () => {
    const sheet = getStylesheet();
    // Insert two dummy rules
    sheet.insertRule(".foo { color: red; }", sheet.cssRules.length);
    sheet.insertRule(".bar { color: blue; }", sheet.cssRules.length);
    expect(sheet.cssRules.length).toBe(2);

    clearStylesheet();
    expect(sheet.cssRules.length).toBe(0);
  });

  it("does nothing on an already empty stylesheet", () => {
    const sheet = getStylesheet();
    expect(sheet.cssRules.length).toBe(0);
    // Should not throw or add rules
    clearStylesheet();
    expect(sheet.cssRules.length).toBe(0);
    expect(document.head.querySelectorAll("style")).toHaveLength(1);
  });
});

describe("injectRules", () => {
  let sheet: CSSStyleSheet;

  beforeEach(() => {
    // Reset registry and stylesheet rules
    styleRegistry.clear();
    sheet = getStylesheet();
    while (sheet.cssRules.length) {
      sheet.deleteRule(0);
    }
    // Reset globals
    globalConfig.defaultUnit = "px";
    globalConfig.activeTheme = "default";
    globalConfig.tokens = {};
    globalConfig.themes = { default: {} };
    globalConfig.breakpoints = { sm: "640px" };
  });

  it("injects static rules correctly", () => {
    const parsed: ParsedRules = {
      statics: [
        ["color", "red"],
        ["marginTop", 10 as Primitive],
      ],
      pseudos: [],
      variants: {},
    };

    injectRules("cls", [parsed]);

    expect(sheet.cssRules.length).toBe(1);
    const rule = sheet.cssRules[0];
    expect(rule.cssText.replace(/\s+/g, "")).toBe(
      ".cls{color:red;margin-top:10px;}"
    );
  });

  it("injects pseudo-class rules", () => {
    const parsed: ParsedRules = {
      statics: [],
      pseudos: [["hover", "background", "blue" as Primitive]],
      variants: {},
    };

    injectRules("cls", [parsed]);

    // One for pseudoclass
    expect(sheet.cssRules.length).toBe(1);
    const rule = sheet.cssRules[0];
    expect(rule.cssText.replace(/\s+/g, "")).toBe(
      ".cls:hover{background:blue;}"
    );
  });

  it("injects responsive variant rules", () => {
    const parsed: ParsedRules = {
      statics: [],
      pseudos: [],
      variants: {
        sm: [{ prop: "width", raw: 5 as Primitive }],
      },
    };

    injectRules("cls", [parsed]);

    // One @media rule
    expect(sheet.cssRules.length).toBe(1);
    const rule = sheet.cssRules[0];
    // CSSMediaRule.cssText may include spaces or formatting
    expect(rule.cssText.replace(/\s+/g, "")).toContain(
      "@media(min-width:640px){.cls{width:5px;}}"
    );
  });

  it("resolves tokens in string values", () => {
    globalConfig.themes = {
      default: { primary: "#112233" },
    };

    const parsed: ParsedRules = {
      statics: [["background", "$primary$"]],
      pseudos: [],
      variants: {},
    };

    injectRules("tok", [parsed]);

    expect(sheet.cssRules.length).toBe(1);
    const rule = sheet.cssRules[0];
    expect(rule.cssText.replace(/\s+/g, "")).toBe(".tok{background:#112233;}");
  });

  it("supports multiple ParsedRules arrays merging", () => {
    const p1: ParsedRules = {
      statics: [["padding", 2 as Primitive]],
      pseudos: [],
      variants: {},
    };
    const p2: ParsedRules = {
      statics: [["margin", 4 as Primitive]],
      pseudos: [["active", "opacity", 0.5 as Primitive]],
      variants: { sm: [{ prop: "height", raw: 10 as Primitive }] },
    };

    injectRules("mix", [p1, p2]);

    // Expect 3 rules: static, pseudo, and variant
    expect(sheet.cssRules.length).toBe(3);
    const [rStatic, rPseudo, rVariant] = Array.from(sheet.cssRules);

    expect(rStatic.cssText.replace(/\s+/g, "")).toBe(
      ".mix{padding:2px;margin:4px;}"
    );
    expect(rPseudo.cssText.replace(/\s+/g, "")).toBe(
      ".mix:active{opacity:0.5;}"
    );
    expect(rVariant.cssText.replace(/\s+/g, "")).toContain(
      "@media(min-width:640px){.mix{height:10px;}}"
    );
  });
});

describe("rebuildStylesheet", () => {
  beforeEach(() => {
    // Clear existing styles and registry
    document.head.innerHTML = "";
    __resetStylesheet();
  });

  it("clears old rules and re-injects from registry", () => {
    // Manually insert a dummy rule
    const sheet = getStylesheet();
    sheet.insertRule(".old{color:black;}", 0);
    expect(sheet.cssRules.length).toBe(1);

    // Add new registry entry
    const parsed: ParsedRules[] = [
      {
        statics: [["color", "white"]],
        pseudos: [],
        variants: {},
      },
    ];
    styleRegistry.set("newC", { parsed });

    rebuildStylesheet();

    expect(sheet.cssRules.length).toBe(1);
    expect(sheet.cssRules[0].cssText.replace(/\s+/g, "")).toBe(
      ".newC{color:white;}"
    );
  });
});

describe("format()", () => {
  beforeEach(() => {
    // Reset globals
    globalConfig.defaultUnit = "px";
    globalConfig.activeTheme = "default";
    globalConfig.tokens = {};
    globalConfig.themes = {
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
    globalConfig.themes.dark = { foo: "DARCOLOR" };
    const input = "1px solid $foo$ and $baz$";
    // Only active tokens replaced, baz from default
    expect(format("border", input)).toBe("1px solid FOO and #ABC");
  });

  it("resolves explicit-theme token syntax", () => {
    globalConfig.themes.dark = { foo: "DARCOLOR" };
    expect(format("color", "$dark:foo$")).toBe("DARCOLOR");
  });

  it("falls back to default token when explicit theme missing key", () => {
    globalConfig.themes.dark = {};
    expect(format("color", "$dark:foo$")).toBe("FOO");
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

describe("format() – default‐token fallback", () => {
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
