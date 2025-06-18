import { describe, it, expect, beforeEach, vi, ParsedStack } from "vitest";
import * as stylesheet from "../stylesheetClient";
import { styleRegistry } from "../globals";
import { setTheme, createStyles } from "../api";
import { FlagsInput, ParsedStyle } from "../types/core.types";
import { globalConfig } from "../config";

describe("API functions", () => {
  beforeEach(() => {
    // Reset globalConfig to defaults
    globalConfig.tokens = {};
    globalConfig.tokens = { default: {} };
    globalConfig.defaultUnit = "px";
    globalConfig.activeTheme = "default";
    globalConfig.breakpoints = { sm: "640px" };
    styleRegistry.clear();
    vi.spyOn(stylesheet, "rebuildStylesheet").mockImplementation(() => {});
  });

  describe("setTheme()", () => {
    it("sets activeTheme and calls rebuildStylesheet", () => {
      setTheme("dark");
      expect(globalConfig.activeTheme).toBe("dark");
      expect(stylesheet.rebuildStylesheet).toHaveBeenCalled();
    });
  });

  describe("createStyles()", () => {
    beforeEach(() => {
      styleRegistry.clear();
      document.head.innerHTML = "";
      vi.restoreAllMocks();
    });

    it("returns a function with key getters", () => {
      const defs = { one: { color: "red" }, two: { margin: 5 } };
      const styles = createStyles(defs);
      expect(typeof styles).toBe("function");
      expect(typeof styles.one).toBe("string");
      expect(typeof styles.two).toBe("string");
    });

    it("honors local prefix over global prefix", () => {
      globalConfig.breakpoints = { sm: "600px" };
      const defs = { alpha: { color: "a" } };
      const styles = createStyles(defs, { prefix: "global" });
      const clsGlobal = styles.alpha;
      const clsLocal = styles({ alpha: true }, { prefix: "local" });
      expect(clsGlobal.startsWith("global-alpha_")).toBe(true);
      expect(clsLocal.startsWith("local-alpha_")).toBe(true);
    });

    it("calls injectRules with parsed rules reflecting definitions", () => {
      const defs = {
        foo: { display: "block", ":active": { opacity: 0.5 } },
      };
      const styles = createStyles(defs);
      const injectSpy = vi.spyOn(stylesheet, "injectStyles");
      const cls = styles.foo;
      expect(injectSpy).toHaveBeenCalledWith(
        cls,
        expect.arrayContaining<ParsedStyle>([
          {
            prop: "display",
            value: "block",
          },
          {
            pseudos: ["active"],
            prop: "opacity",
            value: 0.5,
          },
        ])
      );
      injectSpy.mockRestore();
    });

    it("generates consistent class names and calls injectRules", () => {
      const defs = { foo: { padding: 2 }, bar: { opacity: 0.5 } };
      const styles = createStyles(defs, { prefix: "pre" });
      const injectSpy = vi.spyOn(stylesheet, "injectStyles");
      const cls = styles({ foo: true, bar: true });
      expect(cls.startsWith("pre-foo_bar_")).toBe(true);
      expect(injectSpy).toHaveBeenCalledWith(cls, expect.any(Array));
      injectSpy.mockRestore();
    });

    it("handles object and array flag inputs equivalently", () => {
      const defs = { a: { color: "blue" }, b: { color: "green" } };
      const styles = createStyles(defs);
      const clsObj = styles({ a: true, b: false, foo: true });
      const clsArr = styles(["a", ["b", false]]);
      expect(clsObj).toBe(clsArr);
    });

    it("returns empty string when no flags are active", () => {
      const defs = { x: { color: "black" } };
      const styles = createStyles(defs);
      expect(styles({})).toBe("");
      expect(styles([])).toBe("");
    });

    it("leaves token placeholders in statics values", () => {
      const defs = { box: { background: "$primary$" } };
      const styles = createStyles(defs);
      const injectSpy = vi.spyOn(stylesheet, "injectStyles");

      styles.box;

      expect(injectSpy).toHaveBeenCalledWith(
        expect.stringContaining("box_"),
        expect.arrayContaining([
          expect.objectContaining({
            prop: "background",
            value: "$primary$",
          }),
        ])
      );
      injectSpy.mockRestore();
    });

    it("includes nested object variants in the parsed rules", () => {
      const defs = { item: { sm: { color: "navy" } } };
      const styles = createStyles(defs);
      const spy = vi.spyOn(stylesheet, "injectStyles");

      const cls = styles.item;
      expect(spy).toHaveBeenCalledWith(
        cls,
        expect.arrayContaining([
          expect.objectContaining({
            breakpoints: ["sm"],
            prop: "color",
            value: "navy",
          }),
        ])
      );

      spy.mockRestore();
    });

    it("handles inline variant syntax correctly", () => {
      const defs = { box: { "sm:margin": 12 } };
      const styles = createStyles(defs);
      const spy = vi.spyOn(stylesheet, "injectStyles");

      const cls = styles.box;
      expect(spy).toHaveBeenCalledWith(
        cls,
        expect.arrayContaining([
          expect.objectContaining({
            breakpoints: ["sm"],
            prop: "margin",
            value: 12,
          }),
        ])
      );

      spy.mockRestore();
    });

    it("properly handles an optional tokens param", () => {
      const defs = { box: { "sm:margin": "$foo$ $fizz$" } };
      const styles = createStyles(defs);
      const spy = vi.spyOn(stylesheet, "injectStyles");

      const tokens = { foo: "bar" };
      const cls = styles(["box"], { tokens });

      expect(spy).toHaveBeenCalledWith(
        cls,
        expect.arrayContaining([
          expect.objectContaining({
            breakpoints: ["sm"],
            prop: "margin",
            value: "bar $fizz$",
          }),
        ])
      );

      spy.mockRestore();
    });
  });
});
