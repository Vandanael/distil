import { describe, it, expect } from 'vitest'
import { buildSystemPrompt, buildUserPrompt } from './prompts'
import type { UserProfile, ArticleCandidate } from './types'

const PROFILE: UserProfile = {
  profileText: 'PM senior, product strategy, IA appliquee',
  profileStructured: null,
  sector: 'Produit',
  interests: ['IA', 'startups', 'B2B'],
  pinnedSources: ['stratechery.com'],
  dailyCap: 10,
  serendipityQuota: 0.15,
}

const CANDIDATES: ArticleCandidate[] = [
  {
    url: 'https://example.com/article-1',
    title: 'The future of product management',
    excerpt: 'How AI is changing the PM role',
    contentText: 'Product managers are increasingly using AI tools...',
    siteName: 'example.com',
    author: null,
    publishedAt: null,
  },
]

describe('buildSystemPrompt', () => {
  it('contient les regles de scoring', () => {
    const prompt = buildSystemPrompt()
    expect(prompt).toContain('0-100')
    expect(prompt).toContain('40')
    expect(prompt).toContain('JSON')
  })

  it('mentionne is_serendipity', () => {
    expect(buildSystemPrompt()).toContain('is_serendipity')
  })

  it('definit la condition score < 55 pour la serendipite', () => {
    expect(buildSystemPrompt()).toContain('55')
  })

  it('exige une justification avec element concret de l article', () => {
    expect(buildSystemPrompt()).toContain('justification')
    expect(buildSystemPrompt()).toContain('concret')
  })

  it('mentionne le fallback borderline pour atteindre le quota serendipite', () => {
    expect(buildSystemPrompt()).toContain('borderline')
  })
})

describe('buildUserPrompt', () => {
  it('inclut le profil texte', () => {
    const prompt = buildUserPrompt(PROFILE, CANDIDATES)
    expect(prompt).toContain('PM senior')
  })

  it('inclut le secteur', () => {
    const prompt = buildUserPrompt(PROFILE, CANDIDATES)
    expect(prompt).toContain('Produit')
  })

  it('inclut les centres d interet', () => {
    const prompt = buildUserPrompt(PROFILE, CANDIDATES)
    expect(prompt).toContain('IA')
    expect(prompt).toContain('startups')
  })

  it('inclut le quota serendipite calcule', () => {
    const prompt = buildUserPrompt(PROFILE, CANDIDATES)
    // 15% de 10 = 1-2 articles serendipite
    expect(prompt).toContain('15%')
  })

  it('inclut le titre du candidat', () => {
    const prompt = buildUserPrompt(PROFILE, CANDIDATES)
    expect(prompt).toContain('The future of product management')
  })

  it('inclut la structure JSON attendue', () => {
    const prompt = buildUserPrompt(PROFILE, CANDIDATES)
    expect(prompt).toContain('"scored"')
    expect(prompt).toContain('"accepted"')
  })

  it('profil sans texte libre fonctionne', () => {
    const profileMinimal: UserProfile = { ...PROFILE, profileText: null, sector: null }
    const prompt = buildUserPrompt(profileMinimal, CANDIDATES)
    expect(prompt).toContain('IA')
  })

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
