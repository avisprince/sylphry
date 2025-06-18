import { globalConfig } from "./config";
import { styleRegistry } from "./globals";
import { processStyle } from "./utils/stylesheetClient.utils";
import { ParsedStyle } from "./types/core.types";
import { Styles } from "./types/stylesheetClient.types";

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
    injectStyles(className, parsed);
  });
}

export function injectStyles(
  className: string,
  parsedStyles: ParsedStyle[]
): void {
  const sheet = getStylesheet();
  const nonBreakpointStyles: Styles = {};
  const breakpointStyles: Record<string, Styles> = {};

  parsedStyles.forEach(style => {
    if (!style.breakpoints || style.breakpoints.length === 0) {
      processStyle(style, nonBreakpointStyles);
    } else {
      style.breakpoints.forEach(bp => {
        breakpointStyles[bp] ||= {};
        processStyle(style, breakpointStyles[bp]);
      });
    }
  });

  Object.entries(nonBreakpointStyles).forEach(([pseudo, styles]) => {
    const ps = pseudo === "none" ? "" : `:${pseudo}`;
    const decl = styles.map(({ prop, value }) => `${prop}:${value};`).join(" ");
    sheet.insertRule(`.${className}${ps}{${decl}}`, sheet.cssRules.length);
  });

  Object.entries(breakpointStyles).forEach(([bp, pseudoMap]) => {
    Object.entries(pseudoMap).forEach(([pseudo, styles]) => {
      const ps = pseudo === "none" ? "" : `:${pseudo}`;
      const decl = styles
        .map(({ prop, value }) => `${prop}:${value};`)
        .join(" ");

      const minWidth = globalConfig.breakpoints[bp] ?? bp;
      sheet.insertRule(
        `@media(min-width:${minWidth}){.${className}${ps}{${decl}}}`,
        sheet.cssRules.length
      );
    });
  });
}
