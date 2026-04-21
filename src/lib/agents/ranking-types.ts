export type RankingCandidate = {
  itemId: string
  url: string
  title: string | null
  author: string | null
  siteName: string | null
  publishedAt: string | null
  contentPreview: string
  wordCount: number
  distance: number
  unpopScore: number
  isKeywordHit: boolean
  matchedKeywords: string[]
  keywordRank: number
}

export type RankedItem = {
  itemId: string
  q1: number
  q2: number
  q3: number
  justification: string
  bucket: 'essential' | 'surprise'
  rank: number
  belowNormalThreshold?: boolean
}

export type RankingResult = {
  userId: string
  date: string
  essential: RankedItem[]
  surprise: RankedItem[]
  fallback: boolean
  modelUsed: string | null
  candidatesCount: number
  keywordHitsCount: number
  keywordHitsPromoted: number
  keywordHitsForceInjected: number
  editionSize: number
  error: string | null
  durationMs: number
}
