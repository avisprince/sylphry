import { describe, expect, it, vi } from "vitest";

/**
 * Helper to reset modules, mock the virtual module, and import globalConfig fresh.
 */
async function loadGlobalConfigWithMock(userConfigMock: any) {
  vi.resetModules();
  // Mock the virtual module path to return whatever we pass in
  vi.doMock("sylphry/config", () => ({ default: userConfigMock }));
  // Dynamically import after mocking
  const { globalConfig } = await import("../config");
  return globalConfig;
}

describe("globalConfig", () => {
  it("uses defaultConfig when userConfig is an empty object", async () => {
    const cfg = await loadGlobalConfigWithMock({});
    expect(cfg).toEqual({
      breakpoints: {
        xs: "0px",
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
        "2xl": "1536px",
      },
      tokens: {},
      themes: {
        default: {},
      },
      defaultUnit: "px",
      activeTheme: "default",
    });
  });

  it("merges userConfig overrides correctly", async () => {
    const userMock = {
      breakpoints: { sm: "500px", custom: "2000px" },
      tokens: { primary: "#ff00ff" },
      themes: { dark: { background: "#000" } },
      defaultUnit: "em",
      activeTheme: "dark",
    };
    const cfg = await loadGlobalConfigWithMock(userMock);

    // Breakpoints merged
    expect(cfg.breakpoints.xs).toBe("0px");
    expect(cfg.breakpoints.sm).toBe("500px");
    expect(cfg.breakpoints.custom).toBe("2000px");

    // Tokens merged
    expect(cfg.tokens.primary).toBe("#ff00ff");

    // Themes merged
    expect(Object.keys(cfg.themes)).toEqual(
      expect.arrayContaining(["default", "dark"])
    );
    expect(cfg.themes.default).toEqual({});
    expect(cfg.themes.dark).toEqual({ background: "#000" });

    // defaultUnit & activeTheme overridden
    expect(cfg.defaultUnit).toBe("em");
    expect(cfg.activeTheme).toBe("dark");
  });

  it("falls back to defaultConfig when userConfig is null or undefined", async () => {
    const cfgUndefined = await loadGlobalConfigWithMock(undefined);
    expect(cfgUndefined.defaultUnit).toBe("px");
    expect(cfgUndefined.breakpoints.sm).toBe("640px");
    expect(cfgUndefined.themes.default).toEqual({});

    const cfgNull = await loadGlobalConfigWithMock(null);
    expect(cfgNull.defaultUnit).toBe("px");
    expect(cfgNull.tokens).toEqual({});
  });
});
