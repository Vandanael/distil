import { parseHTML } from 'linkedom'

/**
 * Strip HTML tags and decode all entities using DOM parsing.
 * More robust than regex-based stripping - handles all HTML entities correctly.
 */
export function stripHtml(html: string): string {
  if (!html) return ''
  const { document } = parseHTML(`<body>${html}</body>`)
  return (document.body.textContent ?? '').replace(/\s+/g, ' ').trim()
}
