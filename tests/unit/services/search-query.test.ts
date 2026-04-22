import { describe, it, expect } from 'vitest'
import { escapeFtsTerm } from '@main/services/search-query'

describe('escapeFtsTerm', () => {
  it('returns empty string for empty input', () => {
    expect(escapeFtsTerm('')).toBe('')
    expect(escapeFtsTerm('   ')).toBe('')
  })

  it('wraps a single token in quotes with prefix', () => {
    expect(escapeFtsTerm('hello')).toBe('"hello"*')
  })

  it('joins multiple tokens, only the last gets prefix', () => {
    expect(escapeFtsTerm('hello world')).toBe('"hello" "world"*')
  })

  it('escapes embedded double-quotes by doubling', () => {
    expect(escapeFtsTerm('a"b')).toBe('"a""b"*')
  })

  it('neutralizes FTS operators (OR, NEAR, AND, NOT)', () => {
    const result = escapeFtsTerm('foo OR bar')
    expect(result).toBe('"foo" "OR" "bar"*')
    expect(result).not.toMatch(/\bOR\b(?!")/)
  })

  it('neutralizes column filters and ^ operator', () => {
    const result = escapeFtsTerm('title:foo ^bar')
    expect(result).toContain('"title:foo"')
    expect(result).toContain('"^bar"*')
  })

  it('drops control characters', () => {
    expect(escapeFtsTerm('foo\u0000bar')).toBe('"foobar"*')
  })

  it('collapses whitespace', () => {
    expect(escapeFtsTerm('foo   bar')).toBe('"foo" "bar"*')
  })

  it('does not lowercase terms (FTS tokenizer handles case)', () => {
    expect(escapeFtsTerm('Hello World')).toBe('"Hello" "World"*')
  })
})
