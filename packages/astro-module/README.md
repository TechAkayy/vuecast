# @vuecast/astro-module

Write Vue SFC Pages (`.vue` pages) in your Astro projects.

## Features

- Use `.vue` files as pages in your Astro project
- Full Vue SFC support with all Vue features
- Seamless integration with Astro's build system
- Ensures proper head rendering support

## Prerequisites

First, scaffold a new Astro project:

```bash
npm create astro@latest
```

Install the official Astro Vue integration:

```bash
npx astro add vue
```

## Installation

```bash
pnpm add @vuecast/astro-module
# or
npm install @vuecast/astro-module
# or
yarn add @vuecast/astro-module
```

## Usage

1. Add the integration to your `astro.config.mjs`. Note that `@vuecast/astro-module` must be added after the Vue integration:

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

2. Create `.vue` files in your `src/pages` directory:

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

## How it Works

The integration:

1. Registers `.vue` as a valid page extension in Astro
2. Sets up the Vue renderer for processing `.vue` files
3. Ensures proper head rendering support for Vue components
4. Integrates with Astro's build system through Vite

## License

MIT
