import { describe, it, expect } from "vitest";
import { hashSignature, isObject, toKebab } from "../utils";

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

describe("isObject", () => {
  it("returns true for plain objects", () => {
    expect(isObject({})).toBe(true);
    expect(isObject({ a: 1, b: 2 })).toBe(true);
  });

  it("returns true for arrays", () => {
    expect(isObject([])).toBe(true);
    expect(isObject([1, 2, 3])).toBe(true);
  });

  it("returns true for null (typeof null is 'object')", () => {
    expect(isObject(null)).toBe(true);
  });

  it("returns true for Dates and other object wrappers", () => {
    expect(isObject(new Date())).toBe(true);
    expect(isObject(Object.create(null))).toBe(true);
  });

  it("returns false for primitives", () => {
    expect(isObject(undefined)).toBe(false);
    expect(isObject(123)).toBe(false);
    expect(isObject("string")).toBe(false);
    expect(isObject(true)).toBe(false);
    expect(isObject(() => {})).toBe(false);
    expect(isObject(Symbol("sym"))).toBe(false);
  });
});
