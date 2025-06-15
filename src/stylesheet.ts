import { globalConfig, isUnitlessNumber, styleRegistry } from "./globals";
import { ParsedRules, Primitive } from "./types/core.types";
import { toKebab } from "./utils";

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

  styleRegistry.forEach(({ parsed }, className) => {
    injectRules(className, parsed);
  });
}

/** Format raw value: number→unit or resolve token */
export function format(k: string, v: Primitive): string {
  if (typeof v === "number") {
    return k in isUnitlessNumber
      ? String(v)
      : `${v}${globalConfig.defaultUnit}`;
  }

  if (typeof v === "string") {
    const tokenRE = /\$([A-Za-z0-9_]+)(?::([A-Za-z0-9_]+))?\$/g;
    return v.replace(tokenRE, (_, t1, t2) => {
      const theme = t2 ? t1 : globalConfig.activeTheme;
      const key = t2 || t1;
      const src = globalConfig.tokens[theme] || {};
      const def = globalConfig.tokens["default"] || {};
      return src[key] ?? def[key] ?? `$${t1}${t2 ? `:${t2}` : ""}$`;
    });
  }

  return String(v);
}

/** Inject formatted CSS rules */
export function injectRules(className: string, parsedArr: ParsedRules[]) {
  // Statics
  const sheet = getStylesheet();
  const mapS = new Map<string, string>();
  parsedArr.forEach(pr =>
    pr.statics.forEach(([p, r]) => mapS.set(toKebab(p), format(p, r)))
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
      sub.set(toKebab(p), format(p, r));
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
