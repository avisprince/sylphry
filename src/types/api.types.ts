import {
  CreateStylesOptions,
  GlobalConfig,
  ProcessStylesOptions,
  Style,
} from "./core.types";

export declare function initialize(options: Partial<GlobalConfig>): void;

export declare function setTheme(theme: string): void;

export declare function createStyles<T extends Record<string, Style>>(
  styles: T,
  options: CreateStylesOptions
): {
  (
    flags: Partial<Record<keyof T, boolean>>,
    options?: ProcessStylesOptions
  ): string;
  (
    flagsArray: Array<keyof T | [keyof T, boolean]>,
    options?: ProcessStylesOptions
  ): string;
} & Record<keyof T, string>;
