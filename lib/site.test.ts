import { describe, it, expect } from 'vitest'
import { buildStamp, SITE_URL, CONTENT_UPDATED } from './site'

describe('buildStamp', () => {
  it('prefers a short commit when the deploy came from git', () => {
    expect(buildStamp('9f2c1a8e4b7d6c5a')).toBe('9f2c1a8')
  })

  it('falls back to the build time, because a CLI deploy has no commit', () => {
    const at = new Date('2026-09-10T15:52:00Z')
    expect(buildStamp(undefined, at)).toBe('09-10 15:52')
    expect(buildStamp('', at)).toBe('09-10 15:52')
    expect(buildStamp('   ', at)).toBe('09-10 15:52')
  })

  it('is short enough to read out loud', () => {
    expect(buildStamp('9f2c1a8e4b7d6c5a').length).toBeLessThanOrEqual(12)
    expect(buildStamp(undefined, new Date()).length).toBeLessThanOrEqual(12)
  })
})

describe('site constants', () => {
  it('has no trailing slash, because every use appends its own path', () => {
    expect(SITE_URL.endsWith('/')).toBe(false)
  })

  it('dates the content, not the build', () => {
    expect(CONTENT_UPDATED).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})
