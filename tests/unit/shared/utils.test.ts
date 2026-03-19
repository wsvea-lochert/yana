import { describe, it, expect } from 'vitest'
import { titleToSlug } from '@shared/utils/slug'
import { toISOString, formatDate, formatRelativeDate } from '@shared/utils/date'

describe('titleToSlug', () => {
  it('converts simple title', () => {
    expect(titleToSlug('Hello World')).toBe('hello-world')
  })

  it('handles special characters', () => {
    expect(titleToSlug("What's New in 2026?")).toBe('whats-new-in-2026')
  })

  it('collapses multiple spaces', () => {
    expect(titleToSlug('Hello   World')).toBe('hello-world')
  })

  it('trims leading and trailing hyphens', () => {
    expect(titleToSlug(' -Hello World- ')).toBe('hello-world')
  })

  it('handles empty string', () => {
    expect(titleToSlug('')).toBe('')
  })

  it('handles unicode', () => {
    expect(titleToSlug('Café Notes')).toBe('caf-notes')
  })

  it('converts underscores to hyphens', () => {
    expect(titleToSlug('hello_world_note')).toBe('hello-world-note')
  })

  it('collapses multiple hyphens', () => {
    expect(titleToSlug('hello---world')).toBe('hello-world')
  })
})

describe('toISOString', () => {
  it('returns ISO string for given date', () => {
    const date = new Date('2026-03-19T12:00:00.000Z')
    expect(toISOString(date)).toBe('2026-03-19T12:00:00.000Z')
  })

  it('returns current time when no date given', () => {
    const result = toISOString()
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
  })
})

describe('formatDate', () => {
  it('formats date string', () => {
    const result = formatDate('2026-03-19T12:00:00.000Z')
    expect(result).toContain('2026')
    expect(result).toContain('Mar')
    expect(result).toContain('19')
  })
})

describe('formatRelativeDate', () => {
  it('returns "just now" for recent times', () => {
    const now = new Date()
    expect(formatRelativeDate(now.toISOString())).toBe('just now')
  })

  it('returns minutes ago', () => {
    const date = new Date(Date.now() - 5 * 60000)
    expect(formatRelativeDate(date.toISOString())).toBe('5m ago')
  })

  it('returns hours ago', () => {
    const date = new Date(Date.now() - 3 * 3600000)
    expect(formatRelativeDate(date.toISOString())).toBe('3h ago')
  })

  it('returns days ago', () => {
    const date = new Date(Date.now() - 2 * 86400000)
    expect(formatRelativeDate(date.toISOString())).toBe('2d ago')
  })

  it('returns formatted date for old dates', () => {
    const date = new Date(Date.now() - 30 * 86400000)
    const result = formatRelativeDate(date.toISOString())
    expect(result).toContain('202')
  })
})
