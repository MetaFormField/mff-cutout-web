import { useRef, useState, type CSSProperties } from 'react'
import type { BackgroundRemovalResult } from '../services/background-removal'
import { defaultImageName, downloadImage, pngName } from '../services/export-image'

interface Props {
  file: File
  sourceUrl: string
  resultUrl: string
  result: BackgroundRemovalResult
  sourceDimensions: string
  resized: boolean
}

const backgrounds = [['checkerboard', '透明'], ['white', '白色'], ['black', '黑色']] as const

export function Workbench({ file, sourceUrl, resultUrl, result, sourceDimensions, resized }: Props) {
  const previewDialog = useRef<HTMLDialogElement>(null)
  const exporting = useRef(false)
  const [comparison, setComparison] = useState(true)
  const [split, setSplit] = useState(50)
  const [background, setBackground] = useState<string>('checkerboard')
  const fallback = defaultImageName(file.name)
  const [name, setName] = useState(fallback)
  const [format, setFormat] = useState<'png' | 'zip'>()
  const [notice, setNotice] = useState('')
  const [exportError, setExportError] = useState(false)

  const download = async (nextFormat: 'png' | 'zip') => {
    if (exporting.current) return
    exporting.current = true
    setNotice('')
    setExportError(false)
    setFormat(nextFormat)
    try {
      await downloadImage(result.blob, pngName(name, fallback), nextFormat)
      setNotice(`已发起 ${nextFormat.toUpperCase()} 下载`)
    } catch {
      setExportError(true)
      setNotice('生成文件失败，请重试。')
    } finally {
      exporting.current = false
      setFormat(undefined)
    }
  }

  const frameStyle = {
    '--image-ratio': result.width / result.height,
    '--split': `${split}%`,
    aspectRatio: `${result.width} / ${result.height}`,
    width: `min(100%, ${result.width}px)`,
  } as CSSProperties

  return (
    <>
      <div className="workbench">
        <section className="preview" aria-label="图片预览">
          <div className="preview-toolbar">
            <div className={`segments${comparison ? '' : ' show-result'}`} role="group" aria-label="预览模式">
              <button aria-pressed={comparison} onClick={() => setComparison(true)}>前后对比</button>
              <button aria-pressed={!comparison} onClick={() => setComparison(false)}>仅看结果</button>
            </div>
            <div className="preview-actions">
              <div className="swatches" role="group" aria-label="预览背景">
                {backgrounds.map(([value, label]) => (
                  <button key={value} title={label} aria-label={`${label}背景`} aria-pressed={background === value} className={`swatch ${value}`} onClick={() => setBackground(value)} />
                ))}
              </div>
              <button className="enlarge-button" onClick={() => previewDialog.current?.showModal()}>
                全屏预览
                <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M7 4H4v3m9-3h3v3M7 16H4v-3m9 3h3v-3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
            </div>
          </div>
          <div className="stage">
            <div className={`image-frame ${background}`} style={frameStyle}>
              <img className="image-layer" src={resultUrl} alt="AI 抠图结果" draggable={false} />
              {comparison && <>
                <div className="image-layer original-layer"><img className="image-layer" src={sourceUrl} alt="原始图片" draggable={false} /></div>
                <span className="compare-tag before" aria-hidden="true">原图</span>
                <span className="compare-tag after" aria-hidden="true">抠图</span>
                <span className="split-line" aria-hidden="true"><span>‹ ›</span></span>
                <input className="split-input" type="range" min="0" max="100" value={split} aria-label="原图与结果对比位置" onChange={(event) => setSplit(Number(event.target.value))} />
              </>}
              {!comparison && <button className="image-preview-trigger" aria-label="全屏预览抠图结果" onClick={() => previewDialog.current?.showModal()} />}
            </div>
          </div>
        </section>
      </div>
      <div className="export-bar">
        <div>
          <p className="small muted">{result.width} × {result.height} px · {result.provider.toUpperCase()}</p>
          {resized && <p className="small muted">原图 {sourceDimensions} px，当前设备导出最长边为 1280 px。</p>}
        </div>
        <div className="export-controls">
          <span className="export-status" role="status">✓ 抠图完成</span>
          <label className="filename"><span className="sr-only">下载文件名</span><input size={Math.min(Math.max(name.length, 1), 80)} value={name} onChange={(event) => setName(event.target.value)} placeholder={fallback} disabled={Boolean(format)} /><span aria-hidden="true">.png</span></label>
          <button className="primary download-png" disabled={Boolean(format)} onClick={() => void download('png')}><svg width="22" height="22" viewBox="0 0 28 28" fill="none" aria-hidden="true"><rect x="2" y="3" width="24" height="22" stroke="currentColor" strokeWidth="2" /><circle cx="9" cy="10" r="2" stroke="currentColor" strokeWidth="2" /><path d="m3 21 7-7 5 5 4-4 7 7" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /></svg>{format === 'png' ? '生成 PNG…' : '下载 PNG'}</button>
          <button disabled={Boolean(format)} onClick={() => void download('zip')}>{format === 'zip' ? '生成 ZIP…' : '下载 ZIP'}</button>
        </div>
        {notice && <p className={`small export-notice ${exportError ? 'error-text' : 'muted'}`} role={exportError ? 'alert' : 'status'}>{notice}</p>}
      </div>
      <dialog ref={previewDialog} className="fullscreen-preview" aria-label="抠图结果全屏预览" onClick={(event) => {
        if (event.target === event.currentTarget) previewDialog.current?.close()
      }}>
        <button className="fullscreen-close" aria-label="关闭全屏预览" onClick={() => previewDialog.current?.close()}>
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
        </button>
        <div className="fullscreen-image"><img src={resultUrl} alt="最终透明 PNG 效果" draggable={false} /></div>
        <p>{result.width} × {result.height} px · 透明 PNG</p>
      </dialog>
    </>
  )
}
