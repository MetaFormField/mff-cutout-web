/**
 * Soften only the opaque side of sharp alpha transitions. Transparent pixels
 * stay transparent, so original background colors cannot become a new halo.
 */
export function softenAlphaEdges(pixels: Uint8ClampedArray, width: number, height: number): boolean {
  const alpha = new Uint8Array(width * height)
  for (let i = 0; i < alpha.length; i += 1) alpha[i] = pixels[i * 4 + 3]
  let changed = false
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const i = y * width + x
      const center = alpha[i]
      if (center < 64) continue
      const left = alpha[i - 1]
      const right = alpha[i + 1]
      const up = alpha[i - width]
      const down = alpha[i + width]
      if (Math.min(left, right, up, down) >= center - 40) continue
      const average = Math.round((
        center * 4 + (left + right + up + down) * 2 +
        alpha[i - width - 1] + alpha[i - width + 1] +
        alpha[i + width - 1] + alpha[i + width + 1]
      ) / 16)
      const next = Math.max(center - 32, Math.min(center, average))
      if (next !== center) {
        pixels[i * 4 + 3] = next
        changed = true
      }
    }
  }
  return changed
}

/**
 * The AI mask remains authoritative. For a highly uniform, saturated
 * background that it has already removed at the image border, remove matching
 * pixels left inside enclosed gaps. Neutral backgrounds are skipped because
 * matching whites/blacks are common foreground colors.
 */
export function clearUniformBackdrop(
  source: Uint8ClampedArray,
  result: Uint8ClampedArray,
  width: number,
  height: number,
): boolean {
  const samples: number[] = []
  const add = (x: number, y: number) => {
    const offset = (y * width + x) * 4
    if (result[offset + 3] < 8) samples.push(source[offset], source[offset + 1], source[offset + 2])
  }
  for (let x = 0; x < width; x += 16) { add(x, 0); add(x, height - 1) }
  for (let y = 0; y < height; y += 16) { add(0, y); add(width - 1, y) }
  const count = samples.length / 3
  if (count < 64) return false
  let red = 0, green = 0, blue = 0
  for (let i = 0; i < samples.length; i += 3) {
    red += samples[i]
    green += samples[i + 1]
    blue += samples[i + 2]
  }
  red /= count
  green /= count
  blue /= count
  if (Math.max(red, green, blue) - Math.min(red, green, blue) < 100) return false
  let matching = 0
  for (let i = 0; i < samples.length; i += 3) {
    if (Math.abs(samples[i] - red) <= 40 &&
        Math.abs(samples[i + 1] - green) <= 40 &&
        Math.abs(samples[i + 2] - blue) <= 40) matching += 1
  }
  if (matching / count < .9) return false
  let changed = false
  for (let i = 0; i < result.length; i += 4) {
    if (result[i + 3] === 0) continue
    if (Math.abs(source[i] - red) <= 40 &&
        Math.abs(source[i + 1] - green) <= 40 &&
        Math.abs(source[i + 2] - blue) <= 40) {
      result[i + 3] = 0
      changed = true
    }
  }
  return changed
}

export async function refineCutoutEdges(
  blob: Blob,
  source: Blob,
  width: number,
  height: number,
  signal: AbortSignal,
): Promise<Blob> {
  // Large canvases can exhaust mobile memory; keep the AI result untouched there.
  if (width * height > 8_000_000 || signal.aborted) return blob
  let bitmap: ImageBitmap | undefined
  let sourceBitmap: ImageBitmap | undefined
  let canvas: HTMLCanvasElement | undefined
  let sourceCanvas: HTMLCanvasElement | undefined
  try {
    bitmap = await createImageBitmap(blob)
    if (signal.aborted) return blob
    canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (!context) return blob
    context.drawImage(bitmap, 0, 0)
    const image = context.getImageData(0, 0, width, height)
    let changed = false
    const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory
    if (!/iPhone|iPad|iPod/i.test(navigator.userAgent) &&
        (memory === undefined || memory >= 4)) {
      sourceBitmap = await createImageBitmap(source)
      if (signal.aborted) return blob
      if (sourceBitmap.width === width && sourceBitmap.height === height) {
        sourceCanvas = document.createElement('canvas')
        sourceCanvas.width = width
        sourceCanvas.height = height
        const sourceContext = sourceCanvas.getContext('2d', { willReadFrequently: true })
        if (sourceContext) {
          sourceContext.drawImage(sourceBitmap, 0, 0)
          changed = clearUniformBackdrop(sourceContext.getImageData(0, 0, width, height).data, image.data, width, height)
        }
      }
    }
    changed = softenAlphaEdges(image.data, width, height) || changed
    if (!changed) return blob
    if (signal.aborted) return blob
    context.putImageData(image, 0, 0)
    const refined = await new Promise<Blob | null>((resolve) => canvas!.toBlob(resolve, 'image/png'))
    return signal.aborted ? blob : refined ?? blob
  } catch {
    // Refinement is optional. Never lose a valid AI result on a constrained device.
    return blob
  } finally {
    bitmap?.close()
    sourceBitmap?.close()
    if (canvas) canvas.width = canvas.height = 0
    if (sourceCanvas) sourceCanvas.width = sourceCanvas.height = 0
  }
}
