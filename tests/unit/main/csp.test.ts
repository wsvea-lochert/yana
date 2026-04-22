import { describe, it, expect } from 'vitest'
import { buildCspHeader } from '@main/security/csp'

describe('buildCspHeader', () => {
  describe('production', () => {
    const csp = buildCspHeader({ dev: false })

    it('restricts default-src to self', () => {
      expect(csp).toContain("default-src 'self'")
    })

    it('restricts script-src to self only (no eval/inline)', () => {
      expect(csp).toContain("script-src 'self'")
      expect(csp).not.toContain("'unsafe-eval'")
    })

    it('disallows object-src', () => {
      expect(csp).toContain("object-src 'none'")
    })

    it('sets frame-ancestors none', () => {
      expect(csp).toContain("frame-ancestors 'none'")
    })

    it('locks base-uri to self', () => {
      expect(csp).toContain("base-uri 'self'")
    })
  })

  describe('development', () => {
    const csp = buildCspHeader({ dev: true })

    it('permits unsafe-eval for HMR', () => {
      expect(csp).toContain("'unsafe-eval'")
    })

    it('permits ws:/wss: for HMR socket', () => {
      expect(csp).toMatch(/connect-src[^;]*ws:/)
      expect(csp).toMatch(/connect-src[^;]*wss:/)
    })

    it('still sets object-src none', () => {
      expect(csp).toContain("object-src 'none'")
    })
  })
})
