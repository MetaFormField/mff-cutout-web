export const MAX_FILE_BYTES = 15 * 1024 * 1024
export const MAX_PIXELS = 20_000_000
export const ACCEPTED_TYPES = new Set(['image/jpeg', 'image/png'])

export interface ImageInfo {
  width: number
  height: number
  pixels: number
}

export class ImageValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ImageValidationError'
  }
}

function hasAllowedExtension(name: string): boolean {
  return /\.(jpe?g|png)$/i.test(name)
}

export async function validateImageFile(file: File): Promise<ImageInfo> {
  if (!ACCEPTED_TYPES.has(file.type) || !hasAllowedExtension(file.name)) {
    throw new ImageValidationError('仅支持 JPG、JPEG、PNG 图片。')
  }
  if (file.size === 0) throw new ImageValidationError('图片文件为空，请重新选择。')
  if (file.size > MAX_FILE_BYTES) throw new ImageValidationError('图片超过 15 MB，请压缩后重试。')

  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    throw new ImageValidationError('图片无法解码，文件可能已损坏或格式不正确。')
  }

  try {
    const pixels = bitmap.width * bitmap.height
    if (!bitmap.width || !bitmap.height) throw new ImageValidationError('图片尺寸无效。')
    if (pixels > MAX_PIXELS) throw new ImageValidationError('图片超过 2000 万像素，请缩小尺寸后重试。')
    return { width: bitmap.width, height: bitmap.height, pixels }
  } finally {
    bitmap.close()
  }
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}
