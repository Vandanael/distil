import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock de la couche API avant l'import du module
vi.mock('./messages-api', () => ({
  scoreWithMessagesApi: vi.fn(),
}))

import { runScoringAgent } from './scoring-agent'
import { scoreWithMessagesApi } from './messages-api'
import type { ScoringRequest, ScoredArticle, ScoringFunctionResult } from './types'

const PROFILE = {
  profileText: 'PM senior',
  profileStructured: null,
  sector: 'Produit',
  interests: ['IA'],
  pinnedSources: [],
  dailyCap: 10,
  serendipityQuota: 0.15,
}

const CANDIDATES = [
  {
    url: 'https://example.com/1',
    title: 'Article 1',
    excerpt: null,
    contentText: 'Contenu 1',
    siteName: null,
    author: null,
    publishedAt: null,
    wordCount: 2,
  },
  {
    url: 'https://example.com/2',
    title: 'Article 2',
    excerpt: null,
    contentText: 'Contenu 2',
    siteName: null,
    author: null,
    publishedAt: null,
    wordCount: 2,
  },
]

const MOCK_RESULTS: ScoringFunctionResult = {
  scored: [
    {
      url: 'https://example.com/1',
      score: 80,
      justification: 'Tres pertinent',
      isSerendipity: false,
      rejectionReason: null,
      accepted: true,
    },
    {
      url: 'https://example.com/2',
      score: 20,
      justification: 'Hors sujet',
      isSerendipity: false,
      rejectionReason: 'Sujet non lie au profil',
      accepted: false,
    },
  ],
  modelUsed: 'test-model',
}

const REQUEST: ScoringRequest = {
  profile: PROFILE,
  candidates: CANDIDATES,
  runId: 'test-run-id',
}

beforeEach(() => {
  vi.mocked(scoreWithMessagesApi).mockResolvedValue(MOCK_RESULTS)
})

describe('runScoringAgent', () => {
  it('retourne les resultats scores', async () => {
    const result = await runScoringAgent(REQUEST)
    expect(result.scored).toHaveLength(2)
  })

  it('renseigne le runId', async () => {
    const result = await runScoringAgent(REQUEST)
    expect(result.runId).toBe('test-run-id')
  })

  it('mesure la duree', async () => {
    const result = await runScoringAgent(REQUEST)
    expect(result.durationMs).toBeGreaterThanOrEqual(0)
  })

  it('retourne agentType messages', async () => {
    const result = await runScoringAgent(REQUEST)
    expect(result.agentType).toBe('messages')
  })

  it('error est null en cas de succes', async () => {
    const result = await runScoringAgent(REQUEST)
    expect(result.error).toBeNull()
  })

  it('capture l erreur sans jeter', async () => {
    vi.mocked(scoreWithMessagesApi).mockRejectedValue(new Error('API timeout'))
    const result = await runScoringAgent(REQUEST)
    expect(result.error).toContain('timeout')
    expect(result.scored).toHaveLength(0)
  })
})
