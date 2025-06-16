import { Config } from "./types/core.types";
import userConfig from "sylphry/config";

const defaultConfig: Config = {
  breakpoints: {
    xs: "0px",
    sm: "640px",
    md: "768px",
    lg: "1024px",
    xl: "1280px",
    "2xl": "1536px",
  },
  tokens: {},
  themes: {
    default: {},
  },
  defaultUnit: "px",
  activeTheme: "default",
};

export const globalConfig: Config = userConfig
  ? {
      breakpoints: {
        ...defaultConfig.breakpoints,
        ...(userConfig.breakpoints ?? {}),
      },
      tokens: {
        ...defaultConfig.tokens,
        ...(userConfig.tokens ?? {}),
      },
      themes: {
        ...defaultConfig.themes,
        ...(userConfig.themes ?? {}),
      },
      defaultUnit: userConfig.defaultUnit ?? defaultConfig.defaultUnit,
      activeTheme: userConfig.activeTheme ?? defaultConfig.activeTheme,
    }
  : defaultConfig;
