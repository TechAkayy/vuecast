import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

import vue from "@astrojs/vue";
import { VuecastAstro } from "@vuecast/astro-module";

export default defineConfig({
  integrations: [vue(), VuecastAstro()],
  vite: {
    plugins: [tailwindcss()],
  },
});
