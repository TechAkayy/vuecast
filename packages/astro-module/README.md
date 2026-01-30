# `@vuecast/astro-module` (for Vue-SFC lovers)

Write Vue-template syntax inside `.astro` files in your Astro projects instead of Astro's JSX syntax.

## Features

- Use Vue-template syntax inside `.astro` files
- Supports common Vue template features like `v-if`, `v-for`, `:bind`, and `{{ ... }}`
- Seamless integration with Astro's build system
- Keeps Astro frontmatter intact

## Prerequisites

First, scaffold a new Astro project:

```bash
npm create astro@latest # or pnpm, bun
```

You do not need the Astro Vue integration unless you plan to use Vue components or `.vue` files in your project. See the [Astro Vue integration guide](https://docs.astro.build/en/guides/integrations-guide/vue/).

## Installation

```bash
npm install @vuecast/astro-module
# or pnpm add @vuecast/astro-module
# or bun add @vuecast/astro-module
```

## Usage

1. Add the integration to your `astro.config.mjs`:

```js
import { defineConfig } from "astro/config";
import vuecast from "@vuecast/astro-module";

export default defineConfig({
  integrations: [vuecast()],
});
```

2. Create `.astro` files in your `src/pages` directory and use Vue-template syntax below the frontmatter:

```astro
<!-- src/pages/index.astro -->
---
const isLoggedIn = true;
const fruits = ["apples", "oranges", "bananas", "cherries", "grapes"];
---

<div>
  <p v-if="isLoggedIn">Welcome back!</p>
  <h1>Hello from VueCast!</h1>
  <ul>
    <li v-for="(fruit, index) in fruits" :key="index" :data-name="fruit">
      {{ index + 1 }}: {{ fruit }}
    </li>
  </ul>
</div>
```

Transformed output (Astro JSX-style):

```astro
<div>
  {isLoggedIn ? (<p>Welcome back!</p>) : null}
  <h1>Hello from VueCast!</h1>
  <ul>
    {fruits.map((fruit, index) => (
      <li key={index} data-name={fruit}>
        {index + 1}: {fruit}
      </li>
    ))}
  </ul>
</div>
```

Notes:

- Supported directives: `v-if`, `v-for`, `:bind`, and `{{ ... }}` interpolation.
- `@click` (and other event handlers) are not executed in plain Astro HTML. They only work inside hydrated islands; the transform preserves them as data attributes (e.g. `data-on-click`) for later use.

## How it Works

The integration:

1. Detects Vue-template syntax inside `.astro` files
2. Converts Vue template syntax to Astro/JSX-compatible syntax
3. Keeps frontmatter unchanged
4. Integrates with Astro's build system through Vite

## License

MIT
