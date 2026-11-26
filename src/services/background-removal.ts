import {
  BackgroundRemovalError,
  getBrowserCapabilities,
  removeBackground,
  type BackgroundRemovalResult,
  type RemovalProgress,
} from '@bg0/browser'
import { refineCutoutEdges } from './edge-refinement'

export type { BackgroundRemovalResult, RemovalProgress }

export interface DeviceReport {
  webgpu: boolean
  wasm: boolean
  iosLimited: boolean
  memoryGb?: number
  cores: number
}

type NavigatorWithMemory = Navigator & { deviceMemory?: number }

export function getDeviceReport(): DeviceReport {
  const capabilities = getBrowserCapabilities()
  const nav = navigator as NavigatorWithMemory
  return {
    ...capabilities,
    iosLimited: isIosLikeBrowser(navigator.userAgent, navigator.maxTouchPoints),
    memoryGb: nav.deviceMemory,
    cores: navigator.hardwareConcurrency || 0,
  }
}

export function isIosLikeBrowser(userAgent: string, maxTouchPoints: number): boolean {
  return /iPhone|iPad|iPod/i.test(userAgent) || (/Macintosh/i.test(userAgent) && maxTouchPoints > 1)
}

async function resizeForIos(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  try {
    const longest = Math.max(bitmap.width, bitmap.height)
    if (longest <= 1280) return file
    const scale = 1280 / longest
    const width = Math.max(1, Math.round(bitmap.width * scale))
    const height = Math.max(1, Math.round(bitmap.height * scale))
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    try {
      const context = canvas.getContext('2d')
      if (!context) throw new Error('Canvas 2D is unavailable')
      context.drawImage(bitmap, 0, 0, width, height)
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
      if (!blob) throw new Error('iOS image resize failed')
      return blob
    } finally {
      canvas.width = 0
      canvas.height = 0
    }
  } finally {
    bitmap.close()
  }
}

export async function processImage(
  file: File,
  signal: AbortSignal,
  onProgress: (progress: RemovalProgress) => void,
): Promise<BackgroundRemovalResult> {
  const input = isIosLikeBrowser(navigator.userAgent, navigator.maxTouchPoints)
    ? await resizeForIos(file)
    : file
  if (signal.aborted) throw new DOMException('Processing was cancelled', 'AbortError')
  const removal = removeBackground(input, {
    quality: 'quality',
    signal,
    onProgress: (progress) => onProgress(progress.stage === 'finishing' && progress.progress === 1
      ? { ...progress, progress: 0.96, message: '正在优化透明边缘…' }
      : progress),
  })
  if (signal.aborted) throw new DOMException('Processing was cancelled', 'AbortError')
  const output = await new Promise<BackgroundRemovalResult>((resolve, reject) => {
    const onAbort = () => reject(new DOMException('Processing was cancelled', 'AbortError'))
    signal.addEventListener('abort', onAbort, { once: true })
    removal.then(resolve, reject).finally(() => signal.removeEventListener('abort', onAbort))
  })
  if (signal.aborted) throw new DOMException('Processing was cancelled', 'AbortError')
  const blob = await refineCutoutEdges(output.blob, input, output.width, output.height, signal)
  if (signal.aborted) throw new DOMException('Processing was cancelled', 'AbortError')
  onProgress({ stage: 'finishing', progress: 1, message: '抠图完成' })
  return { ...output, blob }
}

const ERROR_MESSAGES: Record<string, string> = {
  'unsupported-image': '图片格式不受支持，请使用 JPG、JPEG 或 PNG。',
  'image-too-large': '图片过大，当前设备无法安全处理。',
  'decode-failed': '图片解码失败，请确认文件未损坏。',
  'model-load-failed': 'AI 模型加载失败，请检查网络后重试。首次使用需要下载模型。',
  'out-of-memory': '浏览器内存不足，请关闭其他标签页或换用更小的图片。',
  'inference-failed': '本地 AI 推理失败，请重试或换用较小的图片。',
  cancelled: '处理已取消。',
}

export function describeProcessingError(error: unknown): string {
  if (error instanceof BackgroundRemovalError) return ERROR_MESSAGES[error.code] ?? '处理失败，请重试。'
  if (error instanceof DOMException && error.name === 'AbortError') return ERROR_MESSAGES.cancelled
  return '处理失败，请重试或换用较小的图片。'
}
