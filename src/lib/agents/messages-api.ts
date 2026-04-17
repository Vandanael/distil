import type { ArticleCandidate, ScoringFunctionResult, UserProfile } from './types'
import { scoreWithGemini } from './gemini-api'

export async function scoreWithMessagesApi(
  profile: UserProfile,
  candidates: ArticleCandidate[],
  archivedTags: string[] = [],
  negativeExamples: string[] = []
): Promise<ScoringFunctionResult> {
  return scoreWithGemini(profile, candidates, archivedTags, negativeExamples)
}
