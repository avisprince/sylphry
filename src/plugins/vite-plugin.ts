import { cosmiconfigSync } from "cosmiconfig";
import { PluginOption } from "vite";
import { Config } from "../types/core.types";

const VIRTUAL_ID = "sylphry/config";
const RESOLVED_ID = "\0" + VIRTUAL_ID;

export default function sylphry(): PluginOption {
  let userConfig: Partial<Config> = {};

  return [
    {
      name: "vite-plugin-sylphry-config-preset",
      config(config) {
        return {
          optimizeDeps: {
            exclude: [...(config.optimizeDeps?.exclude || []), "sylphry"],
          },
        };
      },
    },
    {
      name: "sylphry-config",
      enforce: "pre",

      configResolved({ root }) {
        const explorer = cosmiconfigSync("sylphry", {
          searchPlaces: ["sylphry.config.cjs", "package.json"],
        });
        const result = explorer.search(root);
        userConfig = result?.config ?? {};
      },

      resolveId(id) {
        return id === VIRTUAL_ID ? RESOLVED_ID : null;
      },

      load(id) {
        return id === RESOLVED_ID
          ? `export default ${JSON.stringify(userConfig)}`
          : null;
      },
    },
  ];
}
