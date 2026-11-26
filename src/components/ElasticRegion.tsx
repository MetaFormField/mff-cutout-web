import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'

export function ElasticRegion({ children }: { children: ReactNode }) {
  const content = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState<number>()
  useLayoutEffect(() => {
    const node = content.current
    if (!node || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(() => setHeight(node.getBoundingClientRect().height))
    observer.observe(node)
    return () => observer.disconnect()
  }, [])
  return <div className="elastic-region" style={{ height }}><div ref={content}>{children}</div></div>
}
