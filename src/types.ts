import type { CSSProperties } from "react";
import { Pseudo } from "./pseudo.types";

export type Primitive = string | number;
export type Breakpoint = Primitive;
export type PrimitiveOrCSSProperties = Primitive | CSSProperties;
export type PseudoMap = Record<Pseudo, CSSProperties>;
export type BreakpointMap = Record<Breakpoint, CSSProperties | PseudoMap>;

export type NestedStyles =
  | CSSProperties
  | PseudoMap
  | BreakpointMap
  | Record<string, Primitive>;

export interface ParsedRules {
  statics: Array<[string, Primitive]>;
  pseudos: Array<[string, string, Primitive]>; // [pseudo, prop, raw]
  variants: Record<
    string,
    Array<{ prop: string; raw: Primitive; pseudo?: string }>
  >;
}

export type BreakpointsMap = Record<string, string>;

export type Token = string;
export type TokensMap = Record<string, Token>;
export type TokensDefinition = Record<string, TokensMap>;

export interface GlobalConfig {
  /** Responsive breakpoints override */
  breakpoints: BreakpointsMap;
  /** Theme tokens map */
  tokens: TokensDefinition;
  /** Default unit for numeric values */
  defaultUnit: string;
  /** The active theme - defaults to "default" */
  activeTheme: string;
}

export interface StyleMeta {
  parsed: ParsedRules[];
}

export type StyleRegistry = Map<string, StyleMeta>;

export type FlagsInput<T> =
  | Partial<Record<keyof T, boolean>>
  | Array<keyof T | [keyof T, boolean]>;
