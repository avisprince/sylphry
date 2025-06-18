import { globalConfig } from "../config";
import { isUnitlessNumber } from "../globals";
import { ParsedStyle, Primitive, Tokens } from "../types/core.types";
import { Styles } from "../types/stylesheetClient.types";
import { isObject, toKebab } from "./utils";

function getTokenValue(token: string, tokens: Tokens): string | null {
  const parts = token.split(":").filter(Boolean);
  const roots = [tokens, tokens[globalConfig.activeTheme], tokens.default];

  for (const root of roots) {
    const value = parts.reduce((acc, key) => {
      return isObject(acc) ? acc?.[key] : null;
    }, root as unknown);

    if (value != null && !isObject(value)) {
      return String(value);
    }
  }

  return null;
}

/** Format raw value: number→unit or resolve token */
export function format(
  key: string,
  value: Primitive,
  tokens: Tokens = globalConfig.tokens
): string {
  if (typeof value === "number") {
    return key in isUnitlessNumber
      ? String(value)
      : `${value}${globalConfig.defaultUnit}`;
  }

  if (typeof value === "string") {
    const tokenRegex = /\$([^$]+)\$/g;

    return value.replace(tokenRegex, (match, innerToken) => {
      return getTokenValue(innerToken, tokens) ?? match;
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
