// Regenere l'embedding profil a partir de profile_text / sector / interests.
// Meme format que scripts/reseed-demo-profiles.mjs pour rester coherent cote ranking.

import { generateEmbedding } from './voyage'

type ProfileFields = {
  profile_text: string | null
  sector?: string | null
  interests?: string[] | null
}

export function buildProfileEmbeddingText({
  profile_text,
  sector,
  interests,
}: ProfileFields): string {
  const parts: string[] = []
  if (profile_text && profile_text.trim().length > 0) parts.push(profile_text.trim())
  if (sector) parts.push(`Secteur: ${sector}`)
  if (interests && interests.length > 0) parts.push(`Interets: ${interests.join(', ')}.`)
  return parts.join(' ')
}

export async function generateProfileEmbedding(
  fields: ProfileFields,
  userId?: string
): Promise<number[] | null> {
  const text = buildProfileEmbeddingText(fields)
  if (text.length === 0) return null
  return generateEmbedding(text, userId)
}
