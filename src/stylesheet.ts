import { globalConfig } from "./config";
import { isUnitlessNumber, styleRegistry } from "./globals";
import { ParsedRules, Primitive } from "./types/core.types";
import { isObject, toKebab } from "./utils";

// Singleton stylesheet and registry
let styleSheet: CSSStyleSheet | null = null;

/** Test helper: clear the singleton so tests start fresh */
export function __resetStylesheet() {
  styleSheet = null;
}

export function getStylesheet(): CSSStyleSheet {
  if (!styleSheet) {
    const el = document.createElement("style");
    document.head.appendChild(el);
    styleSheet = el.sheet as CSSStyleSheet;
  }

  return styleSheet;
}

export function clearStylesheet(): void {
  const sheet = getStylesheet();

  while (sheet.cssRules.length) {
    sheet.deleteRule(0);
  }
}

/** Rebuild all registered styles into the sheet */
export function rebuildStylesheet(): void {
  clearStylesheet();

  styleRegistry.forEach((parsed, className) => {
    injectRules(className, parsed);
  });
}

function getTokenValue(token: string): string | null {
  const parts = token.split(":").filter(Boolean);
  const topKey = parts[0];
  const root =
    topKey in globalConfig.tokens
      ? globalConfig.tokens
      : globalConfig.tokens.default;

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

/** Inject formatted CSS rules */
export function injectRules(className: string, parsedArr: ParsedRules[]) {
  const sheet = getStylesheet();
  const statics = new Map<string, string>();
  const pseudos = new Map<string, Map<string, string>>();

  // Statics
  parsedArr.forEach(pr =>
    pr.statics.forEach(([p, r]) => statics.set(toKebab(p), format(p, r)))
  );

  if (statics.size) {
    const decl = Array.from(statics)
      .map(([k, v]) => `${k}:${v};`)
      .join(" ");
    sheet.insertRule(`.${className}{${decl}}`, sheet.cssRules.length);
  }

  // Pseudos
  parsedArr.forEach(pr =>
    pr.pseudos.forEach(([ps, p, r]) => {
      const sub = pseudos.get(ps) || new Map<string, string>();
      sub.set(toKebab(p), format(p, r));
      pseudos.set(ps, sub);
    })
  );

  pseudos.forEach((sub, ps) => {
    const decl = Array.from(sub)
      .map(([k, v]) => `${k}:${v};`)
      .join(" ");
    sheet.insertRule(`.${className}:${ps}{${decl}}`, sheet.cssRules.length);
  });

  // Variants
  Object.entries(globalConfig.breakpoints).forEach(([bp, minW]) => {
    const mapV = new Map<string, string>();

    parsedArr.forEach(pr =>
      pr.variants[bp]?.forEach(v =>
        mapV.set(toKebab(v.prop), format(className, v.raw))
      )
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
