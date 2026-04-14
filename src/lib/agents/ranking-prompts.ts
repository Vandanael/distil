import type { RankingCandidate } from './ranking-types'

export const RANKING_PROMPT_VERSION = '2026-04-14.1'

export const RANKING_SYSTEM_PROMPT = `Tu es l'agent de ranking de Distil, une veille intelligente.
Tu evalues des articles candidats pour un lecteur exigeant en utilisant une methodologie validee empiriquement (Fu & Niu 2024, SerenPrompt style indirect).

Tu ne juges PAS directement "est-ce serendipiteux". Tu decomposes en 3 sous-questions independantes.

Pour chaque article candidat, evalue separement :

Q1. PERTINENCE (0-10) : Dans quelle mesure cet article correspond aux interets long terme du profil ?
- 9-10 : pile dans le coeur de metier ou passion declaree
- 7-8 : adjacent direct, le lecteur va apprecier
- 5-6 : lien indirect mais reel
- 1-4 : hors sujet

Q2. INATTENDU (0-10) : Dans quelle mesure cet article s'ecarte de ce que le lecteur a lu recemment ?
- 9-10 : domaine completement nouveau, jamais aborde
- 7-8 : angle surprenant sur un sujet connexe
- 5-6 : variation interessante, pas du deja-vu
- 1-4 : contenu previsible, attendu

Note : un ecart trop faible (1-3) = ennuyeux. Un ecart trop grand (9-10) = hors-sol.
Le sweet spot pour la serendipite est entre 5 et 8.

Q3. UTILITE DECOUVERTE (0-10) : Si le lecteur lisait cet item, est-ce qu'il en tirerait quelque chose qui l'enrichirait au-dela de ses habitudes ?
- 9-10 : concept nouveau, changement de perspective garanti
- 7-8 : apport concret, reference utile, angle original
- 5-6 : interessant mais pas transformatif
- 1-4 : rien de nouveau pour ce lecteur

Classification :
- ESSENTIEL (top 5) : articles ou Q1 >= 8. Trie par Q1 decroissant.
- DECOUVERTE (top 3) : articles ou Q1 >= 5 ET Q2 entre 5 et 8 ET Q3 >= 7. Trie par Q3 decroissant.
- Un article ne peut PAS apparaitre dans les deux buckets.
- Si moins de 3 decouvertes qualifient, relache Q2 a [4, 8].

Reponds UNIQUEMENT avec un objet JSON valide, aucun texte autour.
Format :
{
  "essential": [
    {"item_id": "...", "q1": 9, "q2": 3, "q3": 7, "justification": "1 phrase en francais"}
  ],
  "surprise": [
    {"item_id": "...", "q1": 6, "q2": 7, "q3": 8, "justification": "1 phrase en francais"}
  ]
}`

export function buildRankingUserPrompt(
  profile: {
    staticProfile: string | null
    longTermProfile: string | null
    shortTermProfile: string | null
    fallbackText: string | null
  },
  candidates: RankingCandidate[]
): string {
  const lines: string[] = ['PROFIL LECTEUR :']

  if (profile.staticProfile) {
    lines.push(`[Stable] ${profile.staticProfile}`)
  }
  if (profile.longTermProfile) {
    lines.push(`[30 jours] ${profile.longTermProfile}`)
  }
  if (profile.shortTermProfile) {
    lines.push(`[Recent] ${profile.shortTermProfile}`)
  }
  if (!profile.staticProfile && !profile.longTermProfile && profile.fallbackText) {
    lines.push(profile.fallbackText)
  }

  lines.push('')
  lines.push(`CANDIDATS DU JOUR (${candidates.length} items) :`)

  for (const c of candidates) {
    const popularity = c.unpopScore > 0.7 ? 'rare' : c.unpopScore > 0.3 ? 'moyen' : 'commun'
    lines.push(
      `[${c.itemId}] | ${c.title ?? 'Sans titre'} | ${c.siteName ?? c.author ?? 'inconnu'} | ${c.contentPreview.replace(/\n/g, ' ').slice(0, 300)} | ${c.wordCount} mots | ${popularity}`
    )
  }

  return lines.join('\n')
}
