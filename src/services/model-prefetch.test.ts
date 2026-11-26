import { afterEach, expect, it, vi } from 'vitest'

vi.mock('@bg0/browser', () => ({
  getBrowserCapabilities: () => ({ webgpu: false, wasm: true }),
}))

import { hasCachedModel, prefetchModel } from './model-prefetch'

afterEach(() => vi.unstubAllGlobals())

it('skips downloading when the model is already cached', async () => {
  const match = vi.fn().mockResolvedValue(new Response('cached'))
  const open = vi.fn().mockResolvedValue({ match, put: vi.fn() })
  vi.stubGlobal('window', { caches: { open } })
  vi.stubGlobal('caches', { open })
  vi.stubGlobal('navigator', { userAgent: 'test', maxTouchPoints: 0 })
  const fetchMock = vi.fn()
  vi.stubGlobal('fetch', fetchMock)

  expect(await hasCachedModel()).toBe(true)
  await prefetchModel(new AbortController().signal, () => undefined)
  expect(fetchMock).not.toHaveBeenCalled()
})

it('stores a streamed model under the same URL that BG0 checks', async () => {
  const put = vi.fn(async (_url: string, response: Response) => {
    expect(await response.text()).toBe('model-data')
  })
  const open = vi.fn().mockResolvedValue({ match: vi.fn().mockResolvedValue(undefined), put })
  vi.stubGlobal('window', { caches: { open } })
  vi.stubGlobal('caches', { open })
  vi.stubGlobal('navigator', { userAgent: 'test', maxTouchPoints: 0 })
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('model-data', { headers: { 'content-length': '10' } })))
  const progress = vi.fn()

  await prefetchModel(new AbortController().signal, progress)
  expect(put).toHaveBeenCalledOnce()
  expect(put.mock.calls[0][0]).toContain('/onnx/model.onnx')
  expect(progress).toHaveBeenCalledWith(10, 10)
})
