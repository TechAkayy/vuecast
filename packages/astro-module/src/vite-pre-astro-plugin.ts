import { vueTemplateAstroTransform } from "./vue-template-to-astro";

export function vueTemplatePreAstroPlugin() {
  return {
    name: "vuecast-vue-template-pre-astro",
    enforce: "pre" as const,
    configResolved(config) {
      const plugins = config.plugins;
      const idx = plugins.findIndex(
        (p) => p && typeof p === "object" && "name" in p && p.name === "vuecast-vue-template-pre-astro"
      );
      if (idx > 0) {
        const [self] = plugins.splice(idx, 1);
        plugins.unshift(self);
      }
    },

    async transform(code: string, id: string) {
      const [filepath] = id.split("?");
      if (!filepath.endsWith(".astro")) return null;

      const res = vueTemplateAstroTransform(code, filepath);
      return res ? res.code : null;
    },
  };
}
