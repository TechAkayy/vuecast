# VueCast

Write Vue Single File Components in any meta-framework (only Astro is supported at the moment).

## Why?

If you're a Vue developer who:

- Loves Vue's SFC format
- Wants to use modern meta-frameworks for their benefits
- Prefers writing `.vue` files over framework-specific formats

VueCast lets you keep writing Vue components while getting the benefits of your chosen meta-framework.

## Packages

### @vuecast/astro-module

Write Vue SFCs (instead of `.astro` pages) in Astro projects. This integration:

- Allows you to use `.vue` files as pages in your Astro project
- Provides full Vue SFC support with all Vue features
- Seamlessly integrates with Astro's build system
- Ensures proper head rendering support

First, scaffold a new Astro project:

```bash
npm create astro@latest
```

Install the official Astro Vue integration:

```bash
npx astro add vue
```

Then, add VueCast to your project:

```bash
pnpm add @vuecast/astro-module
# or
npm install @vuecast/astro-module
# or
yarn add @vuecast/astro-module
```

Configure your `astro.config.mjs`:

```js
import { defineConfig } from "astro/config";
import vue from "@astrojs/vue";
import vuecast from "@vuecast/astro-module";

export default defineConfig({
  integrations: [
    vue(), // Vue integration must come first
    vuecast(), // Then add VueCast
  ],
});
```

Create `.vue` files in your `src/pages` directory:

```vue
<!-- src/pages/index.vue -->
<script setup lang="ts">
const fruits = ["apples", "oranges", "bananas", "cherries", "grapes"];
</script>

<template>
  <div>
    <h1>Hello from VueCast!</h1>
    <ul>
      <li v-for="(fruit, index) in fruits" :key="index">
        {{ index + 1 }}: {{ fruit }}
      </li>
    </ul>
  </div>
</template>

<style scoped>
/* Your component styles here */
</style>
```

More integrations coming soon...

## Development

This is a monorepo managed by pnpm. To get started:

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Start the playground
pnpm play-tailwind
```

See [CONTRIBUTING.md](./CONTRIBUTING.md) for more details.
