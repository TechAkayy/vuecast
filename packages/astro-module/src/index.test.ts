import { describe, it, expect } from 'vitest'
import vuecastAstro from './index'

describe('@vuecast/astro-module', () => {
  it('should export a function', () => {
    expect(typeof vuecastAstro).toBe('function')
  })

  it('should return an integration object', () => {
    const integration = vuecastAstro({})
    expect(integration).toBeDefined()
    expect(integration.name).toBe('@vuecast/astro-module')
  })
})
