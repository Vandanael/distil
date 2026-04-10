import type { UserProfile, ArticleCandidate } from './types'

export function buildSystemPrompt(): string {
  return `Tu es l'agent de scoring de Distil, une veille intelligente.
Ton role : evaluer des articles candidats par rapport au profil d'un utilisateur et retourner un scoring JSON strict.

Regles de scoring :
- Score 0-100 : pertinence pour le profil (0 = hors sujet, 100 = parfait)
- Seuil d'acceptation : score >= 40
- is_serendipity : true si l'article est hors du profil principal mais intellectuellement adjacent et stimulant
- rejection_reason : obligatoire si accepted = false, concis (max 15 mots), en francais
- justification : 1-2 phrases, en francais, explique pourquoi l'article correspond ou non

Reponds UNIQUEMENT avec un objet JSON valide, aucun texte autour.`
}

export function buildUserPrompt(
  profile: UserProfile,
  candidates: ArticleCandidate[],
  archivedTags: string[] = []
): string {
  const profileLines: string[] = []

  if (profile.profileText) {
    profileLines.push(`Description libre : ${profile.profileText}`)
  }
  if (profile.sector) {
    profileLines.push(`Secteur : ${profile.sector}`)
  }
  if (profile.interests.length > 0) {
    profileLines.push(`Centres d'interet : ${profile.interests.join(', ')}`)
  }
  if (profile.pinnedSources.length > 0) {
    profileLines.push(`Sources favorites : ${profile.pinnedSources.join(', ')}`)
  }

  if (archivedTags.length > 0) {
    profileLines.push(
      `Sujets lus et archives recemment : ${archivedTags.join(', ')} (signaux d'interet confirmes)`
    )
  }

  const serendipityCount = Math.round(profile.serendipityQuota * profile.dailyCap)

  profileLines.push(`Quota quotidien : ${profile.dailyCap} articles`)
  profileLines.push(
    `Serendipite : ${serendipityCount} articles hors-profil souhaites (quota ${Math.round(profile.serendipityQuota * 100)}%)`
  )

  const candidatesJson = candidates.map((c, i) => ({
    index: i,
    url: c.url,
    title: c.title,
    site_name: c.siteName,
    excerpt: c.excerpt,
    content_preview: c.contentText.slice(0, 800),
  }))

  return `PROFIL UTILISATEUR :
${profileLines.join('\n')}

ARTICLES CANDIDATS (${candidates.length}) :
${JSON.stringify(candidatesJson, null, 2)}

Retourne un JSON avec cette structure exacte :
{
  "scored": [
    {
      "url": "...",
      "score": 0-100,
      "justification": "...",
      "is_serendipity": false,
      "rejection_reason": null,
      "accepted": true
    }
  ]
}`
}
