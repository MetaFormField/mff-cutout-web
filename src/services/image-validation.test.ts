import { describe, expect, it, vi } from 'vitest'
import { MAX_FILE_BYTES, validateImageFile } from './image-validation'

describe('validateImageFile', () => {
  it('rejects unsupported formats', async () => {
    const file = new File(['x'], 'image.webp', { type: 'image/webp' })
    await expect(validateImageFile(file)).rejects.toThrow('仅支持 JPG、JPEG、PNG 图片')
  })

  it('rejects files over 15 MB before decoding', async () => {
    const file = new File([new Uint8Array(MAX_FILE_BYTES + 1)], 'large.png', { type: 'image/png' })
    await expect(validateImageFile(file)).rejects.toThrow('图片超过 15 MB')
  })

  it('accepts a decodable image within limits', async () => {
    const close = vi.fn()
    vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue({ width: 1200, height: 800, close }))
    const file = new File(['png'], 'ok.png', { type: 'image/png' })
    await expect(validateImageFile(file)).resolves.toEqual({ width: 1200, height: 800, pixels: 960000 })
    expect(close).toHaveBeenCalled()
    vi.unstubAllGlobals()
  })
})
