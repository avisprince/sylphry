import type { PropertiesHyphen } from "csstype";
import type { CSSProperties } from "react";

/** DJB2 hash → base36 */
export function hashSignature(sig: string): string {
  let h = 5381;
  for (let i = 0; i < sig.length; i++) h = (h * 33) ^ sig.charCodeAt(i);
  return (h >>> 0).toString(36);
}

/** Convert camelCase to kebab-case */
export function toKebab(s: string): string {
  return s.replace(/([A-Z])/g, "-$1").toLowerCase();
}

export function isObject(val: unknown): val is Record<string, unknown> {
  return typeof val === "object" && val !== null && !Array.isArray(val);
}

const _divStyle = document.createElement("div").style;

export function isCssProperty(
  key: string
): key is keyof CSSProperties | keyof PropertiesHyphen {
  return key in _divStyle;
}
