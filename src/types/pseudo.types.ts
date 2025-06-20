// src/pseudo.types.ts
export const PSEUDOS = [
  // Pseudo-classes
  ":active",
  ":any-link",
  ":blank",
  ":checked",
  ":default",
  ":defined",
  ":disabled",
  ":empty",
  ":enabled",
  ":first",
  ":first-child",
  ":first-of-type",
  ":fullscreen",
  ":focus",
  ":focus-visible",
  ":focus-within",
  ":has",
  ":hover",
  ":in-range",
  ":indeterminate",
  ":invalid",
  ":lang",
  ":last-child",
  ":last-of-type",
  ":link",
  ":not",
  ":nth-child",
  ":nth-last-child",
  ":nth-last-of-type",
  ":nth-of-type",
  ":only-child",
  ":only-of-type",
  ":optional",
  ":out-of-range",
  ":placeholder-shown",
  ":read-only",
  ":read-write",
  ":required",
  ":root",
  ":scope",
  ":target",
  ":valid",
  ":visited",

  // Pseudo-elements
  "::after",
  "::before",
  "::cue",
  "::first-letter",
  "::first-line",
  "::grammar-error",
  "::marker",
  "::placeholder",
  "::selection",
  "::slotted",
  "::target-text",
  "::backdrop",
  "::file-selector-button",
  "::part",
  "::spelling-error",
  "::cue-region",

  // Functional selectors
  ":is",
  ":where",
  ":matches",
  ":dir",
  ":host",
  ":host-context",

  // Vendor / custom prefixes
  ":-moz-focusring",
  ":-moz-full-screen",
  ":-moz-placeholder",
  ":-ms-input-placeholder",
  ":-webkit-autofill",
  ":-webkit-full-screen",
] as const;

export type Pseudo = (typeof PSEUDOS)[number];

// A Set of the names without leading ":" or "::"
export const PSEUDO_NAMES = new Set(PSEUDOS.map(p => p.replace(/^:+/, "")));
