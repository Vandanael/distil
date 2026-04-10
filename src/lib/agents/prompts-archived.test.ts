import { describe, it, expect } from 'vitest'
import { buildUserPrompt } from './prompts'
import type { UserProfile, ArticleCandidate } from './types'

const PROFILE: UserProfile = {
  profileText: 'PM senior',
  profileStructured: null,
  sector: 'Produit',
  interests: ['IA'],
  pinnedSources: [],
  dailyCap: 10,
  serendipityQuota: 0.15,
}

const CANDIDATES: ArticleCandidate[] = [
  {
    url: 'https://example.com/1',
    title: 'Test',
    excerpt: null,
    contentText: 'Contenu',
    siteName: null,
  },
]

describe('buildUserPrompt avec archivedTags', () => {
  it('inclut les tags archives dans le prompt', () => {
    const prompt = buildUserPrompt(PROFILE, CANDIDATES, ['machine-learning', 'produit'])
    expect(prompt).toContain('machine-learning')
    expect(prompt).toContain('produit')
    expect(prompt).toContain('archives')
  })

  it('sans tags archives, pas de section feedback', () => {
    const prompt = buildUserPrompt(PROFILE, CANDIDATES, [])
    expect(prompt).not.toContain('archives recemment')
  })

  it('fonctionne sans le 3eme argument', () => {
    const prompt = buildUserPrompt(PROFILE, CANDIDATES)
    expect(prompt).toContain('PM senior')
    expect(prompt).not.toContain('archives recemment')
  })
})
