import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

function r(p: string) {
  return resolve(fileURLToPath(new URL('.', import.meta.url)), p)
}

type Key = 'astro'

export const alias: Record<Key, Record<string, string>> = {
  astro: {
    '@vuecast/astro-module': r('./packages/astro-module/src'),
  }
}
