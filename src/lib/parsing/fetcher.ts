const FETCH_TIMEOUT_MS = 10_000
const USER_AGENT = 'Mozilla/5.0 (compatible; Distil/1.0; +https://distil.app)'

// Block internal/private IPs to prevent SSRF
const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '[::1]',
  'metadata.google.internal',
])

function isBlockedUrl(raw: string): boolean {
  let parsed: URL
  try {
    parsed = new URL(raw)
  } catch {
    return true
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return true
  if (BLOCKED_HOSTNAMES.has(parsed.hostname)) return true

  // Block private IP ranges (10.x, 172.16-31.x, 192.168.x, 169.254.x)
  const parts = parsed.hostname.split('.')
  if (parts.length === 4 && parts.every((p) => /^\d+$/.test(p))) {
    const [a, b] = parts.map(Number)
    if (a === 10) return true
    if (a === 172 && b >= 16 && b <= 31) return true
    if (a === 192 && b === 168) return true
    if (a === 169 && b === 254) return true
    if (a === 0) return true
  }

  return false
}

export async function fetchHtml(url: string): Promise<string> {
  if (isBlockedUrl(url)) {
    throw new Error(`Blocked URL: ${url}`)
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
      signal: controller.signal,
      redirect: 'follow',
    })

    // Check final URL after redirects
    if (res.url && isBlockedUrl(res.url)) {
      throw new Error(`Blocked redirect target: ${res.url}`)
    }

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} fetching ${url}`)
    }

    return await res.text()
  } finally {
    clearTimeout(timer)
  }
}
