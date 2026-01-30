import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: [
    'src/index',
  ],
  externals: [
    'astro',
    'vite',
    'vue',
    '@astrojs/vue',
  ],
  declaration: true,
  clean: true,
  rollup: {
    emitCJS: false,
    inlineDependencies: true,
  },
  alias: {
    // Add any aliases you need here
  },
  failOnWarn: false, // Useful during development
})
