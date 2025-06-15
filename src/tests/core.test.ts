import { describe, it, expect, beforeEach, vi } from "vitest";
import * as stylesheet from "../stylesheet";
import { globalConfig, styleRegistry } from "../globals";
import {
  normalizeFlags,
  parseRules,
  initialize,
  setTheme,
  createStyles,
} from "../core";
import { FlagsInput, ParsedRules, Style } from "../types/core.types";

describe("API functions", () => {
  beforeEach(() => {
    // Reset globalConfig to defaults
    globalConfig.tokens = { default: {} };
    globalConfig.defaultUnit = "px";
    globalConfig.activeTheme = "default";
    globalConfig.breakpoints = { sm: "640px" };
    styleRegistry.clear();
    vi.spyOn(stylesheet, "rebuildStylesheet").mockImplementation(() => {});
  });

  describe("initialize()", () => {
    it("updates only provided options and calls rebuildStylesheet", () => {
      const initialBreakpoints = { sm: "640px" };

      initialize({ defaultUnit: "em" });
      expect(globalConfig.defaultUnit).toBe("em");
      expect(globalConfig.breakpoints).toEqual(initialBreakpoints);

      initialize({ activeTheme: "theme1" });
      expect(globalConfig.defaultUnit).toBe("em");
      expect(globalConfig.breakpoints).toEqual(initialBreakpoints);
      expect(globalConfig.activeTheme).toEqual("theme1");

      expect(stylesheet.rebuildStylesheet).toHaveBeenCalledTimes(2);
    });
  });

  describe("setTheme()", () => {
    it("sets activeTheme and calls rebuildStylesheet", () => {
      setTheme("dark");
      expect(globalConfig.activeTheme).toBe("dark");
      expect(stylesheet.rebuildStylesheet).toHaveBeenCalled();
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

  describe("parseRules()", () => {
    it("parses statics, pseudos, and variants correctly", () => {
      globalConfig.breakpoints = { sm: "500px", lg: "1000px" };

      const rules: Style = {
        // CSSProperties
        color: "red",
        height: 10,

        // Pseudo Styles
        ":hover": { background: "blue" },

        // Breakpoints
        sm: {
          margin: 10,
          ":hover": { background: "green" },
        },
        127: {
          height: 20,
          ":active": { height: 30 },
        },

        // Complex Styles
        "lg:padding": 20,
        "lg:margin": 20,

        // Invalid breakpoint - should be ignored
        fake: { width: 10 },
        "fake:height": 10,
      };

      const parsed = parseRules(rules);

      expect(parsed.statics).toEqual([
        ["color", "red"],
        ["height", 10],
      ]);
      expect(parsed.pseudos).toEqual([["hover", "background", "blue"]]);
      expect(parsed.variants.sm![0]).toMatchObject({ prop: "margin", raw: 10 });
      expect(parsed.variants.lg![0]).toMatchObject({
        prop: "padding",
        raw: 20,
      });
      expect(parsed.variants.lg![1]).toMatchObject({
        prop: "margin",
        raw: 20,
      });
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
      const injectSpy = vi.spyOn(stylesheet, "injectRules");
      const cls = styles.foo;
      expect(injectSpy).toHaveBeenCalledWith(
        cls,
        expect.arrayContaining<ParsedRules>([
          expect.objectContaining({
            statics: expect.arrayContaining([["display", "block"]]),
            pseudos: expect.arrayContaining([["active", "opacity", 0.5]]),
            variants: expect.any(Object),
          }),
        ])
      );
      injectSpy.mockRestore();
    });

    it("generates consistent class names and calls injectRules", () => {
      const defs = { foo: { padding: 2 }, bar: { opacity: 0.5 } };
      const styles = createStyles(defs, { prefix: "pre" });
      const injectSpy = vi.spyOn(stylesheet, "injectRules");
      const cls = styles({ foo: true, bar: true });
      expect(cls.startsWith("pre-foo_bar_")).toBe(true);
      expect(injectSpy).toHaveBeenCalledWith(cls, expect.any(Array));
      injectSpy.mockRestore();
    });

    it("handles object and array flag inputs equivalently", () => {
      const defs = { a: { color: "blue" }, b: { color: "green" } };
      const styles = createStyles(defs);
      const clsObj = styles({ a: true, b: false });
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
      const injectSpy = vi.spyOn(stylesheet, "injectRules");

      styles.box;

      expect(injectSpy).toHaveBeenCalledWith(
        expect.stringContaining("box_"),
        expect.arrayContaining([
          expect.objectContaining({
            statics: expect.arrayContaining([["background", "$primary$"]]),
          }),
        ])
      );
      injectSpy.mockRestore();
    });

    it("includes nested object variants in the parsed rules", () => {
      const defs = { item: { sm: { color: "navy" } } };
      const styles = createStyles(defs);
      const spy = vi.spyOn(stylesheet, "injectRules");

      const cls = styles.item;
      expect(spy).toHaveBeenCalledWith(
        cls,
        expect.arrayContaining([
          expect.objectContaining({
            variants: expect.objectContaining({
              sm: expect.arrayContaining([
                expect.objectContaining({ prop: "color", raw: "navy" }),
              ]),
            }),
          }),
        ])
      );

      spy.mockRestore();
    });

    it("handles inline variant syntax correctly", () => {
      const defs = { box: { "sm:margin": 12 } };
      const styles = createStyles(defs);
      const spy = vi.spyOn(stylesheet, "injectRules");

      const cls = styles.box;
      expect(spy).toHaveBeenCalledWith(
        cls,
        expect.arrayContaining([
          expect.objectContaining({
            variants: expect.objectContaining({
              sm: expect.arrayContaining([
                expect.objectContaining({ prop: "margin", raw: 12 }),
              ]),
            }),
          }),
        ])
      );

      spy.mockRestore();
    });
  });
});
