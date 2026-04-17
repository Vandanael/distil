import { lookup } from 'node:dns/promises'
import { isIP } from 'node:net'

const FETCH_TIMEOUT_MS = 10_000
const USER_AGENT = 'Mozilla/5.0 (compatible; Distil/1.0; +https://distil.app)'
const MAX_REDIRECTS = 5

const BLOCKED_HOSTNAMES = new Set(['localhost', 'metadata.google.internal', 'metadata'])

function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split('.')
  if (parts.length !== 4 || !parts.every((p) => /^\d+$/.test(p))) return false
  const [a, b] = parts.map(Number)
  if (a === 0 || a === 10 || a === 127) return true
  if (a === 172 && b >= 16 && b <= 31) return true
  if (a === 192 && b === 168) return true
  if (a === 169 && b === 254) return true
  return false
}

function isPrivateIPv6(ip: string): boolean {
  const lower = ip.toLowerCase()
  if (lower === '::1' || lower === '::') return true
  if (lower.startsWith('fc') || lower.startsWith('fd')) return true // ULA
  if (lower.startsWith('fe80')) return true // link-local
  if (lower.startsWith('::ffff:')) return isPrivateIPv4(lower.slice(7)) // v4-mapped
  return false
}

// Valide l'URL et resout le hostname pour eviter une SSRF via DNS rebinding ou IP privee deguisee.
async function validateUrl(raw: string): Promise<void> {
  let parsed: URL
  try {
    parsed = new URL(raw)
  } catch {
    throw new Error(`Invalid URL: ${raw}`)
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error(`Blocked protocol: ${parsed.protocol}`)
  }

  const hostname = parsed.hostname
  if (BLOCKED_HOSTNAMES.has(hostname.toLowerCase())) {
    throw new Error(`Blocked hostname: ${hostname}`)
  }

  const literal = isIP(hostname)
  if (literal === 4 && isPrivateIPv4(hostname)) {
    throw new Error(`Private IPv4 literal: ${hostname}`)
  }
  if (literal === 6 && isPrivateIPv6(hostname)) {
    throw new Error(`Private IPv6 literal: ${hostname}`)
  }

  if (literal === 0) {
    const answers = await lookup(hostname, { all: true })
    for (const { address, family } of answers) {
      if (family === 4 && isPrivateIPv4(address)) {
        throw new Error(`Hostname resolves to private IPv4: ${hostname} -> ${address}`)
      }
      if (family === 6 && isPrivateIPv6(address)) {
        throw new Error(`Hostname resolves to private IPv6: ${hostname} -> ${address}`)
      }
    }
  }
}

export async function fetchHtml(url: string): Promise<string> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  try {
    let current = url
    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      await validateUrl(current)

      const res = await fetch(current, {
        headers: { 'User-Agent': USER_AGENT },
        signal: controller.signal,
        redirect: 'manual',
      })

      if (res.status >= 300 && res.status < 400) {
        const location = res.headers.get('location')
        if (!location) throw new Error(`Redirect without Location: ${current}`)
        current = new URL(location, current).toString()
        continue
      }

      if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`)
      return await res.text()
    }
    throw new Error(`Too many redirects: ${url}`)
  } finally {
    clearTimeout(timer)
  }
}
