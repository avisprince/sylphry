import { beforeEach, describe, expect, it, vi, Mock } from "vitest";
import sylphry from "../vite-plugin";
import { cosmiconfigSync } from "cosmiconfig";
import type { UserConfig, PluginOption } from "vite";

vi.mock("cosmiconfig", () => ({
  cosmiconfigSync: vi.fn(),
}));

describe("sylphry Vite plugin", () => {
  const mockConfig = { foo: "bar", nested: { x: 1 } };
  let explorerMock: { search: Mock };
  let mockedCosmiconfigSync: Mock;

  beforeEach(() => {
    // Reset & mock cosmiconfigSync → explorer.search returns our mockConfig
    explorerMock = { search: vi.fn().mockReturnValue({ config: mockConfig }) };
    mockedCosmiconfigSync = cosmiconfigSync as unknown as Mock;
    mockedCosmiconfigSync.mockReturnValue(explorerMock);
  });

  it("returns two PluginOption entries", () => {
    const plugins = sylphry() as PluginOption[];
    expect(Array.isArray(plugins)).toBe(true);
    expect(plugins).toHaveLength(2);
  });

  it("preset plugin merges sylphry into optimizeDeps.exclude (with existing exclude)", () => {
    const [preset] = sylphry() as [
      PluginOption & { config: (c: UserConfig) => Partial<UserConfig> },
      any
    ];
    const userCfg: UserConfig = { optimizeDeps: { exclude: ["foo"] } };
    const merged = preset.config(userCfg);
    expect(merged.optimizeDeps!.exclude).toEqual(["foo", "sylphry"]);
  });

  it("preset plugin merges sylphry into optimizeDeps.exclude (no optimizeDeps)", () => {
    const [preset] = sylphry() as [
      PluginOption & { config: (c: UserConfig) => Partial<UserConfig> },
      any
    ];
    const merged = preset.config({}); // optimizeDeps undefined
    expect(merged.optimizeDeps).toBeDefined();
    expect(merged.optimizeDeps!.exclude).toEqual(["sylphry"]);
  });

  it("resolveId returns RESOLVED_ID only for the virtual import", () => {
    const [, plugin] = sylphry() as [any, any];
    const RESOLVED_ID = "\0sylphry/config";
    expect(plugin.resolveId("sylphry/config")).toBe(RESOLVED_ID);
    expect(plugin.resolveId("unrelated")).toBeNull();
  });

  it("load returns fallback empty object before configResolved", () => {
    const [, plugin] = sylphry() as [any, any];
    const code = plugin.load("\0sylphry/config");
    expect(code).toBe("export default {}");
  });

  it("load returns an export of the inlined config after configResolved", () => {
    const [, plugin] = sylphry() as [any, any];
    // simulate Vite having called configResolved using our mockConfig
    plugin.configResolved({ root: "/fake/root" });
    const code = plugin.load("\0sylphry/config");
    expect(code).toBe(`export default ${JSON.stringify(mockConfig)}`);
  });

  it("load returns null for non-matching IDs", () => {
    const [, plugin] = sylphry() as [any, any];
    expect(plugin.load("some/other")).toBeNull();
  });

  it("configResolved fallback uses empty object when search returns undefined", () => {
    // Make explorer.search return undefined
    explorerMock.search.mockReturnValue(undefined);
    const [, plugin] = sylphry() as [any, any];
    plugin.configResolved({ root: "/no/config" });
    const code = plugin.load("\0sylphry/config");
    expect(code).toBe("export default {}");
  });

  it("uses cosmiconfigSync with the correct searchPlaces", () => {
    const [, plugin] = sylphry() as [any, any];
    plugin.configResolved({ root: "/my/project" });
    expect(mockedCosmiconfigSync).toHaveBeenCalledWith("sylphry", {
      searchPlaces: ["sylphry.config.cjs", "package.json"],
    });
    expect(explorerMock.search).toHaveBeenCalledWith("/my/project");
  });
});
