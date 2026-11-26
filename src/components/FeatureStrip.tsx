const features = [
  { kind: 'free', title: '完全免费', detail: '无次数限制，无下载水印。' },
  { kind: 'ai', title: 'AI 自动识别', detail: '搭载 BiRefNet 模型，智能计算图像，快速抠图。' },
  { kind: 'privacy', title: '本地隐私处理', detail: '图片不上传服务器，只存本地，保护你的图像隐私。' },
  { kind: 'resolution', title: '原分辨率下载', detail: '抠图后保持原有的清晰度，保证不变糊。' },
] as const

function FeatureIcon({ kind }: { kind: typeof features[number]['kind'] }) {
  return (
    <svg className={`feature-icon feature-icon--${kind}`} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      {kind === 'free' && <>
        <circle className="icon-orbit" cx="32" cy="32" r="22" stroke="currentColor" strokeWidth="2" strokeDasharray="3 5" />
        <circle cx="32" cy="32" r="16" stroke="currentColor" strokeWidth="2.5" />
        <path d="M25 32.5l5 5 10-11" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <circle className="icon-satellite" cx="54" cy="32" r="3" fill="currentColor" />
      </>}
      {kind === 'ai' && <>
        <path className="icon-focus" d="M23 9H14a5 5 0 0 0-5 5v9M41 9h9a5 5 0 0 1 5 5v9M9 41v9a5 5 0 0 0 5 5h9m32-14v9a5 5 0 0 1-5 5h-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <path className="icon-spark" d="M32 17l3.5 11.5L47 32l-11.5 3.5L32 47l-3.5-11.5L17 32l11.5-3.5L32 17Z" fill="currentColor" />
      </>}
      {kind === 'privacy' && <>
        <path className="icon-shield" d="M32 8 51 15v16c0 13-8.3 21-19 25-10.7-4-19-12-19-25V15L32 8Z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
        <rect x="24" y="29" width="16" height="13" rx="3" stroke="currentColor" strokeWidth="2.5" />
        <path d="M27 29v-4a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <circle className="icon-lock-dot" cx="32" cy="35.5" r="2" fill="currentColor" />
      </>}
      {kind === 'resolution' && <>
        <path d="M11 24V15a4 4 0 0 1 4-4h9m16 0h9a4 4 0 0 1 4 4v9M11 40v9a4 4 0 0 0 4 4h9m16 0h9a4 4 0 0 0 4-4v-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <path className="icon-arrow" d="M32 20v19m0 0-7-7m7 7 7-7" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M23 45h18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="16" cy="32" r="2" fill="currentColor" /><circle cx="48" cy="32" r="2" fill="currentColor" />
      </>}
    </svg>
  )
}

export function FeatureStrip() {
  return <section className="feature-strip" aria-label="产品特点">
    {features.map((feature) => <div className="feature-item" key={feature.kind}>
      <FeatureIcon kind={feature.kind} />
      <h2>{feature.title}</h2>
      <p>{feature.detail}</p>
    </div>)}
  </section>
}
