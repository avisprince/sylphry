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
