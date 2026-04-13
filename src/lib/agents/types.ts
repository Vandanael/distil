export type UserProfile = {
  profileText: string | null
  profileStructured: Record<string, unknown> | null
  sector: string | null
  interests: string[]
  pinnedSources: string[]
  dailyCap: number
  serendipityQuota: number
}

export type ArticleCandidate = {
  url: string
  title: string | null
  excerpt: string | null
  contentText: string
  siteName: string | null
  author: string | null
  publishedAt: string | null
  wordCount: number
}

export type ScoredArticle = {
  url: string
  score: number // 0-100
  justification: string
  isSerendipity: boolean
  rejectionReason: string | null
  accepted: boolean
}

export type ScoringFunctionResult = {
  scored: ScoredArticle[]
  modelUsed: string
}

export type ScoringRequest = {
  profile: UserProfile
  candidates: ArticleCandidate[]
  runId: string
  archivedTags?: string[]
  negativeExamples?: string[] // titres/sujets rejetes comme hors sujet
}

export type ScoringResult = {
  runId: string
  scored: ScoredArticle[]
  agentType: 'managed' | 'messages'
  modelUsed: string | null
  promptVersion: string
  durationMs: number
  error: string | null
}
