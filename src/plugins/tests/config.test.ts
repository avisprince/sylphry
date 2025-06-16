import { describe, expect, it } from "vitest";
import userConfig from "../config";

describe("fallback config module", () => {
  it("exports an object", () => {
    expect(typeof userConfig).toBe("object");
  });

  it("defaults to an empty object", () => {
    expect(userConfig).toEqual({});
    expect(Object.keys(userConfig)).toHaveLength(0);
  });
});
