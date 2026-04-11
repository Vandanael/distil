// Utilitaires pour les tokens API du bookmarklet
// Pas de dépendance Supabase - testable en isolation

const TOKEN_PREFIX = 'dst_'
const TOKEN_BYTES = 32
const TOKEN_LENGTH = TOKEN_PREFIX.length + TOKEN_BYTES * 2 // 4 + 64 = 68

export function generateToken(): string {
  const bytes = new Uint8Array(TOKEN_BYTES)
  crypto.getRandomValues(bytes)
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  return `${TOKEN_PREFIX}${hex}`
}

export async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(token)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export function validateTokenFormat(token: unknown): token is string {
  return (
    typeof token === 'string' && token.startsWith(TOKEN_PREFIX) && token.length === TOKEN_LENGTH
  )
}
