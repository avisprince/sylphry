import { hashSignature, toKebab } from "./utils/utils";
import { injectStyles, rebuildStylesheet } from "./stylesheetClient";
import { styleRegistry } from "./globals";
import {
  CreateStylesOptions,
  FlagsInput,
  ParsedStyle,
  ProcessStylesOptions,
  StyleMap,
} from "./types/core.types";
import { globalConfig } from "./config";
import { compressStyles, normalizeFlags, parseStyle } from "./utils/apiUtils";
import { format } from "./utils/stylesheetClientUtils";

/** Switch active theme and rebuild only dynamic styles */
export function setTheme(theme: string): void {
  globalConfig.activeTheme = theme;
  rebuildStylesheet();
}

/**
 * createStyles: supports object or array flags, type-safe keys, token autocomplete
 */
export function createStyles(
  definitions: StyleMap,
  options: CreateStylesOptions = {}
): {
  (
    flags: Partial<Record<keyof StyleMap, boolean>>,
    options?: ProcessStylesOptions
  ): string;
  (
    flagsArray: Array<keyof StyleMap | [keyof StyleMap, boolean]>,
    options?: ProcessStylesOptions
  ): string;
} & Record<keyof StyleMap, string> {
  const keys = Object.keys(definitions) as Array<keyof StyleMap>;
  const globalPrefix = options.prefix ? `${toKebab(options.prefix)}-` : "";

  const parsedMap: Record<string, ParsedStyle[]> = Object.entries(
    definitions
  ).reduce((acc, [key, val]) => {
    return {
      ...acc,
      [key]: parseStyle(val),
    };
  }, {});

  function processStyles(
    input: FlagsInput<StyleMap>,
    options?: ProcessStylesOptions
  ): string {
    const prefix = options?.prefix ? `${toKebab(options.prefix)}-` : "";

    // Determine active keys in insertion order
    const flags = normalizeFlags<StyleMap>(input);
    const activeKeys = (Object.keys(flags) as Array<keyof StyleMap>).filter(
      k => flags[k] && k in parsedMap
    );

    if (!activeKeys.length) {
      return "";
    }

    const parsedActive = activeKeys.reduce<ParsedStyle[]>((acc, key) => {
      return acc.concat(parsedMap[key]);
    }, []);

    const compressed = compressStyles(parsedActive);
    const hash = hashSignature(compressed);
    const name = activeKeys.map(k => toKebab(String(k))).join("_");
    const className = `${prefix || globalPrefix}${name}_${hash}`;

    const finalStyles = options?.tokens
      ? parsedActive.map(style => ({
          ...style,
          value: format(style.prop!, style.value!, options.tokens),
        }))
      : parsedActive;

    // Register & inject once
    if (!styleRegistry.has(className)) {
      styleRegistry.set(className, finalStyles);
      injectStyles(className, finalStyles);
    }

    return className;
  }

  // Single-key getters
  const combo = processStyles as unknown as typeof processStyles &
    Record<keyof StyleMap, string>;

  keys.forEach(k => {
    Object.defineProperty(combo, k, {
      get: () => processStyles([k] as Array<keyof StyleMap>),
      enumerable: true,
    });
  });

  return combo;
}
