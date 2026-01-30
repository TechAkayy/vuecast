# VueCast Playground (Astro + Vue-template syntax) for Vue-SFC lovers

This playground showcases the core idea behind `@vuecast/astro-module`: write Vue-template syntax directly inside `.astro` pages instead of Astro's JSX syntax.

If you want Vue components or `.vue` files, install the [Astro Vue integration](https://docs.astro.build/en/guides/integrations-guide/vue/).

## Setup

1. Install dependencies:

```bash
npm install
# or pnpm install
# or bun install
```

2. Start the development server:

```bash
npm run dev
# or pnpm dev
# or bun dev
```

## What This Demonstrates

- Vue-template syntax can be used in `.astro` pages
- Vue directives (like v-for and v-if) work in Astro pages

## What's Inside

- `src/pages/index.astro` - A page that demonstrates Vue-template syntax
- `src/pages/about.astro` - A secondary page using Vue-template syntax
- `astro.config.mjs` - Astro config with `@vuecast/astro-module`

## How It Works

`@vuecast/astro-module` enables Vue-template syntax inside .astro pages by integrating Vue's template compiler into Astro's pipeline. This keeps Astro's routing and build workflow while letting you author pages with Vue's familiar template syntax.
