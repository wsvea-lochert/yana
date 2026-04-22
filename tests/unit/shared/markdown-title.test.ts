import { describe, it, expect } from 'vitest'
import {
  stripMarkdownTitle,
  extractTitleAndContent
} from '@shared/utils/markdown-title'

describe('stripMarkdownTitle', () => {
  it('strips heading marker', () => {
    expect(stripMarkdownTitle('# Hello')).toBe('Hello')
    expect(stripMarkdownTitle('### Nested')).toBe('Nested')
  })

  it('strips bold wrappers', () => {
    expect(stripMarkdownTitle('**Hello**')).toBe('Hello')
    expect(stripMarkdownTitle('# **Bold Title**')).toBe('Bold Title')
    expect(stripMarkdownTitle('__Hello__')).toBe('Hello')
  })

  it('strips italic wrappers', () => {
    expect(stripMarkdownTitle('*Hello*')).toBe('Hello')
    expect(stripMarkdownTitle('_Hello_')).toBe('Hello')
  })

  it('strips bold+italic combinations', () => {
    expect(stripMarkdownTitle('***Hello***')).toBe('Hello')
    expect(stripMarkdownTitle('___Hello___')).toBe('Hello')
  })

  it('strips strikethrough', () => {
    expect(stripMarkdownTitle('~~Deleted~~')).toBe('Deleted')
  })

  it('strips inline code', () => {
    expect(stripMarkdownTitle('`code`')).toBe('code')
    expect(stripMarkdownTitle('# Run `bun dev`')).toBe('Run bun dev')
  })

  it('strips links, keeping text', () => {
    expect(stripMarkdownTitle('# [Home](https://example.com)')).toBe('Home')
  })

  it('strips images, keeping alt', () => {
    expect(stripMarkdownTitle('# ![logo](/logo.png)')).toBe('logo')
  })

  it('keeps plain text untouched', () => {
    expect(stripMarkdownTitle('Plain title')).toBe('Plain title')
  })

  it('returns Untitled for empty input', () => {
    expect(stripMarkdownTitle('')).toBe('Untitled')
    expect(stripMarkdownTitle('   ')).toBe('Untitled')
  })

  it('handles mixed formatting in one line', () => {
    expect(stripMarkdownTitle('# **Bold** and *italic* and `code`')).toBe(
      'Bold and italic and code'
    )
  })

  it('matches the user-reported case', () => {
    expect(stripMarkdownTitle('**HU Anlegg — Website Plan**')).toBe(
      'HU Anlegg — Website Plan'
    )
  })
})

describe('extractTitleAndContent', () => {
  it('returns title from first line and rest as content', () => {
    const md = '# My Title\n\nSome body text.\nMore.'
    expect(extractTitleAndContent(md)).toEqual({
      title: 'My Title',
      content: 'Some body text.\nMore.'
    })
  })

  it('skips leading blank lines in content', () => {
    const md = '# Title\n\n\n\nBody'
    expect(extractTitleAndContent(md).content).toBe('Body')
  })

  it('strips bold in title', () => {
    const md = '# **Bold Title**\n\nBody'
    expect(extractTitleAndContent(md).title).toBe('Bold Title')
  })

  it('returns Untitled when first line is empty', () => {
    expect(extractTitleAndContent('').title).toBe('Untitled')
  })
})
