import { describe, it, expect } from 'vitest'
import { VuecastAstro } from './index'

describe('@vuecast/astro-module', () => {
  it('should export a function', () => {
    expect(typeof VuecastAstro).toBe('function')
  })

  it('should return an integration object', () => {
    const integration = VuecastAstro({})
    expect(integration).toBeDefined()
    expect(integration.name).toBe('@vuecast/astro-module')
  })
})
