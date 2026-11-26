import { useRef, useState } from 'react'

interface UploadZoneProps {
  disabled: boolean
  onFile: (file: File) => void
}

export function UploadZone({ disabled, onFile }: UploadZoneProps) {
  const input = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [rebounding, setRebounding] = useState(false)

  return (
    <div
      className={`upload-zone ${dragging ? 'dragging' : ''}`}
      onDragOver={(event) => { event.preventDefault(); if (!disabled) setDragging(true) }}
      onDragLeave={(event) => {
        if (!(event.relatedTarget instanceof Node) || !event.currentTarget.contains(event.relatedTarget)) setDragging(false)
      }}
      onDrop={(event) => {
        event.preventDefault()
        setDragging(false)
        const file = event.dataTransfer.files[0]
        if (!disabled && file) onFile(file)
      }}
    >
      <input ref={input} hidden type="file" accept=".jpg,.jpeg,.png,image/jpeg,image/png" disabled={disabled} onChange={(event) => {
        const file = event.currentTarget.files?.[0]
        event.currentTarget.value = ''
        if (file) onFile(file)
      }} />
      <div className="upload-content"><div className="upload-main">
        <div className="upload-mark" aria-hidden="true">
          <svg viewBox="0 0 32 32" fill="none">
            <path d="M9 23 23 9M13 9h10v10" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div>
          <h2>{dragging ? '松开，开始抠图' : '把图片拖到这里'}</h2>
          <p>上传后自动抠图，生成透明背景。</p>
        </div>
        <button className={`upload-button${rebounding ? ' is-rebounding' : ''}`} disabled={disabled}
          onPointerDown={() => setRebounding(false)}
          onPointerCancel={() => setRebounding(false)}
          onAnimationEnd={() => setRebounding(false)}
          onClick={() => { setRebounding(true); input.current?.click() }}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true"><rect x="2" y="3" width="24" height="22" stroke="currentColor" strokeWidth="2" /><circle cx="9" cy="10" r="2" stroke="currentColor" strokeWidth="2" /><path d="m3 21 7-7 5 5 4-4 7 7" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /></svg>选择图片
        </button>
      </div>
      <div className="upload-meta">
        <div><strong>粘贴图片</strong><span>Ctrl / ⌘ + V</span></div>
        <div><strong>支持格式</strong><span>JPG、JPEG、PNG · 最大 15 MB</span></div>
      </div></div>
    </div>
  )
}
