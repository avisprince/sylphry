import { globalConfig } from "../config";
import { FlagsInput, ParsedStyle, Primitive, Style } from "../types/core.types";
import { CSS_PROPS_SET, CSSProperty } from "../types/cssProps.types";
import { Pseudo, PSEUDO_NAMES } from "../types/pseudo.types";
import { isObject } from "./utils";

export function cloneParsedStyle(ps: ParsedStyle) {
  return {
    ...ps,
    breakpoints: ps.breakpoints ? [...ps.breakpoints] : undefined,
    pseudos: ps.pseudos ? [...ps.pseudos] : undefined,
  } as ParsedStyle;
}

export function parseCompositeKey(
  key: string,
  parentParsedStyle: ParsedStyle = {}
): ParsedStyle {
  const style = key
    .split(":")
    .filter(Boolean)
    .reduce<ParsedStyle>((acc, k) => {
      if (k in globalConfig.breakpoints || !isNaN(Number(k))) {
        acc.breakpoints ||= [];
        const key = !isNaN(Number(k)) ? `${k}px` : k;
        acc.breakpoints.push(key);
      } else if (PSEUDO_NAMES.has(k)) {
        acc.pseudos ||= [];
        acc.pseudos.push(k as Pseudo);
      } else if (CSS_PROPS_SET.has(k)) {
        // Cannot have more than one prop
        acc.prop ? (acc.invalid = true) : (acc.prop = k as CSSProperty);
      } else {
        // Unknown key value
        acc.invalid = true;
      }

      return acc;
    }, cloneParsedStyle(parentParsedStyle));

  return {
    ...style,
    breakpoints: style.breakpoints
      ? Array.from(new Set(style.breakpoints))
      : undefined,
    pseudos: style.pseudos ? Array.from(new Set(style.pseudos)) : undefined,
  };
}

export function parseStyle(
  style: Style,
  parentParsedStyle: ParsedStyle = {}
): ParsedStyle[] {
  const parsedStyles: ParsedStyle[] = [];

  Object.entries(style).forEach(([key, value]) => {
    const parsedStyle = parseCompositeKey(key, parentParsedStyle);

    if (parsedStyle.invalid) {
      return;
    }

    if (isObject(value)) {
      // Value is a nested style
      // A property must not be defined to have nested Styles
      if (!parsedStyle.prop) {
        // Recurse
        const styles = parseStyle(value as Style, parsedStyle);
        parsedStyles.push(...styles);
      }
    } else {
      // Value is a primitive
      // A prop is needed to set a value
      if (parsedStyle.prop) {
        parsedStyle.value = value as Primitive;
        parsedStyles.push(parsedStyle);
      }
    }
  });

  return parsedStyles;
}

export function normalizeFlags<T>(
  input: FlagsInput<T>
): Partial<Record<keyof T, boolean>> {
  if (!Array.isArray(input)) {
    return input;
  }

  const flags: Partial<Record<keyof T, boolean>> = {};

  return input.reduce((acc, item) => {
    if (Array.isArray(item)) {
      const [k, v] = item;
      acc[k] = v;
    } else {
      acc[item] = true;
    }

    return acc;
  }, flags);
}

export function compressStyles(styles: ParsedStyle[]): string {
  return styles
    .map(({ breakpoints, pseudos, prop, value }) => {
      const bps = breakpoints ? `${breakpoints?.join(":")}:` : "";
      const pseudo = pseudos ? `${pseudos?.join(":")}:` : "";
      return `${bps}${pseudo}${prop}=${value}`;
    })
    .join("|");
}
