import type { AstroIntegration, HookParameters, Plugin, VuecastAstroPluginOptions } from './types'

type SetupHookParams = HookParameters<'astro:config:setup'> & {
  // `addPageExtension` and `contentEntryType` are not a public APIs, add type defs here
  addPageExtension: (extension: string) => void;
};

function vuecastAstroIntegration(options: VuecastAstroPluginOptions): AstroIntegration {
  return {
    name: '@vuecast/astro',
    hooks: {
      'astro:config:setup': async (params) => {
        const { updateConfig, addPageExtension, addRenderer } = params as SetupHookParams

        addRenderer({
          name: 'vuecast:astro',
          serverEntrypoint: "./node_modules/@astrojs/vue/dist/server.js",
        })

        addPageExtension('.vue');

        updateConfig({
          vite: {
            plugins: [{
              name: 'vuecast-post',
              async transform(code, id) {
                if (!id.endsWith('.vue')) return
                const regex = /(\]\))(;?\n?)$/
                const replacement =
                  ",[Symbol.for('astro.needsHeadRendering'),true]$1"

                code = code.replace(regex, replacement)
                return code
              },
            }],
          },
        });
      }
    }
  }
}

export { vuecastAstroIntegration as default, vuecastAstroIntegration as VuecastAstro }
