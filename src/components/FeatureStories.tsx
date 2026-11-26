import { useEffect, useId, useRef } from 'react'
import './FeatureStories.css'

const stories = [
  ['free', '完全免费', '创作尽兴。', '无需买单。', '无次数限制，无下载水印。', 'FREE TO CREATE'],
  ['ai', 'AI 自动识别', '背景退场。', '主角登场。', '搭载 BiRefNet 模型，自动识别图像主体。', 'FIND YOUR FOCUS'],
  ['privacy', '本地隐私处理', '你的图片。', '只在你这里。', '图片在浏览器本地处理，无需上传服务器。', 'STAYS WITH YOU'],
  ['resolution', '原分辨率下载', '好细节。', '值得被保留。', '透明 PNG 免费下载；设备限制时，明确显示实际导出尺寸。', 'MADE FOR THE DETAILS'],
] as const

function Artwork({ kind }: { kind: string }) {
  const maskId = useId()
  return <div className={`selling-collage collage-${kind}`} aria-hidden="true">
    <span className="selling-star">✦</span>
    <div className="selling-mini-card"><svg viewBox="0 0 64 64" fill="none">
      {kind === 'free' && <><path d="M12 16h40v12a6 6 0 0 0 0 12v12H12V40a6 6 0 0 0 0-12Z" stroke="currentColor" strokeWidth="3"/><path d="m23 34 6 6 13-14" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></>}
      {kind === 'ai' && <><path d="m19 12 29 23-16 3-7 15Z" fill="currentColor"/><path d="M45 11v10m-5-5h10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></>}
      {kind === 'privacy' && <><path d="M9 22v29h46V18H32l-6-7H9v11Z" stroke="currentColor" strokeWidth="3" strokeLinejoin="round"/><path d="m23 35 7 7 13-14" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></>}
      {kind === 'resolution' && <><circle cx="27" cy="27" r="17" stroke="currentColor" strokeWidth="3"/><path d="m40 40 14 14M20 27h14m-7-7v14" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></>}
    </svg></div>
    <span className="selling-caption-sticker">{kind === 'free' ? 'NO WATERMARK' : kind === 'ai' ? 'AUTO SELECT' : kind === 'privacy' ? 'YOUR FILES. YOURS.' : 'ALPHA / PNG'}</span>
    {kind === 'free' && <><div className="selling-ticket"><span>MFF / CREATIVE PASS</span><strong>¥0</strong><footer>无限次 · 无水印 <b>▥▥▥</b></footer></div><span className="selling-infinity">∞</span><span className="selling-sticker">FREE FOREVER</span></>}
    {kind === 'ai' && <><div className="selling-photo"><div className="selling-landscape" /><svg viewBox="0 0 240 240" fill="none"><path d="M102 100C50 100 55 45 85 48c22 0 33 20 35 35 9-45 59-46 65-15 5 25-15 35-42 36 47 9 46 54 19 61-23 6-37-13-42-32-8 39-53 46-64 20-12-30 15-46 46-53Z" fill="#6000e8"/><path d="M120 128v92m0-32c-32 0-43-16-45-30 26 0 41 14 45 30Zm0 18c29 0 40-15 42-29-26 0-40 14-42 29Z" stroke="#6000e8" strokeWidth="7" strokeLinecap="round"/></svg><div className="selling-scan" /><span className="selling-focus">⌜</span><span className="selling-focus end">⌟</span></div><span className="selling-sticker">✦ 主角已找到</span><span className="selling-chip">AI / CUTOUT</span></>}
    {kind === 'privacy' && <><div className="selling-shield"><svg viewBox="0 0 240 240" fill="none"><defs><mask id={maskId}><rect width="240" height="240" fill="white"/><rect x="93" y="104" width="54" height="48" rx="10" fill="black"/><path d="M100 106V91a20 20 0 0 1 40 0v15h-9V91a11 11 0 0 0-22 0v15Z" fill="black"/><circle cx="120" cy="126" r="5" fill="white"/><path d="M120 129v9" stroke="white" strokeWidth="4"/></mask></defs><path d="m120 23 76 28v61c0 52-40 80-76 96-36-16-76-44-76-96V51Z" fill="white" mask={`url(#${maskId})`}/></svg></div><span className="selling-sticker">✓ 不上传</span><span className="selling-chip">在你的浏览器里</span></>}
    {kind === 'resolution' && <><div className="selling-ticket detail-ticket"><span>EVERY PIXEL COUNTS</span><div className="selling-pixels"><svg viewBox="0 0 240 140"><path d="m20 125 60-95 50 75 38-52 56 72Z" fill="#6000e8"/><circle cx="197" cy="30" r="17" fill="#6000e8"/></svg></div><footer>透明 PNG · 清晰交付</footer></div><div className="selling-file"><svg viewBox="0 0 80 90" fill="none"><path d="M40 12v47M20 40l20 20 20-20M15 77h50" stroke="#6000e8" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round"/></svg><b>.PNG</b></div><span className="selling-chip">细节不打折</span></>}
  </div>
}

export function FeatureStories() {
  const root = useRef<HTMLElement>(null)
  useEffect(() => {
    if (!root.current || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(entries => entries.forEach(entry => entry.target.classList.toggle('is-visible', entry.isIntersecting)), { threshold: .2 })
    root.current.querySelectorAll('.selling-scene').forEach(node => observer.observe(node))
    return () => observer.disconnect()
  }, [])
  return <section className="selling-stories" ref={root} aria-label="产品特点">{stories.map(([kind, title, line1, line2, detail, tag]) => <article className="selling-scene" key={kind}><div className="selling-copy"><span className="selling-eyebrow">{title}</span><h2>{line1}<br />{line2}</h2><p>{detail}</p><span className="selling-tag">{tag}</span></div><Artwork kind={kind} /></article>)}</section>
}
