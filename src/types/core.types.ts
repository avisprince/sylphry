import type { Pseudo } from "./pseudo.types";
import type { CSSProperties } from "react";
import type { PropertiesHyphen } from "csstype";

export type Primitive = string | number;

type BreakpointNames = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
export type BreakpointsMap = Record<BreakpointNames | string, string>;

export type Tokens = {
  [key: string]: Primitive | Tokens;
};

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
      // a) Any valid React CSS property
      [K in keyof CSSProperties]?: CSSProperties[K];
    } & {
      // a) Any valid hyphen CSS property
      [K in keyof PropertiesHyphen]?: PropertiesHyphen[K];
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
      [key: string]: Style | TokenRef | Primitive;
    };

export type StyleMap = Record<string, Style>;

export type CreateStylesOptions = {
  prefix?: string;
};

export type ProcessStylesOptions = {
  prefix?: string;
  tokens?: Tokens;
};

export type ParsedStyle = {
  breakpoints?: string[];
  prop?: keyof CSSProperties | keyof PropertiesHyphen;
  pseudos?: string[];
  value?: Primitive;
  invalid?: boolean;
};

export type StyleRegistry = Map<string, ParsedStyle[]>;

export type FlagsInput<T> =
  | Partial<Record<keyof T, boolean>>
  | Array<keyof T | [keyof T, boolean]>;
