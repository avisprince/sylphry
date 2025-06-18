import {
  CreateStylesOptions,
  ProcessStylesOptions,
  StyleMap,
} from "./core.types";

export declare function setTheme(theme: string): void;

export declare function createStyles(
  styles: StyleMap,
  options: CreateStylesOptions
): {
  (
    flags: Partial<Record<keyof StyleMap, boolean>>,
    options?: ProcessStylesOptions
  ): string;
  (
    flagsArray: Array<keyof StyleMap | [keyof StyleMap, boolean]>,
    options?: ProcessStylesOptions
  ): string;
} & Record<keyof StyleMap, string>;
