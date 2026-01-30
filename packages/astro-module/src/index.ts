import type { HookParameters } from "astro";
import { vueTemplatePreAstroPlugin } from "./vite-pre-astro-plugin";

type SetupHookParams = HookParameters<"astro:config:setup">;

function VuecastAstro() {
  return {
    name: "@vuecast/astro-module",
    hooks: {
      "astro:config:setup": async (params: SetupHookParams) => {
        const existingPlugins = params.config.vite?.plugins;
        const normalizedPlugins = Array.isArray(existingPlugins)
          ? existingPlugins
          : existingPlugins
            ? [existingPlugins]
            : [];

        params.updateConfig({
          vite: {
            plugins: [vueTemplatePreAstroPlugin(), ...normalizedPlugins],
          },
        });
      },
    },
  };
}

export { VuecastAstro, VuecastAstro as default }
