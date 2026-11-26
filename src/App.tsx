import { useCallback, useEffect, useRef, useState } from 'react'
import { Workbench } from './components/Workbench'
import { ProgressPanel } from './components/ProgressPanel'
import { ElasticRegion } from './components/ElasticRegion'
import { UploadZone } from './components/UploadZone'
import { FeatureStories } from './components/FeatureStories'
import {
  describeProcessingError,
  processImage,
  type BackgroundRemovalResult,
  type RemovalProgress,
} from './services/background-removal'
import { ImageValidationError, validateImageFile, type ImageInfo } from './services/image-validation'
import { hasCachedModel, prefetchModel } from './services/model-prefetch'

type Status = 'idle' | 'processing' | 'success' | 'error' | 'cancelled'

const INITIAL_PROGRESS: RemovalProgress = { stage: 'preparing', progress: 0, message: '正在检查图片…' }

function useBlobUrl(blob: Blob | null | undefined) {
  const [entry, setEntry] = useState<{ blob: Blob; url: string }>()
  useEffect(() => {
    if (!blob) {
      setEntry(undefined)
      return
    }
    const url = URL.createObjectURL(blob)
    setEntry({ blob, url })
    return () => URL.revokeObjectURL(url)
  }, [blob])
  return entry?.blob === blob ? entry?.url : undefined
}

function App() {
  const [file, setFile] = useState<File | null>(null)
  const [info, setInfo] = useState<ImageInfo | null>(null)
  const [result, setResult] = useState<BackgroundRemovalResult | null>(null)
  const [status, setStatus] = useState<Status>('idle')
  const [progress, setProgress] = useState<RemovalProgress>(INITIAL_PROGRESS)
  const [error, setError] = useState<string>()
  const controllerRef = useRef<AbortController | undefined>(undefined)
  const taskIdRef = useRef(0)
  const [validating, setValidating] = useState(false)
  const replaceInput = useRef<HTMLInputElement>(null)
  const dialog = useRef<HTMLDialogElement>(null)
  const [dialogKind, setDialogKind] = useState<'about' | 'privacy'>('about')
  const validationId = useRef(0)
  const [modelNotice, setModelNotice] = useState<'hidden' | 'downloading' | 'ready' | 'error'>('hidden')
  const [modelBytes, setModelBytes] = useState<{ loaded: number; total: number | null }>({ loaded: 0, total: null })
  const [modelError, setModelError] = useState('')

  const sourceUrl = useBlobUrl(file)
  const resultUrl = useBlobUrl(result?.blob)

  useEffect(() => () => {
    ++validationId.current
    ++taskIdRef.current
    controllerRef.current?.abort()
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      try {
        if (await hasCachedModel() || controller.signal.aborted) return
        setModelNotice('downloading')
        await prefetchModel(controller.signal, (loaded, total) => setModelBytes({ loaded, total }))
        if (!controller.signal.aborted) setModelNotice('ready')
      } catch (cause) {
        if (!controller.signal.aborted) {
          setModelError(cause instanceof Error ? cause.message : '模型下载失败，请上传图片时重试。')
          setModelNotice('error')
        }
      }
    }, 500)
    return () => { window.clearTimeout(timer); controller.abort() }
  }, [])

  const run = useCallback(async (selected: File, taskId: number, imageInfo: ImageInfo) => {
    const controller = new AbortController()
    controllerRef.current = controller
    setStatus('processing')
    setProgress(INITIAL_PROGRESS)
    try {
      const output = await processImage(selected, controller.signal, (next) => {
        if (taskIdRef.current === taskId) setProgress(next)
      })
      if (taskIdRef.current !== taskId) return
      setResult(output)
      setInfo(imageInfo)
      setStatus('success')
    } catch (cause) {
      if (taskIdRef.current !== taskId) return
      const cancelled = controller.signal.aborted
      setStatus(cancelled ? 'cancelled' : 'error')
      setError(describeProcessingError(cause))
    } finally {
      if (taskIdRef.current === taskId) controllerRef.current = undefined
    }
  }, [])

  const start = useCallback(async (selected: File) => {
    const validation = ++validationId.current
    setValidating(true)
    setError(undefined)
    try {
      const imageInfo = await validateImageFile(selected)
      if (validationId.current !== validation) return
      if (file && !window.confirm('更换图片会清除当前抠图结果。继续更换？')) return
      controllerRef.current?.abort()
      const taskId = ++taskIdRef.current
      setResult(null)
      setFile(selected)
      setInfo(imageInfo)
      void run(selected, taskId, imageInfo)
    } catch (cause) {
      if (validationId.current !== validation) return
      setError(cause instanceof ImageValidationError ? cause.message : '图片检查失败，请重试。')
    } finally {
      if (validationId.current === validation) setValidating(false)
    }
  }, [file, run])

  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      if (validating || status === 'processing' || dialog.current?.open ||
        (event.target instanceof HTMLElement && event.target.closest('input, textarea, select, [contenteditable]'))) return
      const pasted = Array.from(event.clipboardData?.files ?? []).find((item) => item.type.startsWith('image/'))
      if (pasted) {
        event.preventDefault()
        const extension = pasted.type === 'image/png' ? 'png' : pasted.type === 'image/jpeg' ? 'jpg' : ''
        const named = new File([pasted], pasted.name || `粘贴图片.${extension}`, { type: pasted.type })
        void start(named)
      }
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [start, status, validating])

  const retry = () => {
    if (!file || !info) return
    const taskId = ++taskIdRef.current
    setError(undefined)
    setResult(null)
    void run(file, taskId, info)
  }

  const cancel = () => controllerRef.current?.abort()

  const busy = validating || status === 'processing'
  const sourceDimensions = info ? `${info.width} × ${info.height}` : ''
  const resized = Boolean(result && info && (result.width !== info.width || result.height !== info.height))
  const showDialog = (kind: 'about' | 'privacy') => {
    setDialogKind(kind)
    dialog.current?.showModal()
  }

  const returnHome = () => {
    ++validationId.current
    ++taskIdRef.current
    controllerRef.current?.abort()
    controllerRef.current = undefined
    setValidating(false)
    setFile(null)
    setInfo(null)
    setResult(null)
    setStatus('idle')
    setProgress(INITIAL_PROGRESS)
    setError(undefined)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <>
      <header className="site-header">
        <div className="header-inner">
          <button className="brand" type="button" aria-label="MFF CUTOUT，返回上传首页" onClick={returnHome}>
            <span className="brand-icon" aria-hidden="true"><img src="./assets/brand-logo.svg" alt="" /></span>
            <span>MFF <strong>CUTOUT</strong></span>
          </button>
          <nav aria-label="主导航">
            <span className="free-label">免费使用</span>
            <button onClick={() => showDialog('about')}>关于工具</button>
            <button onClick={() => showDialog('privacy')}>隐私说明</button>
          </nav>
        </div>
      </header>

      <main className={file ? `shell active-shell${result ? ' result-shell' : ''}` : 'shell'}>
        <section className="hero">
          <h1>{file ? '图片工作台' : <><span className="desktop-title cutout-wordmark" data-lettering="CUTOUT"><i className="wordmark-selection" aria-hidden="true" /><i className="wordmark-fragments" aria-hidden="true"><b /><b /><b /><b /><b /><b /></i>CUTOUT<i className="wordmark-finish" aria-hidden="true">✦</i></span><span className="mobile-title cutout-wordmark" data-lettering="MFF CUTOUT."><i className="wordmark-selection" aria-hidden="true" /><i className="wordmark-fragments" aria-hidden="true"><b /><b /><b /><b /><b /><b /></i>MFF CUTOUT.<i className="wordmark-finish" aria-hidden="true">✦</i></span></>}</h1>
          {!file && <p>免登录 · 无限额 · 本地处理 · 透明 PNG 免费下载</p>}
        </section>

        <ElasticRegion><section className="studio" onPointerMove={(event) => {
          const target = (event.target as HTMLElement).closest('button')
          if (!target || !target.matches('.studio-heading > button, .enlarge-button, .export-controls button, .segments button')) return
          const rect = target.getBoundingClientRect()
          target.style.setProperty('--glass-x', `${event.clientX - rect.left}px`)
          target.style.setProperty('--glass-y', `${event.clientY - rect.top}px`)
        }} aria-label={file ? '图片工作台' : '上传图片'} onDragOver={(event) => {
          if (event.dataTransfer.types.includes('Files')) event.preventDefault()
        }} onDrop={(event) => {
          if (!file || !event.dataTransfer.types.includes('Files')) return
          event.preventDefault()
          const selected = event.dataTransfer.files[0]
          if (!busy && selected) void start(selected)
        }}>
          {file ? <>
            <div className="studio-heading">
              <div className="current-file"><span className="file-icon" aria-hidden="true">▧</span><div><p title={file.name}>{file.name}</p><p className="small muted">{sourceDimensions} px</p></div>{status === 'error' && <span className="file-status">处理失败</span>}</div>
              {result && <span className="output-dimensions">{resized ? '当前设备实际导出' : '抠图后分辨率'}&nbsp; {result.width} × {result.height} px</span>}
              <input ref={replaceInput} hidden type="file" accept=".jpg,.jpeg,.png,image/jpeg,image/png" onChange={(event) => {
                const selected = event.currentTarget.files?.[0]
                event.currentTarget.value = ''
                if (selected) void start(selected)
              }} />
              <button disabled={busy} onClick={() => replaceInput.current?.click()}>更换图片</button>
            </div>
            {result && resultUrl && sourceUrl
              ? <div className="cutout-success"><span className="success-burst" aria-hidden="true">✦</span><Workbench file={file} result={result} resultUrl={resultUrl} sourceUrl={sourceUrl} sourceDimensions={sourceDimensions} resized={resized} /></div>
              : <div className={`pending-preview${busy ? ' is-processing' : ''}`}>
                {sourceUrl && <img className="processing-source" src={sourceUrl} alt="" />}
                <div className="processing-veil" aria-hidden="true" />
                {busy && <pre className="processing-ascii" aria-hidden="true">{('. : + · / 01 · : +     '.repeat(12) + '\n').repeat(18)}</pre>}
                <div className="cutout-loader" aria-hidden="true">
                  <svg viewBox="0 0 64 64" fill="none">
                    <path d="M24 9H15a6 6 0 0 0-6 6v9M40 9h9a6 6 0 0 1 6 6v9M9 40v9a6 6 0 0 0 6 6h9m31-15v9a6 6 0 0 1-6 6h-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                    <rect className="cutout-scan-line" x="15" y="16" width="34" height="2.5" rx="1.25" fill="currentColor" />
                    <path className="cutout-spark" d="m32 23 2.6 6.4L41 32l-6.4 2.6L32 41l-2.6-6.4L23 32l6.4-2.6L32 23Z" fill="currentColor" />
                  </svg>
                </div>
                <strong>抠图中</strong>
                <span>正在本地处理图片</span>
              </div>}
          </> : <UploadZone disabled={busy} onFile={(selected) => void start(selected)} />}

          {validating && <p className="studio-message muted" role="status">正在检查图片…</p>}
          {status === 'processing' && <div className="studio-message progress-message"><ProgressPanel progress={progress} onCancel={cancel} /></div>}
          {error && <div className="studio-message error-text" role="alert">
            <p>{error}</p>
            {file && (status === 'error' || status === 'cancelled') && <button disabled={busy} onClick={retry}>重试处理</button>}
          </div>}
        </section></ElasticRegion>
        <FeatureStories />
        <footer className="site-footer">
          <div className="footer-about">
            <strong>CUTOUT | 免费在线AI抠图工具</strong>
            <p>专为小团队或自由设计师开发免费又好用的AI抠图工具。完全免注册，只需上传图片，AI就能自动识别主体并去除背景，轻松生成透明 PNG 图片。支持 JPG、PNG 格式，实时预览抠图效果。处理完成后可直接下载高清图片，没有水印，也没有使用次数限制。<br />和其他抠图网站不同的是，所有图片都在你的浏览器本地处理，无需上传到服务器，不用担心隐私泄露。首次加载下载一次AI抠图模型即可，打开网页就能用，免费、简单、省心，让抠图不再麻烦。</p>
            <strong>商务合作</strong><p>视觉设计&nbsp; 软件开发&nbsp; 数字孪生三维建模&nbsp; Ai Agent Skill开发</p>
            <strong>更多技术仓库</strong><p><a className="github-link" href="https://github.com/MetaFormField" target="_blank" rel="noreferrer"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3.3-.37 6.8-1.62 6.8-7.4A5.8 5.8 0 0 0 19.3 3 5.4 5.4 0 0 0 19.15 0S17.95-.4 15 1.55a14 14 0 0 0-7 0C5.05-.4 3.85 0 3.85 0A5.4 5.4 0 0 0 3.7 3a5.8 5.8 0 0 0-1.5 4.1c0 5.77 3.5 7.02 6.8 7.4A4.8 4.8 0 0 0 8 18v4M8 19c-3 .92-3-1.5-4.2-2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg><span>github.com/MetaFormField</span></a></p>
          </div>
          <div className="footer-contact"><div className="contact-codes"><figure><img src="./assets/wechat-qr.png" alt="微信公众号二维码" /><figcaption>微信公众号</figcaption></figure><figure><img src="./assets/video-qr.png" alt="视频号二维码" /><figcaption>视频号</figcaption></figure></div><p>元形域设计工作室</p><p>xuan &amp; Metaform Field 2026</p></div>
        </footer>
      </main>
      <dialog ref={dialog} aria-labelledby="info-title" className="info-dialog">
        <form method="dialog">
          <div className="dialog-heading"><h2 id="info-title">{dialogKind === 'about' ? '关于 MFF CUTOUT' : '隐私说明'}</h2><button autoFocus aria-label="关闭">×</button></div>
          {dialogKind === 'about'
            ? <p>MFF CUTOUT 使用 BiRefNet 在浏览器中移除图片背景，可免费下载透明 PNG 或单图 ZIP。</p>
            : <p>图片、蒙版和导出文件均在当前浏览器内处理。网络用于加载网页、推理资源和公开模型。模型可由浏览器缓存，以便下次使用。</p>}
        </form>
      </dialog>
      {modelNotice !== 'hidden' && <div className="model-notice" role="dialog" aria-label="本地模型准备状态" aria-live="polite">
        <button className="model-notice-close" aria-label="关闭模型提示" onClick={() => setModelNotice('hidden')}>×</button>
        <strong>{modelNotice === 'downloading' ? '正在准备本地 AI 模型' : modelNotice === 'ready' ? '模型已准备好' : '模型准备失败'}</strong>
        <p>{modelNotice === 'downloading'
          ? '首次使用需要下载公开模型。图片仍只在浏览器本地处理。'
          : modelNotice === 'ready' ? '模型已缓存，上传图片即可开始抠图。' : modelError}</p>
        {modelNotice === 'downloading' && <p role="status">{modelBytes.total ? `${Math.round(modelBytes.loaded / modelBytes.total * 100)}%` : `${Math.round(modelBytes.loaded / 1024 / 1024)} MB 已下载`}</p>}
      </div>}
    </>
  )
}

export default App
