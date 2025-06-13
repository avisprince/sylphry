import type { CSSProperties } from "react";

/**
 * Define your tokens in a separate file, for example:
 *
 * // tokens.ts
 * export const tokens = {
 *   default: { primary: '#f00', secondary: '#0f0' },
 *   dark:    { primary: '#c00', secondary: '#0c0' },
 * } as const;
 *
 * export type TokenNames  = keyof typeof tokens.default;
 * export type ThemeTokens = { [K in keyof typeof tokens]: Record<TokenNames, string> };
 */

/**
 * Options for createStyles, with token autocomplete
 */
export interface CreateStylesOptions<
  TokensType extends Record<string, Record<string, string>> = Record<
    string,
    Record<string, string>
  >
> {
  /** Responsive breakpoints override */
  breakpoints?: Record<string | number, string>;
  /** Default unit for numeric values */
  defaultUnit?: string;
  /** Prefix for generated class names */
  prefix?: string;
  /** Theme tokens map */
  tokens?: TokensType;
}

/** Default Tailwind-like breakpoints */
const DEFAULT_BREAKPOINTS: Record<string, string> = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
};

/** Global configuration & active theme */
const globalConfig = {
  breakpoints: { ...DEFAULT_BREAKPOINTS } as Record<string, string>,
  defaultUnit: "px",
  prefix: "",
  tokens: {} as Record<string, Record<string, string>>,
};
let activeTheme = "default";

/** Convert camelCase to kebab-case */
function toKebab(s: string): string {
  return s.replace(/([A-Z])/g, "-$1").toLowerCase();
}

/** Initialize global settings, then rebuild all styles */
export function initialize<
  TokensType extends Record<string, Record<string, string>>
>(options: CreateStylesOptions<TokensType>): void {
  if (options.breakpoints) {
    globalConfig.breakpoints = {
      ...DEFAULT_BREAKPOINTS,
      ...options.breakpoints,
    };
  }
  if (options.defaultUnit) {
    globalConfig.defaultUnit = options.defaultUnit;
  }
  if (options.prefix) {
    globalConfig.prefix = `${toKebab(options.prefix)}-`;
  }
  if (options.tokens) {
    globalConfig.tokens = options.tokens;
  }
  rebuildStylesheet();
}

/** Switch active theme and rebuild only dynamic styles */
export function setTheme(theme: string): void {
  activeTheme = theme;
  rebuildStylesheet();
}

// Singleton stylesheet and registry
let styleSheet: CSSStyleSheet | null = null;
const styleRegistry = new Map<string, StyleMeta>();

function getSheet(): CSSStyleSheet {
  if (!styleSheet) {
    const el = document.createElement("style");
    document.head.appendChild(el);
    styleSheet = el.sheet as CSSStyleSheet;
  }
  return styleSheet;
}

function clearSheet(): void {
  const sheet = getSheet();
  while (sheet.cssRules.length) {
    sheet.deleteRule(0);
  }
}

/** Rebuild all registered styles into the sheet */
function rebuildStylesheet(): void {
  clearSheet();
  const sheet = getSheet();
  styleRegistry.forEach(({ parsed, breakpoints }, className) => {
    injectRules(className, parsed, breakpoints, sheet);
  });
}

type Primitive = string | number;
export type NestedStyles =
  | CSSProperties
  | Record<string, Primitive | CSSProperties>;

interface ParsedRules {
  statics: Array<[string, Primitive]>;
  pseudos: Array<[string, string, Primitive]>; // [pseudo, prop, raw]
  variants: Record<
    string,
    Array<{ prop: string; raw: Primitive; pseudo?: string }>
  >;
}

interface StyleMeta {
  parsed: ParsedRules[];
  breakpoints: Record<string, string>;
}

/**
 * createStyles: supports object or array flags, type-safe keys, token autocomplete
 */
export function createStyles<
  T extends Record<string, NestedStyles>,
  TokensType extends Record<
    string,
    Record<string, string>
  > = typeof globalConfig.tokens
>(
  definitions: T,
  options: CreateStylesOptions<TokensType> = {}
): {
  (flags: Partial<Record<keyof T, boolean>>): string;
  (flagsArray: Array<keyof T | [keyof T, boolean]>): string;
} & Record<keyof T, string> {
  const keys = Object.keys(definitions) as Array<keyof T>;
  const breakpoints = {
    ...globalConfig.breakpoints,
    ...(options.breakpoints || {}),
  };
  const prefix = options.prefix
    ? `${toKebab(options.prefix)}-`
    : globalConfig.prefix;

  // Parse definitions into raw buckets
  const parsedList = keys.map(k => parseRules(definitions[k], breakpoints));
  const sheet = getSheet();

  type FlagsInput =
    | Partial<Record<keyof T, boolean>>
    | Array<keyof T | [keyof T, boolean]>;

  function styles(input: FlagsInput): string {
    // Normalize flags
    const flags: Partial<Record<keyof T, boolean>> = {};
    if (Array.isArray(input)) {
      input.forEach(item => {
        if (Array.isArray(item)) {
          const [k, v] = item;
          flags[k] = v;
        } else {
          flags[item] = true;
        }
      });
    } else {
      Object.assign(flags, input);
    }

    // Determine active keys in insertion order
    const activeKeys = (Object.keys(flags) as Array<keyof T>).filter(
      k => flags[k]
    );
    if (!activeKeys.length) return "";

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
    const signature = sigParts.join("|");
    const hash = hashSignature(signature);
    const name = activeKeys.map(k => toKebab(String(k))).join("_");
    const className = `${prefix}${name}_${hash}`;

    // Register & inject once
    if (!styleRegistry.has(className)) {
      styleRegistry.set(className, { parsed: parsedActive, breakpoints });
      injectRules(className, parsedActive, breakpoints, sheet);
    }
    return className;
  }

  // Single-key getters
  const combo = styles as unknown as typeof styles & Record<keyof T, string>;
  keys.forEach(k => {
    Object.defineProperty(combo, k, {
      get: () => styles([k] as Array<keyof T>),
      enumerable: true,
    });
  });
  return combo;
}

/** Parse rules into raw buckets without formatting */
function parseRules(
  rules: NestedStyles,
  breakpoints: Record<string, string>
): ParsedRules {
  const statics: ParsedRules["statics"] = [];
  const pseudos: ParsedRules["pseudos"] = [];
  const variants: ParsedRules["variants"] = {};
  const inlineRE = /^(\w+):(\w[\w-]*)(?::(\w+))?$/;
  const rec = rules as Record<string, Primitive | CSSProperties>;

  for (const key in rec) {
    const raw = rec[key];
    const m = inlineRE.exec(key);
    if (m && typeof raw !== "object") {
      const [, bp, prop, pseudo] = m;
      if (bp in breakpoints) variants[bp] = variants[bp] || [];
      variants[bp].push({ prop, raw: raw as Primitive, pseudo });
      continue;
    }
    if (key in breakpoints && typeof raw === "object" && raw) {
      variants[key] = variants[key] || [];
      for (const p in raw as Record<string, Primitive>) {
        const pseudo = p.startsWith(":") ? p.slice(1) : undefined;
        const prop = pseudo ? p.slice(1) : p;
        variants[key].push({
          prop,
          raw: (raw as Record<string, Primitive>)[p],
          pseudo,
        });
      }
      continue;
    }
    if (key.startsWith(":") && typeof raw === "object" && raw) {
      const ps = key.slice(1);
      for (const p in raw as Record<string, Primitive>) {
        pseudos.push([ps, p, (raw as Record<string, Primitive>)[p]]);
      }
      continue;
    }
    if (typeof raw !== "object") statics.push([key, raw as Primitive]);
  }

  return { statics, pseudos, variants };
}

/** Inject formatted CSS rules */
function injectRules(
  className: string,
  parsedArr: ParsedRules[],
  breakpoints: Record<string, string>,
  sheet: CSSStyleSheet
) {
  // Statics
  const mapS = new Map<string, string>();
  parsedArr.forEach(pr =>
    pr.statics.forEach(([p, r]) => mapS.set(toKebab(p), format(r)))
  );
  if (mapS.size) {
    const decl = Array.from(mapS)
      .map(([k, v]) => `${k}:${v};`)
      .join(" ");
    sheet.insertRule(`.${className}{${decl}}`, sheet.cssRules.length);
  }
  // Pseudos
  const mapP = new Map<string, Map<string, string>>();
  parsedArr.forEach(pr =>
    pr.pseudos.forEach(([ps, p, r]) => {
      const sub = mapP.get(ps) || new Map<string, string>();
      sub.set(toKebab(p), format(r));
      mapP.set(ps, sub);
    })
  );
  mapP.forEach((sub, ps) => {
    const decl = Array.from(sub)
      .map(([k, v]) => `${k}:${v};`)
      .join(" ");
    sheet.insertRule(`.${className}:${ps}{${decl}}`, sheet.cssRules.length);
  });
  // Variants
  Object.entries(breakpoints).forEach(([bp, minW]) => {
    const mapV = new Map<string, string>();
    parsedArr.forEach(pr =>
      pr.variants[bp]?.forEach(v => mapV.set(toKebab(v.prop), format(v.raw)))
    );
    if (mapV.size) {
      const decl = Array.from(mapV)
        .map(([k, v]) => `${k}:${v};`)
        .join(" ");
      sheet.insertRule(
        `@media(min-width:${minW}){.${className}{${decl}}}`,
        sheet.cssRules.length
      );
    }
  });
}

/** Format raw value: number→unit or resolve token */
function format(v: Primitive | string): string {
  if (typeof v === "number") return `${v}${globalConfig.defaultUnit}`;
  if (typeof v === "string") {
    const tokenRE = /\$([A-Za-z0-9_]+)(?::([A-Za-z0-9_]+))?\$/g;
    return v.replace(tokenRE, (_, t1, t2) => {
      const theme = t2 ? t1 : activeTheme;
      const key = t2 || t1;
      const src = globalConfig.tokens[theme] || {};
      const def = globalConfig.tokens["default"] || {};
      return src[key] ?? def[key] ?? `$${t1}${t2 ? `:${t2}` : ""}$`;
    });
  }
  return String(v);
}

/** DJB2 hash → base36 */
function hashSignature(sig: string): string {
  let h = 5381;
  for (let i = 0; i < sig.length; i++) h = (h * 33) ^ sig.charCodeAt(i);
  return (h >>> 0).toString(36);
}
