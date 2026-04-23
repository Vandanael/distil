import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { RankingCandidate } from './ranking-types'

// Hoist LLM_OUTPUT et FakeGeminiClient via vi.hoisted : le factory vi.mock est
// remonte en tete de fichier avant les `const`, donc on ne peut pas y capturer
// une variable declaree normalement. vi.hoisted rend le module reference-able.
const mocks = vi.hoisted(() => {
  const LLM_OUTPUT: { essential: unknown[]; surprise: unknown[] } = {
    essential: [],
    surprise: [],
  }
  class FakeGeminiClient {
    getGenerativeModel() {
      return {
        generateContent: async () => ({
          response: { text: () => JSON.stringify(LLM_OUTPUT) },
        }),
      }
    }
  }
  return { LLM_OUTPUT, FakeGeminiClient }
})

vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: mocks.FakeGeminiClient,
}))

vi.mock('@/lib/api-budget', () => ({
  assertBudget: vi.fn().mockResolvedValue(undefined),
  assertUserBudget: vi.fn().mockResolvedValue(undefined),
  recordProviderCall: vi.fn().mockResolvedValue(undefined),
  recordUserProviderCall: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/lib/parsing/readability', () => ({
  parseUrl: vi.fn().mockRejectedValue(new Error('skip enrichment in tests')),
}))

vi.mock('./prefilter', () => ({
  prefilterCandidates: vi.fn(),
}))

import { rankForUser } from './ranking-agent'
import { prefilterCandidates } from './prefilter'

process.env.GOOGLE_AI_API_KEY = 'test-key'

type Fixture = {
  candidates: RankingCandidate[]
  profileRow: Record<string, unknown> | null
  profileTextRow: Record<string, unknown> | null
  rssAvailable: number
}

function makeCandidate(
  id: string,
  kind: 'rss' | 'agent',
  overrides: Partial<RankingCandidate> = {}
): RankingCandidate {
  return {
    itemId: id,
    url: `https://example.test/${id}`,
    title: `Article ${id}`,
    author: null,
    siteName: kind === 'rss' ? 'Source RSS' : 'Decouverte',
    publishedAt: null,
    contentPreview: 'lorem ipsum',
    wordCount: 500,
    distance: 0.3,
    unpopScore: 0.5,
    isKeywordHit: false,
    matchedKeywords: [],
    keywordRank: 0,
    sourceKind: kind,
    ...overrides,
  }
}

// Chaine thenable : tout appel de methode (select, eq, in, gte, lt, not,
// order, limit, single, update, delete, insert, upsert) renvoie le meme
// objet, qui resout avec { data, error, count } quand on l'await.
function chain(
  data: unknown,
  opts: { count?: number; error?: unknown } = {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
  const result = { data, error: opts.error ?? null, count: opts.count ?? 0 }
  const proxy: unknown = new Proxy(Promise.resolve(result), {
    get(target, prop) {
      if (prop === 'then' || prop === 'catch' || prop === 'finally') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (target as any)[prop].bind(target)
      }
      return () => proxy
    },
  })
  return proxy
}

// Stub supabase : route par table et expose une chaine thenable.
function makeSupabase(f: Fixture) {
  return {
    from(table: string) {
      if (table === 'daily_ranking') {
        return chain(null, { count: 0 })
      }
      if (table === 'user_profile_text') {
        return chain(f.profileTextRow)
      }
      if (table === 'profiles') {
        return chain(f.profileRow)
      }
      if (table === 'articles') {
        return chain([])
      }
      throw new Error(`unexpected table: ${table}`)
    },
    rpc(name: string) {
      if (name === 'count_relevant_rss') {
        return Promise.resolve({ data: f.rssAvailable, error: null })
      }
      throw new Error(`unexpected rpc: ${name}`)
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.LLM_OUTPUT.essential = []
  mocks.LLM_OUTPUT.surprise = []
})

describe('rankForUser - ponderation adaptative (integration)', () => {
  it('mode active avec pool RSS modere (~dailyCap) produit un split ~50/50 dans essential', async () => {
    const rssItems = Array.from({ length: 10 }, (_, i) => makeCandidate(`r${i}`, 'rss'))
    const agentItems = Array.from({ length: 10 }, (_, i) => makeCandidate(`a${i}`, 'agent'))
    const candidates = [...rssItems, ...agentItems]

    // LLM : 10 essentiels (5 RSS + 5 agent) + 2 surprise (1 RSS + 1 agent)
    mocks.LLM_OUTPUT.essential = [
      ...rssItems
        .slice(0, 5)
        .map((c) => ({ item_id: c.itemId, q1: 9, q2: 5, q3: 5, justification: 'r' })),
      ...agentItems
        .slice(0, 5)
        .map((c) => ({ item_id: c.itemId, q1: 9, q2: 5, q3: 5, justification: 'a' })),
    ]
    mocks.LLM_OUTPUT.surprise = [
      { item_id: rssItems[5].itemId, q1: 7, q2: 8, q3: 7, justification: 'sr' },
      { item_id: agentItems[5].itemId, q1: 7, q2: 8, q3: 7, justification: 'sa' },
    ]

    vi.mocked(prefilterCandidates).mockResolvedValue(candidates)

    // rssAvailable = dailyCap (8) => raw ratio = 8 / 16 = 0.5
    const supabase = makeSupabase({
      candidates,
      profileRow: {
        profile_text: 'PM senior',
        sector: 'Produit',
        interests: ['IA'],
        pinned_sources: [],
        embedding: JSON.stringify(Array.from({ length: 1024 }, () => 0.01)),
        profile_structured: null,
        discovery_mode: 'active',
        daily_cap: 8,
      },
      profileTextRow: null,
      rssAvailable: 8,
    })

    const out = await rankForUser(supabase, 'user-1')

    expect(out.error).toBeNull()
    expect(out.fallback).toBe(false)
    // target = 8 ; essentialTarget = 6 ; rssRatio = 0.5 => 3 RSS + 3 agent essentiels
    expect(out.essential).toHaveLength(6)
    const essRss = out.essential.filter((r) => r.sourceKind === 'rss')
    const essAgent = out.essential.filter((r) => r.sourceKind === 'agent')
    expect(essRss).toHaveLength(3)
    expect(essAgent).toHaveLength(3)
    expect(out.surprise.length).toBeGreaterThanOrEqual(1)
  })

  it('mode sources_first avec rssAvailable >= dailyCap impose essential 100% RSS', async () => {
    const rssItems = Array.from({ length: 10 }, (_, i) => makeCandidate(`r${i}`, 'rss'))
    const agentItems = Array.from({ length: 10 }, (_, i) => makeCandidate(`a${i}`, 'agent'))
    const candidates = [...rssItems, ...agentItems]

    // Pool RSS abondant : le LLM met 8 RSS + 2 agent en essential. rssRatio=1.0 doit
    // remplir les 6 slots essentiels entierement avec du RSS.
    mocks.LLM_OUTPUT.essential = [
      ...rssItems
        .slice(0, 8)
        .map((c) => ({ item_id: c.itemId, q1: 9, q2: 5, q3: 5, justification: 'r' })),
      ...agentItems
        .slice(0, 2)
        .map((c) => ({ item_id: c.itemId, q1: 9, q2: 5, q3: 5, justification: 'a' })),
    ]
    mocks.LLM_OUTPUT.surprise = [
      { item_id: rssItems[8].itemId, q1: 7, q2: 8, q3: 7, justification: 'sr' },
      { item_id: agentItems[2].itemId, q1: 7, q2: 8, q3: 7, justification: 'sa' },
    ]

    vi.mocked(prefilterCandidates).mockResolvedValue(candidates)

    const supabase = makeSupabase({
      candidates,
      profileRow: {
        profile_text: 'PM',
        sector: 'Produit',
        interests: ['IA'],
        pinned_sources: [],
        embedding: JSON.stringify(Array.from({ length: 1024 }, () => 0.01)),
        profile_structured: null,
        discovery_mode: 'sources_first',
        daily_cap: 8,
      },
      profileTextRow: null,
      rssAvailable: 20, // >= dailyCap => rssRatio forced to 1.0
    })

    const out = await rankForUser(supabase, 'user-2')

    expect(out.error).toBeNull()
    expect(out.essential).toHaveLength(6)
    expect(out.essential.every((r) => r.sourceKind === 'rss')).toBe(true)
  })

  it('cold start (profil totalement vide) force rssRatio 1 meme en mode active', async () => {
    const rssItems = Array.from({ length: 10 }, (_, i) => makeCandidate(`r${i}`, 'rss'))
    const agentItems = Array.from({ length: 10 }, (_, i) => makeCandidate(`a${i}`, 'agent'))
    const candidates = [...rssItems, ...agentItems]

    mocks.LLM_OUTPUT.essential = [
      ...rssItems
        .slice(0, 5)
        .map((c) => ({ item_id: c.itemId, q1: 9, q2: 5, q3: 5, justification: 'r' })),
      ...agentItems
        .slice(0, 5)
        .map((c) => ({ item_id: c.itemId, q1: 9, q2: 5, q3: 5, justification: 'a' })),
    ]

    vi.mocked(prefilterCandidates).mockResolvedValue(candidates)

    const supabase = makeSupabase({
      candidates,
      profileRow: {
        profile_text: null,
        sector: null,
        interests: [],
        pinned_sources: [],
        embedding: JSON.stringify(Array.from({ length: 1024 }, () => 0.01)),
        profile_structured: null,
        discovery_mode: 'active',
        daily_cap: 8,
      },
      profileTextRow: null,
      rssAvailable: 0,
    })

    const out = await rankForUser(supabase, 'user-3')

    expect(out.error).toBeNull()
    // rssRatio = 1 (cold start), donc RSS d'abord, puis overflow agent pour combler
    const essRss = out.essential.filter((r) => r.sourceKind === 'rss')
    expect(essRss.length).toBeGreaterThanOrEqual(5) // au moins tous les RSS LLM
  })
})
