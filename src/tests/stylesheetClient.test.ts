import { describe, it, expect, beforeEach } from "vitest";
import {
  __resetStylesheet,
  clearStylesheet,
  deleteClassNameRules,
  getStylesheet,
  injectStyles,
  rebuildStylesheet,
} from "../stylesheetClient";
import { styleRegistry } from "../globals";
import { ParsedStyle } from "../types/core.types";
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

describe("deleteClassNameRules", () => {
  beforeEach(() => {
    // Clear any existing <style> tags
    document.head.innerHTML = "";
    __resetStylesheet();
  });

  it("does nothing if no rules contain the className", () => {
    const sheet = getStylesheet();
    expect(sheet.cssRules).toHaveLength(0);

    sheet.insertRule(".foo { color: red; }");
    sheet.insertRule(".bar { color: blue; }");
    sheet.insertRule(".foo-bar { margin: 0; }");

    deleteClassNameRules("baz");

    expect(sheet.cssRules).toHaveLength(3);
  });

  it("removes all rules whose cssText includes the className", () => {
    const sheet = getStylesheet();
    expect(sheet.cssRules).toHaveLength(0);

    sheet.insertRule(".foo { color: red; }");
    sheet.insertRule(".bar { color: blue; }");
    sheet.insertRule(".foo-bar { margin: 0; }");

    deleteClassNameRules("foo");

    // should delete idx 2 first, then idx 0
    expect(sheet.cssRules).toHaveLength(1);
    expect(sheet.cssRules[0].cssText).toBe(".bar {color: blue;}");
  });

  it('matches substrings (so "bar" also removes ".foo-bar")', () => {
    const sheet = getStylesheet();
    expect(sheet.cssRules).toHaveLength(0);

    sheet.insertRule(".foo { color: red; }");
    sheet.insertRule(".bar { color: blue; }");
    sheet.insertRule(".foo-bar { margin: 0; }");

    deleteClassNameRules("bar");

    expect(sheet.cssRules).toHaveLength(1);
    expect(sheet.cssRules[0].cssText).toBe(".foo {color: red;}");
  });
});

describe("injectStyles", () => {
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
    globalConfig.tokens = { default: {} };
    globalConfig.breakpoints = { sm: "640px", lg: "1024px" };
  });

  it("injects static rules correctly", () => {
    const parsed: ParsedStyle[] = [
      {
        prop: "color",
        value: "red",
      },
      {
        prop: "marginTop",
        value: 10,
      },
    ];

    injectStyles("cls", parsed);

    expect(sheet.cssRules.length).toBe(1);
    const rule = sheet.cssRules[0];
    expect(rule.cssText.replace(/\s+/g, "")).toBe(
      ".cls{color:red;margin-top:10px;}"
    );
  });

  it("injects pseudo-class rules", () => {
    const parsed: ParsedStyle = {
      pseudos: ["hover"],
      prop: "background",
      value: "blue",
    };

    injectStyles("cls", [parsed]);

    // One for pseudoclass
    expect(sheet.cssRules.length).toBe(1);
    const rule = sheet.cssRules[0];
    expect(rule.cssText.replace(/\s+/g, "")).toBe(
      ".cls:hover{background:blue;}"
    );
  });

  it("injects responsive variant rules", () => {
    const parsed: ParsedStyle = {
      breakpoints: ["sm"],
      prop: "width",
      value: 5,
    };

    injectStyles("cls", [parsed]);

    // One @media rule
    expect(sheet.cssRules.length).toBe(1);
    const rule = sheet.cssRules[0];
    // CSSMediaRule.cssText may include spaces or formatting
    expect(rule.cssText.replace(/\s+/g, "")).toContain(
      "@media(min-width:640px){.cls{width:5px;}}"
    );
  });

  it("resolves tokens in string values", () => {
    globalConfig.tokens = {
      default: { primary: "#112233" },
    };

    const parsed: ParsedStyle = {
      prop: "background",
      value: "$primary$",
    };

    injectStyles("tok", [parsed]);

    expect(sheet.cssRules.length).toBe(1);
    const rule = sheet.cssRules[0];
    expect(rule.cssText.replace(/\s+/g, "")).toBe(".tok{background:#112233;}");
  });

  it("supports multiple ParsedRules arrays merging", () => {
    const parsed: ParsedStyle[] = [
      {
        prop: "padding",
        value: 2,
      },
      {
        prop: "margin",
        value: 4,
      },
      {
        pseudos: ["active"],
        prop: "opacity",
        value: 0.5,
      },
      {
        breakpoints: ["sm"],
        prop: "height",
        value: 10,
      },
    ];

    injectStyles("mix", parsed);

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

  it("supports styles with multiple breakpoints and pseudos", () => {
    const parsed: ParsedStyle[] = [
      {
        breakpoints: ["sm", "lg", "245px"],
        pseudos: ["active", "hover"],
        prop: "height",
        value: 10,
      },
    ];

    injectStyles("mix", parsed);

    expect(sheet.cssRules.length).toBe(3);
    const [sm, lg, num] = Array.from(sheet.cssRules);

    expect(sm.cssText.replace(/\s+/g, "")).toContain(
      "@media(min-width:640px){.mix:active:hover{height:10px;}}"
    );
    expect(lg.cssText.replace(/\s+/g, "")).toContain(
      "@media(min-width:1024px){.mix:active:hover{height:10px;}}"
    );
    expect(num.cssText.replace(/\s+/g, "")).toContain(
      "@media(min-width:245px){.mix:active:hover{height:10px;}}"
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
    const parsed: ParsedStyle[] = [
      {
        prop: "color",
        value: "white",
      },
    ];
    styleRegistry.set("newC", parsed);

    rebuildStylesheet();

    expect(sheet.cssRules.length).toBe(1);
    expect(sheet.cssRules[0].cssText.replace(/\s+/g, "")).toBe(
      ".newC{color:white;}"
    );
  });
});
