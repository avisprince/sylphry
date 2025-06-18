import { describe, it, expect } from "vitest";
import { hashSignature, isCssProperty, isObject, toKebab } from "../utils";

describe("hashSignature", () => {
  it("returns the same hash for identical input", () => {
    const a = hashSignature("foo|bar");
    const b = hashSignature("foo|bar");
    expect(a).toBe(b);
  });

  it("produces different hashes for different inputs", () => {
    expect(hashSignature("foo")).not.toBe(hashSignature("bar"));
  });
});

describe("toKebab", () => {
  it("converts camelCase to kebab-case", () => {
    expect(toKebab("camelCaseTest")).toBe("camel-case-test");
  });

  it("converts PascalCase to kebab-case", () => {
    expect(toKebab("PascalCase")).toBe("-pascal-case");
  });

  it("handles single uppercase letters", () => {
    expect(toKebab("A")).toBe("-a");
    expect(toKebab("Ab")).toBe("-ab");
    expect(toKebab("aB")).toBe("a-b");
  });

  it("preserves existing hyphens and lowercases everything", () => {
    expect(toKebab("already-kebab")).toBe("already-kebab");
    expect(toKebab("Mixed-UP-Case")).toBe("-mixed--u-p--case");
  });

  it("returns an empty string when given an empty string", () => {
    expect(toKebab("")).toBe("");
  });
});

describe("isObject type guard", () => {
  it("returns false for null and undefined", () => {
    expect(isObject(null)).toBe(false);
    expect(isObject(undefined)).toBe(false);
  });

  it("returns false for primitive values", () => {
    expect(isObject(42)).toBe(false);
    expect(isObject("hello")).toBe(false);
    expect(isObject(true)).toBe(false);
    expect(isObject(Symbol("sym"))).toBe(false);
  });

  it("returns false for arrays", () => {
    expect(isObject([])).toBe(false);
    expect(isObject([1, 2, 3])).toBe(false);
  });

  it("returns false for functions", () => {
    expect(isObject(() => {})).toBe(false);
    expect(isObject(function () {})).toBe(false);
  });

  it("returns true for plain objects", () => {
    expect(isObject({})).toBe(true);
    expect(isObject({ foo: "bar", baz: 0 })).toBe(true);
  });

  it("returns true for other non‐array objects", () => {
    expect(isObject(new Date())).toBe(true);
    expect(isObject(/abc/)).toBe(true);
    expect(isObject(Object.create(null))).toBe(true);
  });
});

describe("isCssProperty", () => {
  it("should return true for valid properties", () => {
    expect(isCssProperty("padding")).toBe(true);
    expect(isCssProperty("cssFloat")).toBe(true);
    expect(isCssProperty("float")).toBe(true);
    expect(isCssProperty("flub")).toBe(false);
    expect(isCssProperty("align-items")).toBe(true);
    expect(isCssProperty("alignItems")).toBe(true);
    expect(isCssProperty("fakeCamel")).toBe(false);
  });
});
