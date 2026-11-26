import { describe, expect, it } from 'vitest'
import { defaultImageName, pngName } from './export-image'

describe('PNG export names', () => {
  it('keeps the source name and applies the default suffix', () => {
    expect(pngName('', defaultImageName('照片.版本一.jpeg'))).toBe('照片.版本一-mff-cutout.png')
    expect(pngName('', defaultImageName(`${'照片'.repeat(45)}.jpeg`))).toMatch(/-mff-cutout\.png$/)
  })

  it('removes path characters and packaging extensions, and handles reserved names', () => {
    expect(pngName('  商品:/图?.PNG.ZIP ', '')).toBe('商品__图_.png')
    expect(pngName('CON.png', '')).toBe('_CON.png')
    expect(pngName('...', '')).toBe('mff-cutout.png')
    expect(new TextEncoder().encode(pngName('🍎'.repeat(80), '')).byteLength).toBeLessThan(255)
  })
})
