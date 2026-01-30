import { defineConfig } from "astro/config";
import VuecastAstro from "@vuecast/astro-module";
import Pinegrow from "@pinegrow/astro-module";

import vue from "@astrojs/vue";

export default defineConfig({
  integrations: [
    VuecastAstro(),
    Pinegrow({
      liveDesigner: {
        experimental: {
          designableFileTypes: [".astro"],
        },
        startupPage: "src/pages/index.astro",
        tailwindcss: {
          /* Please ensure that you update the filenames and paths to accurately match those used in your project. */
          configPath: "tailwind.config.ts",
          cssPath: "assets/css/tailwind.css",
          // themePath: false, // Set to false so that Design Panel is not used
          // restartOnConfigUpdate: true,
          restartOnThemeUpdate: true,
        },
        //...
      },
    }),
    vue(),
  ],
});
