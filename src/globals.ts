import {
  BreakpointsMap,
  GlobalConfig,
  StyleRegistry,
  TokensDefinition,
} from "./types";

/** Default Tailwind-like breakpoints */
const DEFAULT_BREAKPOINTS: BreakpointsMap = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
};

/** Global configuration & active theme */
export const globalConfig: GlobalConfig = {
  breakpoints: { ...DEFAULT_BREAKPOINTS } as BreakpointsMap,
  tokens: {} as TokensDefinition,
  defaultUnit: "px",
  activeTheme: "default",
};

/** Registry of styles across application */
export const styleRegistry: StyleRegistry = new Map();

// List of CSS properties that accept unitless numbers
export const isUnitlessNumber = {
  animationIterationCount: true,
  borderImageOutset: true,
  borderImageSlice: true,
  borderImageWidth: true,
  boxFlex: true,
  boxFlexGroup: true,
  boxOrdinalGroup: true,
  columnCount: true,
  flex: true,
  flexGrow: true,
  flexPositive: true,
  flexShrink: true,
  flexNegative: true,
  flexOrder: true,
  gridRow: true,
  gridColumn: true,
  fontWeight: true,
  lineClamp: true, // non-standard but supported
  lineHeight: true,
  opacity: true,
  order: true,
  orphans: true,
  tabSize: true,
  widows: true,
  zIndex: true,
  zoom: true,

  // SVG-related properties
  fillOpacity: true,
  floodOpacity: true,
  stopOpacity: true,
  strokeDasharray: true,
  strokeDashoffset: true,
  strokeMiterlimit: true,
  strokeOpacity: true,
  strokeWidth: true,
};
