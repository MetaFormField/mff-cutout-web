import { beforeEach, describe, expect, it, vi } from 'vitest'

const { removeBackgroundMock } = vi.hoisted(() => ({
  removeBackgroundMock: vi.fn(() => new Promise(() => undefined)),
}))

vi.mock('@bg0/browser', () => ({
  BackgroundRemovalError: class BackgroundRemovalError extends Error {},
  getBrowserCapabilities: () => ({ webgpu: false, wasm: true }),
  removeBackground: removeBackgroundMock,
}))

import { isIosLikeBrowser, processImage } from './background-removal'

describe('background removal service', () => {
  beforeEach(() => {
    removeBackgroundMock.mockClear()
  })

  it('settles immediately when the caller cancels a running task', async () => {
    const controller = new AbortController()
    const file = new File(['image'], 'photo.jpg', { type: 'image/jpeg' })
    const task = processImage(file, controller.signal, vi.fn())
    controller.abort()
    await expect(task).rejects.toMatchObject({ name: 'AbortError' })
    expect(removeBackgroundMock).toHaveBeenCalledOnce()
  })

  it('detects iPhone, iPad, and touch-mode iPadOS', () => {
    expect(isIosLikeBrowser('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0)', 5)).toBe(true)
    expect(isIosLikeBrowser('Mozilla/5.0 (Macintosh; Intel Mac OS X)', 5)).toBe(true)
    expect(isIosLikeBrowser('Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 0)).toBe(false)
  })
})
