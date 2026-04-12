import { describe, it, expect, vi, beforeEach } from 'vitest'
import { signUnsubscribeToken, verifyUnsubscribeToken } from './token'

beforeEach(() => {
  vi.stubEnv('CRON_SECRET', 'test-secret-for-hmac')
})

describe('signUnsubscribeToken / verifyUnsubscribeToken', () => {
  it('round-trip : sign then verify returns userId', () => {
    const userId = '550e8400-e29b-41d4-a716-446655440000'
    const token = signUnsubscribeToken(userId)
    expect(verifyUnsubscribeToken(token)).toBe(userId)
  })

  it('rejects tampered signature', () => {
    const token = signUnsubscribeToken('some-user-id')
    const tampered = token.slice(0, -1) + 'x'
    expect(verifyUnsubscribeToken(tampered)).toBeNull()
  })

  it('rejects truncated token (no dot)', () => {
    expect(verifyUnsubscribeToken('abc123')).toBeNull()
  })

  it('rejects empty parts', () => {
    expect(verifyUnsubscribeToken('.abcdef')).toBeNull()
    expect(verifyUnsubscribeToken('abcdef.')).toBeNull()
  })

  it('rejects plain base64 token (no signature)', () => {
    const oldStyleToken = Buffer.from('some-user-id').toString('base64url')
    expect(verifyUnsubscribeToken(oldStyleToken)).toBeNull()
  })

  it('different secrets produce different signatures', () => {
    const token1 = signUnsubscribeToken('user-1')
    vi.stubEnv('CRON_SECRET', 'different-secret')
    expect(verifyUnsubscribeToken(token1)).toBeNull()
  })
})
