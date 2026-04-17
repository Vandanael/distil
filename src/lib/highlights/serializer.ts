export type HighlightAnchor = {
  textContent: string
  prefixContext: string
  suffixContext: string
  cssSelector: string
  textOffset: number
}

const CONTEXT_LENGTH = 30

/**
 * Serialise la selection courante en donnees d'ancrage portables.
 * Retourne null si la selection est vide ou hors du container.
 */
export function serializeSelection(
  selection: Selection,
  container: HTMLElement
): HighlightAnchor | null {
  if (selection.rangeCount === 0) return null

  const range = selection.getRangeAt(0)
  const textContent = selection.toString().trim()
  if (!textContent) return null

  // Verifier que la selection est dans le container
  if (!container.contains(range.commonAncestorContainer)) return null

  // Trouver le parent element le plus proche
  const parentEl =
    range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
      ? (range.commonAncestorContainer as HTMLElement)
      : (range.commonAncestorContainer.parentElement ?? container)

  const cssSelector = buildCssSelector(parentEl, container)
  const parentText = parentEl.textContent ?? ''

  // Calculer l'offset du texte selectionne dans le parent
  const startOffset = findTextOffset(parentEl, range.startContainer, range.startOffset)
  const textOffset = Math.max(0, startOffset)

  const prefixContext = parentText.slice(Math.max(0, textOffset - CONTEXT_LENGTH), textOffset)
  const suffixContext = parentText.slice(
    textOffset + textContent.length,
    textOffset + textContent.length + CONTEXT_LENGTH
  )

  return {
    textContent,
    prefixContext,
    suffixContext,
    cssSelector,
    textOffset,
  }
}

// --- Helpers ---

function buildCssSelector(el: HTMLElement, root: HTMLElement): string {
  const parts: string[] = []
  let current: HTMLElement | null = el

  while (current && current !== root) {
    let selector = current.tagName.toLowerCase()
    if (current.id) {
      selector += `#${current.id}`
      parts.unshift(selector)
      break
    }
    const siblings = Array.from(current.parentElement?.children ?? []).filter(
      (c) => c.tagName === current!.tagName
    )
    if (siblings.length > 1) {
      const index = siblings.indexOf(current) + 1
      selector += `:nth-of-type(${index})`
    }
    parts.unshift(selector)
    current = current.parentElement as HTMLElement | null
  }

  return parts.join(' > ') || el.tagName.toLowerCase()
}

function findTextOffset(container: Node, targetNode: Node, offsetInNode: number): number {
  let offset = 0
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT)

  let node = walker.nextNode()
  while (node) {
    if (node === targetNode) {
      return offset + offsetInNode
    }
    offset += node.textContent?.length ?? 0
    node = walker.nextNode()
  }
  return offset
}
