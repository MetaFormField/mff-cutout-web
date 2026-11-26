import { getBrowserCapabilities } from '@bg0/browser'
import { isIosLikeBrowser } from './background-removal'

const revision = '4a3c40c36c94093cc1e724d9ea428b8fa4b57dc7'
const base = `https://huggingface.co/studioludens/birefnet-lite-512/resolve/${revision}/onnx/`
const cacheName = 'transformers-cache'

export function modelUrl() {
  const ios = isIosLikeBrowser(navigator.userAgent, navigator.maxTouchPoints)
  const failedGpu = (() => {
    try { return localStorage.getItem(`bg0:webgpu-failure:${revision}`) === navigator.userAgent }
    catch { return false }
  })()
  const gpu = getBrowserCapabilities().webgpu && !ios && !failedGpu
  return `${base}${gpu ? 'model_fp16.onnx' : 'model.onnx'}`
}

export async function hasCachedModel(): Promise<boolean> {
  if (!('caches' in window)) return false
  return Boolean(await (await caches.open(cacheName)).match(modelUrl()))
}

export async function prefetchModel(signal: AbortSignal, onProgress: (loaded: number, total: number | null) => void) {
  if (!('caches' in window)) throw new Error('当前浏览器不支持模型预缓存，请上传图片时下载。')
  const cache = await caches.open(cacheName)
  const url = modelUrl()
  if (await cache.match(url)) return
  const response = await fetch(url, { signal })
  if (!response.ok || !response.body) throw new Error('模型下载失败，请检查网络后重试。')
  const totalHeader = Number(response.headers.get('content-length'))
  const total = Number.isFinite(totalHeader) && totalHeader > 0 ? totalHeader : null
  let loaded = 0
  const stream = response.body.pipeThrough(new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      loaded += chunk.byteLength
      onProgress(loaded, total)
      controller.enqueue(chunk)
    },
  }))
  await cache.put(url, new Response(stream, { headers: response.headers, status: response.status }))
}
