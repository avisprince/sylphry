import { CSSProperties } from "react";
import { Pseudo } from "./pseudo.types";
import { CSSProperty } from "./css-props.types";

export type Primitive = string | number;

type BreakpointNames = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
export type BreakpointsMap = Record<BreakpointNames | string, string>;

export type ThemeTokens = Record<string, Primitive | Record<string, Primitive>>;
export type Tokens = Record<string, ThemeTokens>;

export type Config = {
  /** Responsive breakpoints override */
  breakpoints: BreakpointsMap;
  /** Tokens */
  tokens: Tokens;
  /** Default unit for numeric values */
  defaultUnit: string;
  /** The active theme - defaults to "default" */
  activeTheme: string;
};

type TokenRef = `$${string}$`;

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

export type StyleMap = Record<string, Style>;

export type CreateStylesOptions = {
  prefix?: string;
};

export type ProcessStylesOptions = {
  prefix?: string;
};

export interface ParsedRules {
  statics: Array<[string, Primitive]>;
  pseudos: Array<[string, string, Primitive]>; // [pseudo, prop, raw]
  variants: Record<
    string,
    Array<{ prop: string; raw: Primitive; pseudo?: string }>
  >;
}

export type ParsedStyle = {
  breakpoints?: string[];
  prop?: CSSProperty;
  pseudos?: Pseudo[];
  value?: Primitive;
  invalid?: boolean;
};

export type StyleRegistry = Map<string, ParsedRules[]>;

export type FlagsInput<T> =
  | Partial<Record<keyof T, boolean>>
  | Array<keyof T | [keyof T, boolean]>;
