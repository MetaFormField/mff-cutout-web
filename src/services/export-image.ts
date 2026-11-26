const MAX_NAME_BYTES = 240

function truncateName(value: string, maxBytes: number) {
  const encoder = new TextEncoder()
  let output = ''
  let bytes = 0
  for (const character of value) {
    bytes += encoder.encode(character).byteLength
    if (bytes > maxBytes) break
    output += character
  }
  return output
}

export function defaultImageName(fileName: string) {
  const suffix = '-mff-cutout'
  const stem = fileName.replace(/\.[^.]+$/, '') || 'mff'
  return `${truncateName(stem, MAX_NAME_BYTES - suffix.length)}${suffix}`
}

export function pngName(value: string, fallback: string) {
  const sanitize = (name: string) => {
    const clean = Array.from(name, (character) =>
      character.charCodeAt(0) < 32 || '<>:"/\\|?*'.includes(character) ? '_' : character,
    ).join('').trim().replace(/(?:\.(?:png|zip))+$/i, '').replace(/^[. ]+|[. ]+$/g, '')
    const limited = truncateName(clean, MAX_NAME_BYTES).replace(/[. ]+$/g, '')
    return /^(con|prn|aux|nul|com[1-9¹²³]|lpt[1-9¹²³])(?:\.|$)/i.test(limited) ? `_${limited}` : limited
  }
  return `${sanitize(value) || sanitize(fallback) || 'mff-cutout'}.png`
}

export async function downloadImage(blob: Blob, name: string, format: 'png' | 'zip') {
  let download = blob
  if (format === 'zip') {
    const { zip } = await import('fflate')
    const png = new Uint8Array(await blob.arrayBuffer())
    const bytes = await new Promise<Uint8Array<ArrayBuffer>>((resolve, reject) => {
      zip({ [name]: png }, { level: 0 }, (error, data) => error ? reject(error) : resolve(new Uint8Array(data)))
    })
    download = new Blob([bytes], { type: 'application/zip' })
  }
  const url = URL.createObjectURL(download)
  const link = document.createElement('a')
  link.href = url
  link.download = format === 'png' ? name : name.replace(/\.png$/, '.zip')
  try {
    document.body.appendChild(link)
    link.click()
  } finally {
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
  }
}
