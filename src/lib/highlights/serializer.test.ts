import { describe, it, expect, beforeEach } from 'vitest'
import { serializeSelection } from './serializer'

// jsdom ne supporte pas bien Selection/Range — on teste la logique via des stubs
function makeContainer(html: string): HTMLElement {
  const div = document.createElement('div')
  div.innerHTML = html
  document.body.appendChild(div)
  return div
}

function selectText(container: HTMLElement, text: string): Selection | null {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT)
  let node = walker.nextNode()
  while (node) {
    const idx = node.textContent?.indexOf(text) ?? -1
    if (idx !== -1) {
      const range = document.createRange()
      range.setStart(node, idx)
      range.setEnd(node, idx + text.length)
      const sel = window.getSelection()
      sel?.removeAllRanges()
      sel?.addRange(range)
      return sel
    }
    node = walker.nextNode()
  }
  return null
}

describe('serializeSelection', () => {
  let container: HTMLElement

  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('retourne null si la selection est vide', () => {
    container = makeContainer('<p>Bonjour le monde</p>')
    window.getSelection()?.removeAllRanges()
    const sel = window.getSelection()!
    expect(serializeSelection(sel, container)).toBeNull()
  })

  it('serialise une selection simple', () => {
    container = makeContainer('<p>Voici un texte selectionnable pour le test.</p>')
    const sel = selectText(container, 'texte selectionnable')
    expect(sel).not.toBeNull()
    const anchor = serializeSelection(sel!, container)
    expect(anchor).not.toBeNull()
    expect(anchor!.textContent).toBe('texte selectionnable')
  })

  it('capture le prefix context', () => {
    container = makeContainer('<p>Debut du texte puis la selection importante ici fin.</p>')
    const sel = selectText(container, 'la selection importante')
    const anchor = serializeSelection(sel!, container)
    expect(anchor!.prefixContext).toContain('puis')
  })

  it('capture le suffix context', () => {
    container = makeContainer('<p>Debut du texte puis la selection importante ici fin.</p>')
    const sel = selectText(container, 'la selection importante')
    const anchor = serializeSelection(sel!, container)
    expect(anchor!.suffixContext).toContain('ici')
  })

  it('retourne null si la selection est hors du container', () => {
    container = makeContainer('<p>Dans le container</p>')
    const outside = makeContainer('<p>Hors du container cible</p>')
    selectText(outside, 'Hors du container')
    const sel = window.getSelection()!
    expect(serializeSelection(sel, container)).toBeNull()
  })

  it('retourne un cssSelector non vide', () => {
    container = makeContainer('<article><p>Texte dans un article paragraphe.</p></article>')
    const sel = selectText(container, 'Texte dans un article')
    const anchor = serializeSelection(sel!, container)
    expect(anchor!.cssSelector.length).toBeGreaterThan(0)
  })

  it('textOffset est >= 0', () => {
    container = makeContainer('<p>Premier bout puis selection test fin.</p>')
    const sel = selectText(container, 'selection test')
    const anchor = serializeSelection(sel!, container)
    expect(anchor!.textOffset).toBeGreaterThanOrEqual(0)
  })
})
