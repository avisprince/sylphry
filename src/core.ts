import { hashSignature, isObject, toKebab } from "./utils";
import { injectRules, rebuildStylesheet } from "./stylesheet";
import { styleRegistry } from "./globals";
import {
  CreateStylesOptions,
  FlagsInput,
  ParsedRules,
  Primitive,
  ProcessStylesOptions,
  Style,
} from "./types/core.types";
import { CSSProperties } from "react";
import { globalConfig } from "./config";

/** Switch active theme and rebuild only dynamic styles */
export function setTheme(theme: string): void {
  globalConfig.activeTheme = theme;
  rebuildStylesheet();
}

/**
 * createStyles: supports object or array flags, type-safe keys, token autocomplete
 */
export function createStyles<T extends Record<string, Style>>(
  definitions: T,
  options: CreateStylesOptions = {}
): {
  (
    flags: Partial<Record<keyof T, boolean>>,
    options?: ProcessStylesOptions
  ): string;
  (
    flagsArray: Array<keyof T | [keyof T, boolean]>,
    options?: ProcessStylesOptions
  ): string;
} & Record<keyof T, string> {
  const keys = Object.keys(definitions) as Array<keyof T>;
  const globalPrefix = options.prefix ? `${toKebab(options.prefix)}-` : "";

  // Parse definitions into raw buckets
  const parsedList = keys.map(k => parseRules(definitions[k]));

  function processStyles(
    input: FlagsInput<T>,
    options: ProcessStylesOptions = {}
  ): string {
    const prefix = options.prefix ? `${toKebab(options.prefix)}-` : "";

    // Determine active keys in insertion order
    const flags = normalizeFlags<T>(input);
    const activeKeys = (Object.keys(flags) as Array<keyof T>).filter(
      k => flags[k]
    );

    if (!activeKeys.length) {
      return "";
    }

    // Build raw signature
    const sigParts: string[] = [];
    const parsedActive = activeKeys.map(k => parsedList[keys.indexOf(k)]);

    parsedActive.forEach(pr => {
      pr.statics.forEach(([p, r]) => sigParts.push(`s:${p}=${r}`));
      pr.pseudos.forEach(([ps, p, r]) => sigParts.push(`p:${ps}:${p}=${r}`));

      Object.entries(pr.variants).forEach(([bp, arr]) =>
        arr.forEach(v => sigParts.push(`v:${bp}:${v.prop}=${v.raw}`))
      );
    });

    const hash = hashSignature(sigParts.join("|"));
    const name = activeKeys.map(k => toKebab(String(k))).join("_");
    const className = `${prefix || globalPrefix}${name}_${hash}`;

    // Register & inject once
    if (!styleRegistry.has(className)) {
      styleRegistry.set(className, { parsed: parsedActive });
      injectRules(className, parsedActive);
    }

    return className;
  }

  // Single-key getters
  const combo = processStyles as unknown as typeof processStyles &
    Record<keyof T, string>;

  keys.forEach(k => {
    Object.defineProperty(combo, k, {
      get: () => processStyles([k] as Array<keyof T>),
      enumerable: true,
    });
  });

  return combo;
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

/** Parse rules into raw buckets without formatting */
export function parseRules(rules: Style): ParsedRules {
  const statics: ParsedRules["statics"] = [];
  const pseudos: ParsedRules["pseudos"] = [];
  const variants: ParsedRules["variants"] = {};
  const inlineRE = /^(\w+):(\w[\w-]*)(?::(\w+))?$/;
  const rec = rules as Record<string, Primitive | CSSProperties>;

  for (const key in rec) {
    const raw = rec[key];
    const m = inlineRE.exec(key);

    if (m && !isObject(raw)) {
      const [, bp, prop, pseudo] = m;

      if (bp in globalConfig.breakpoints) {
        variants[bp] = variants[bp] || [];
        variants[bp].push({ prop, raw: raw as Primitive, pseudo });
      }

      continue;
    }

    if (key in globalConfig.breakpoints && isObject(raw) && raw) {
      variants[key] = variants[key] || [];

      for (const p in raw as Record<string, Primitive>) {
        const pseudo = p.startsWith(":") ? p.slice(1) : undefined;
        const prop = pseudo ?? p;

        variants[key].push({
          prop,
          raw: (raw as Record<string, Primitive>)[p],
          pseudo,
        });
      }

      continue;
    }

    if (key.startsWith(":") && isObject(raw) && raw) {
      const ps = key.slice(1);

      for (const p in raw as Record<string, Primitive>) {
        pseudos.push([ps, p, (raw as Record<string, Primitive>)[p]]);
      }

      continue;
    }

    if (!isObject(raw)) {
      statics.push([key, raw as Primitive]);
    }
  }

  return { statics, pseudos, variants };
}
