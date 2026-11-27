import { afterEach, expect, it, vi } from 'vitest'
import { installModelTransport, MODEL_PREFIX } from './model-transport'
import { onRequest } from '../../functions/models/[[path]]'

afterEach(() => vi.unstubAllGlobals())

it('routes pinned weights and config through the website without changing cache URLs', async () => {
  const fetchMock = vi.fn().mockImplementation(async () => new Response('model'))
  vi.stubGlobal('fetch', fetchMock)
  vi.stubGlobal('location', { origin: 'https://mffcutout.pages.dev' })
  installModelTransport()
  await fetch(MODEL_PREFIX + 'onnx/model_fp16.onnx')
  expect(fetchMock.mock.calls[0][0]).toBe('https://mffcutout.pages.dev/models/onnx/model_fp16.onnx')
  await fetch('https://example.com/image.png')
  expect(fetchMock.mock.calls[1][0]).toBe('https://example.com/image.png')
})

it('retries a failed endpoint and rejects HTML masquerading as a model', async () => {
  const fetchMock = vi.fn().mockResolvedValueOnce(new Response('<html>', { headers: { 'content-type': 'text/html' } }))
    .mockResolvedValueOnce(new Response('model'))
  vi.stubGlobal('fetch', fetchMock)
  vi.stubGlobal('location', { origin: 'https://mffcutout.pages.dev' })
  installModelTransport()
  expect(await (await fetch(MODEL_PREFIX + 'config.json')).text()).toBe('model')
  expect(fetchMock).toHaveBeenCalledTimes(2)
})

it('does not retry cancelled downloads', async () => {
  const fetchMock = vi.fn()
  vi.stubGlobal('fetch', fetchMock)
  vi.stubGlobal('location', { origin: 'https://mffcutout.pages.dev' })
  installModelTransport()
  const controller = new AbortController()
  controller.abort()
  await expect(fetch(MODEL_PREFIX + 'config.json', { signal: controller.signal })).rejects.toThrow()
  expect(fetchMock).not.toHaveBeenCalled()
})

it('model endpoint refuses uploads and arbitrary paths', async () => {
  const fetchMock = vi.fn()
  vi.stubGlobal('fetch', fetchMock)
  expect((await onRequest({ request: new Request('https://site/models/config.json', { method: 'POST', body: 'image' }) })).status).toBe(405)
  expect((await onRequest({ request: new Request('https://site/models/unknown') })).status).toBe(404)
  expect(fetchMock).not.toHaveBeenCalled()
})

it('streams model data with pinned upstream and preserves byte length', async () => {
  const fetchMock = vi.fn().mockResolvedValue(new Response('weights', { headers: { 'content-length': '7' } }))
  vi.stubGlobal('fetch', fetchMock)
  const response = await onRequest({ request: new Request('https://site/models/onnx/model.onnx') })
  expect(fetchMock.mock.calls[0][0]).toBe(MODEL_PREFIX + 'onnx/model.onnx')
  expect(await response.text()).toBe('weights')
  expect(response.headers.get('content-length')).toBe('7')
})
