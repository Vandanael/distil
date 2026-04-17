import { createHmac, timingSafeEqual } from 'crypto'

function getSecret(): string {
  const s = process.env.UNSUBSCRIBE_SECRET ?? process.env.CRON_SECRET
  if (!s) throw new Error('UNSUBSCRIBE_SECRET ou CRON_SECRET requis')
  return s
}

export function signUnsubscribeToken(userId: string): string {
  const sig = createHmac('sha256', getSecret()).update(userId).digest('hex').slice(0, 32)
  const payload = Buffer.from(userId).toString('base64url')
  return `${payload}.${sig}`
}

export function verifyUnsubscribeToken(token: string): string | null {
  const parts = token.split('.')
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null
  const [payload, sig] = parts
  try {
    const userId = Buffer.from(payload, 'base64url').toString('utf-8')
    const expected = createHmac('sha256', getSecret()).update(userId).digest('hex').slice(0, 32)
    const sigBuf = Buffer.from(sig)
    const expBuf = Buffer.from(expected)
    if (sigBuf.length !== expBuf.length) return null
    if (!timingSafeEqual(sigBuf, expBuf)) return null
    return userId
  } catch {
    return null
  }
}
