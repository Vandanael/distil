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

/**
 * Retrouve un Range a partir d'un ancrage stocke.
 * Retourne null si l'ancrage ne peut pas etre resolu.
 */
export function anchorHighlight(anchor: HighlightAnchor, container: HTMLElement): Range | null {
  // Trouver l'element parent via le selecteur CSS
  let parentEl: Element | null = null
  try {
    parentEl = container.querySelector(anchor.cssSelector)
  } catch {
    // Selecteur invalide, fallback sur le container
  }
  if (!parentEl) parentEl = container

  const parentText = parentEl.textContent ?? ''

  // Verifier la coherence par contexte
  const expectedPrefix = parentText.slice(
    Math.max(0, anchor.textOffset - CONTEXT_LENGTH),
    anchor.textOffset
  )

  if (anchor.prefixContext && !expectedPrefix.endsWith(anchor.prefixContext.slice(-10))) {
    // Contexte incompatible, ancrage orphelin
    return null
  }

  // Trouver le noeud texte et l'offset
  const result = findTextNode(parentEl, anchor.textOffset, anchor.textContent.length)
  if (!result) return null

  const range = document.createRange()
  try {
    range.setStart(result.startNode, result.startOffset)
    range.setEnd(result.endNode, result.endOffset)
  } catch {
    return null
  }

  return range
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

type TextNodeResult = {
  startNode: Node
  startOffset: number
  endNode: Node
  endOffset: number
}

function findTextNode(
  container: Element,
  textOffset: number,
  length: number
): TextNodeResult | null {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT)
  let accumulated = 0

  let startNode: Node | null = null
  let startOffset = 0
  let endNode: Node | null = null
  let endOffset = 0

  let node = walker.nextNode()
  while (node) {
    const nodeLength = node.textContent?.length ?? 0

    if (!startNode && accumulated + nodeLength > textOffset) {
      startNode = node
      startOffset = textOffset - accumulated
    }

    if (startNode && accumulated + nodeLength >= textOffset + length) {
      endNode = node
      endOffset = textOffset + length - accumulated
      break
    }

    accumulated += nodeLength
    node = walker.nextNode()
  }

  if (!startNode || !endNode) return null
  return { startNode, startOffset, endNode, endOffset }
}
