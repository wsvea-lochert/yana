import { describe, it, expect } from 'vitest'
import { isSafeExternalUrl } from '@main/windows/url-guard'

describe('isSafeExternalUrl', () => {
  it('allows http URLs', () => {
    expect(isSafeExternalUrl('http://example.com')).toBe(true)
  })

  it('allows https URLs', () => {
    expect(isSafeExternalUrl('https://example.com/path?q=1')).toBe(true)
  })

  it('allows mailto', () => {
    expect(isSafeExternalUrl('mailto:hello@example.com')).toBe(true)
  })

  it('rejects javascript: URLs', () => {
    expect(isSafeExternalUrl('javascript:alert(1)')).toBe(false)
  })

  it('rejects file:// URLs', () => {
    expect(isSafeExternalUrl('file:///etc/passwd')).toBe(false)
  })

  it('rejects smb:// URLs', () => {
    expect(isSafeExternalUrl('smb://evil.example/share')).toBe(false)
  })

  it('rejects ms-msdt: URLs', () => {
    expect(isSafeExternalUrl('ms-msdt:?id=PCWDiagnostic')).toBe(false)
  })

  it('rejects data: URLs', () => {
    expect(isSafeExternalUrl('data:text/html,<script>alert(1)</script>')).toBe(false)
  })

  it('rejects malformed URLs', () => {
    expect(isSafeExternalUrl('not a url')).toBe(false)
  })

  it('rejects empty string', () => {
    expect(isSafeExternalUrl('')).toBe(false)
  })

  it('rejects chrome-extension: URLs', () => {
    expect(isSafeExternalUrl('chrome-extension://abc/page')).toBe(false)
  })

  it('is case-insensitive on scheme', () => {
    expect(isSafeExternalUrl('HTTPS://example.com')).toBe(true)
    expect(isSafeExternalUrl('JavaScript:alert(1)')).toBe(false)
  })
})
