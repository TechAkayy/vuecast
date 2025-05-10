# Contributing to VueCast

Thank you for your interest in contributing to VueCast! This document provides guidelines and instructions for contributing to the project.

## Development Setup

1. Clone the repository:

```bash
git clone https://github.com/techakayy/vuecast.git
cd vuecast
```

2. Install dependencies:

```bash
pnpm install
```

3. Build all packages:

```bash
pnpm build
```

4. Start development servers:

```bash
# Start the Tailwind playground
pnpm play-tailwind

# Start the Vuetify playground
pnpm play-vuetify
```

## Project Structure

```
vuecast/
├── packages/
│   └── astro-module/     # Astro integration
│       ├── src/          # Source code
│       ├── dist/         # Build output
│       └── package.json  # Package configuration
├── playground/
│   ├── astro-tailwind/   # Tailwind playground
│   └── astro-vuetify/    # Vuetify playground
├── package.json          # Root package configuration
└── pnpm-workspace.yaml   # Workspace configuration
```

## Understanding the Astro Integration

The Astro integration (`@vuecast/astro-module`) works by:

1. Registering `.vue` as a valid page extension using Astro's `addPageExtension` API
2. Setting up the Vue renderer for processing `.vue` files
3. Ensuring proper head rendering support through a Vite plugin
4. Integrating with Astro's build system

Key implementation details:

- Uses Astro's integration API to hook into the build process
- Leverages `@astrojs/vue` for Vue component rendering
- Adds a Vite plugin to handle head rendering requirements
- Maintains compatibility with Astro's page routing system

## Adding a New Integration

To add support for a new meta-framework:

1. Create a new package in the `packages` directory:

```bash
mkdir -p packages/new-framework/src
```

2. Create a `package.json` for the new package:

```json
{
  "name": "@vuecast/new-framework",
  "version": "1.0.0",
  "type": "module",
  "main": "./dist/index.mjs",
  "types": "./dist/index.d.mts",
  "files": ["dist"],
  "scripts": {
    "build": "unbuild",
    "dev": "unbuild --stub",
    "test": "vitest"
  },
  "dependencies": {
    "@vue/compiler-sfc": "^3.4.0",
    "vue": "^3.4.0"
  },
  "peerDependencies": {
    "new-framework": "^x.x.x"
  }
}
```

3. Implement the integration in `src/index.ts`

4. Add a playground for testing in the `playground` directory

5. Update the root README.md to document the new integration

## Testing

Each package should include tests for its functionality. We use Vitest for testing:

```bash
# Run tests for all packages
pnpm test

# Run tests for a specific package
cd packages/astro-module
pnpm test
```

## Pull Requests

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

## Code Style

- Use TypeScript
- Follow the project's ESLint configuration
- Write meaningful commit messages
- Include tests for new features
- Update documentation as needed

## License

By contributing to VueCast, you agree that your contributions will be licensed under the project's MIT License.
