import { CSSProperties } from "react";
import { Pseudo } from "./pseudo.types";

type BreakpointNames = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
export type BreakpointsMap = Record<BreakpointNames | string, string>;

type TokenRef = `$${string}$`;
type TokensMap = Record<string, string>;
export type TokensDefinition = Record<string, TokensMap>;

export type GlobalConfig = {
  /** Responsive breakpoints override */
  breakpoints: BreakpointsMap;
  /** Theme tokens map */
  tokens: TokensDefinition;
  /** Default unit for numeric values */
  defaultUnit: string;
  /** The active theme - defaults to "default" */
  activeTheme: string;
};

export type Style =
  | ({
      // a) Any valid React CSS property or token
      [K in keyof CSSProperties]?: CSSProperties[K] | TokenRef;
    } & {
      // b) Nested pseudo selectors
      [P in Pseudo]?: Style;
    } & {
      // c) Nested breakpoint blocks
      [B in BreakpointNames]?: Style;
    } & {
      // d) Numeric breakpoint blocks, e.g. 600
      [index: number]: Style;
    })
  | {
      // e) Custom breakpoint or composite keys
      [key: string]: Style | TokenRef | string | number;
    };

export type CreateStylesOptions = {
  prefix?: string;
};

export type ProcessStylesOptions = {
  prefix?: string;
};

export type Primitive = string | number;

export interface ParsedRules {
  statics: Array<[string, Primitive]>;
  pseudos: Array<[string, string, Primitive]>; // [pseudo, prop, raw]
  variants: Record<
    string,
    Array<{ prop: string; raw: Primitive; pseudo?: string }>
  >;
}

export interface StyleMeta {
  parsed: ParsedRules[];
}

export type StyleRegistry = Map<string, StyleMeta>;

export type FlagsInput<T> =
  | Partial<Record<keyof T, boolean>>
  | Array<keyof T | [keyof T, boolean]>;
