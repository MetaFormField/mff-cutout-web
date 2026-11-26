import type { RemovalProgress } from '../services/background-removal'

interface ProgressPanelProps {
  progress: RemovalProgress
  onCancel: () => void
}

const STAGE_LABELS = {
  preparing: '初始化',
  downloading: '下载模型',
  processing: 'AI 推理',
  finishing: '导出 PNG',
} as const

const MESSAGE_LABELS: Record<string, string> = {
  'Preparing image…': '正在准备图片…',
  'Loading cached model…': '正在加载本地缓存模型…',
  'Downloading local model…': '正在下载本地 AI 模型…',
  'Removing background…': '正在识别并移除背景…',
  'Switching to compatibility mode…': '正在切换兼容模式…',
  'Preparing compatibility mode…': '正在准备 WASM 兼容模式…',
  'Retrying background removal…': '正在用兼容模式重新处理…',
  'Finishing edges…': '正在细化边缘并导出 PNG…',
  'Background removed': '背景已移除',
}

export function ProgressPanel({ progress, onCancel }: ProgressPanelProps) {
  const percent = Math.round(progress.progress * 100)
  return (
    <section className="progress-panel" aria-live="polite" aria-label="处理进度">
      <div className="progress-heading">
        <div>
          <p className="progress-title">{STAGE_LABELS[progress.stage]} <span>· {percent}%</span></p>
          <p className="progress-detail">
            {MESSAGE_LABELS[progress.message] ?? progress.message}
          </p>
        </div>
        <button onClick={onCancel}>取消处理</button>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${percent}%` }} />
      </div>
    </section>
  )
}
