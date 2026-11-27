// Keep BG0's original cache keys; route only the pinned public model files.
export const MODEL_PREFIX = 'https://huggingface.co/studioludens/birefnet-lite-512/resolve/4a3c40c36c94093cc1e724d9ea428b8fa4b57dc7/'
export const MODEL_FILES = ['config.json', 'preprocessor_config.json', 'onnx/model.onnx', 'onnx/model_fp16.onnx']

export function installModelTransport() {
  const originalFetch = globalThis.fetch.bind(globalThis)
  globalThis.fetch = async (input, init) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
    const file = url.startsWith(MODEL_PREFIX) ? url.slice(MODEL_PREFIX.length).split('?')[0] : ''
    if (!MODEL_FILES.includes(file)) return originalFetch(input, init)
    const request = new Request(input, init)
    if (request.method !== 'GET' && request.method !== 'HEAD') return originalFetch(input, init)
    const local = new URL(`/models/${file}`, location.origin)
    // The same-origin endpoint is deployed by Pages Functions. Dev previews
    // without Functions retain the upstream source as a fallback.
    let lastError: unknown
    for (const target of [local.href, local.href, url]) {
      request.signal.throwIfAborted()
      try {
        const response = await originalFetch(target, {
          method: request.method, signal: request.signal, credentials: 'omit',
        })
        if (response.ok && !response.headers.get('content-type')?.includes('text/html')) return response
        await response.body?.cancel()
        lastError = new Error(`HTTP ${response.status}`)
      } catch (error) {
        request.signal.throwIfAborted()
        lastError = error
      }
    }
    throw new Error('模型下载连接失败，请稍后重试。图片不会上传到服务器。', { cause: lastError })
  }
}
