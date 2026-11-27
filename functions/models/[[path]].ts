const BASE = 'https://huggingface.co/studioludens/birefnet-lite-512/resolve/4a3c40c36c94093cc1e724d9ea428b8fa4b57dc7/'
const FILES = new Set(['config.json', 'preprocessor_config.json', 'onnx/model.onnx', 'onnx/model_fp16.onnx'])

// Public, read-only model distribution. Never accepts images or arbitrary URLs.
export async function onRequest({ request }: { request: Request }): Promise<Response> {
  if (!['GET', 'HEAD'].includes(request.method)) return new Response('Method not allowed', { status: 405 })
  const file = new URL(request.url).pathname.slice('/models/'.length)
  if (!FILES.has(file)) return new Response('Not found', { status: 404 })
  try {
    const upstream = await fetch(BASE + file, { method: request.method, redirect: 'follow' })
    if (!upstream.ok) {
      await upstream.body?.cancel()
      return new Response('Model source temporarily unavailable', { status: 502 })
    }
    const headers = new Headers({
      'Content-Type': file.endsWith('.json') ? 'application/json' : 'application/octet-stream',
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
    })
    const length = upstream.headers.get('content-length')
    if (length) headers.set('Content-Length', length)
    // Stream large weights; do not buffer them into Worker memory.
    return new Response(upstream.body, { headers })
  } catch {
    return new Response('Model source temporarily unavailable', { status: 502 })
  }
}
