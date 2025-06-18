import { globalConfig } from "../config";
import { isUnitlessNumber } from "../globals";
import { ParsedStyle, Primitive } from "../types/core.types";
import { Styles } from "../types/stylesheetClient.types";
import { isObject, toKebab } from "./utils";

function getTokenValue(token: string): string | null {
  const { tokens } = globalConfig;

  const parts = token.split(":").filter(Boolean);
  const topKey = parts[0];
  const root = topKey in tokens ? tokens : tokens.default;

  const value = parts.reduce((acc, key) => {
    return isObject(acc) ? acc?.[key] : null;
  }, root as unknown);

  return isObject(value) || value == null ? null : String(value);
}

/** Format raw value: number→unit or resolve token */
export function format(key: string, value: Primitive): string {
  if (typeof value === "number") {
    return key in isUnitlessNumber
      ? String(value)
      : `${value}${globalConfig.defaultUnit}`;
  }

  if (typeof value === "string") {
    const tokenRegex = /\$([^$]+)\$/g;

    return value.replace(tokenRegex, (match, innerToken) => {
      return getTokenValue(innerToken) ?? match;
    });
  }

  return String(value);
}

export function processStyle(style: ParsedStyle, map: Styles): void {
  const formattedStyle = {
    prop: toKebab(style.prop!),
    value: format(style.prop!, style.value!),
  };

  const pseudoKey = style.pseudos?.join(":") || "none";
  map[pseudoKey] ||= [];
  map[pseudoKey].push(formattedStyle);
}
