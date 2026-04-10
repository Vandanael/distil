'use client'

import { useEffect, useRef, useState } from 'react'
import { serializeSelection } from '@/lib/highlights/serializer'
import { saveHighlight } from '../actions'

type Props = {
  articleId: string
  containerRef: React.RefObject<HTMLDivElement | null>
  onHighlightSaved?: (highlightId: string, text: string) => void
}

type PopoverPos = { x: number; y: number }

export function HighlightPopover({ articleId, containerRef, onHighlightSaved }: Props) {
  const [pos, setPos] = useState<PopoverPos | null>(null)
  const [saving, setSaving] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleSelectionChange() {
      const selection = window.getSelection()
      if (!selection || selection.toString().trim() === '') {
        setPos(null)
        return
      }
      if (!containerRef.current) return
      if (!containerRef.current.contains(selection.anchorNode)) {
        setPos(null)
        return
      }

      const range = selection.getRangeAt(0)
      const rect = range.getBoundingClientRect()
      setPos({
        x: rect.left + rect.width / 2 + window.scrollX,
        y: rect.top + window.scrollY - 8,
      })
    }

    document.addEventListener('selectionchange', handleSelectionChange)
    return () => document.removeEventListener('selectionchange', handleSelectionChange)
  }, [containerRef])

  async function handleHighlight() {
    const selection = window.getSelection()
    if (!selection || !containerRef.current) return

    const anchor = serializeSelection(selection, containerRef.current)
    if (!anchor) return

    setSaving(true)
    const id = await saveHighlight(articleId, anchor)
    setSaving(false)
    setPos(null)
    selection.removeAllRanges()

    if (id) onHighlightSaved?.(id, anchor.textContent)
  }

  if (!pos) return null

  return (
    <div
      ref={popoverRef}
      data-testid="highlight-popover"
      style={{ left: pos.x, top: pos.y, transform: 'translate(-50%, -100%)' }}
      className="fixed z-50 flex items-center gap-1 bg-foreground px-3 py-1.5"
    >
      <button
        type="button"
        onClick={handleHighlight}
        disabled={saving}
        data-testid="highlight-btn"
        className="font-ui text-xs text-primary-foreground hover:text-accent transition-colors disabled:opacity-50"
      >
        {saving ? '...' : 'Surligner'}
      </button>
    </div>
  )
}
