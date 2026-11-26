import { describe, expect, it } from 'vitest'
import { clearUniformBackdrop, softenAlphaEdges } from './edge-refinement'

describe('AI mask edge refinement', () => {
  it('softens a hard edge without restoring transparent background pixels', () => {
    const width = 5
    const height = 5
    const pixels = new Uint8ClampedArray(width * height * 4)
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) pixels[(y * width + x) * 4 + 3] = x <= 2 ? 255 : 0
    }
    expect(softenAlphaEdges(pixels, width, height)).toBe(true)
    expect(pixels[(2 * width + 2) * 4 + 3]).toBeLessThan(255)
    expect(pixels[(2 * width + 1) * 4 + 3]).toBe(255)
    expect(pixels[(2 * width + 3) * 4 + 3]).toBe(0)
  })

  it('clears a missed blue opening only when the AI already removed a uniform saturated border', () => {
    const width = 512
    const height = 512
    const source = new Uint8ClampedArray(width * height * 4)
    const result = new Uint8ClampedArray(width * height * 4)
    for (let y = 0; y < height; y += 1) for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * 4
      const isRedSubject = x >= 80 && x < 432 && y >= 80 && y < 432 && !(x >= 200 && x < 312 && y >= 200 && y < 312)
      source[i] = isRedSubject ? 220 : 10
      source[i + 1] = isRedSubject ? 25 : 16
      source[i + 2] = isRedSubject ? 30 : 249
      result[i + 3] = x >= 80 && x < 432 && y >= 80 && y < 432 ? 255 : 0
    }
    expect(clearUniformBackdrop(source, result, width, height)).toBe(true)
    expect(result[(256 * width + 256) * 4 + 3]).toBe(0)
    expect(result[(128 * width + 128) * 4 + 3]).toBe(255)
  })
})
