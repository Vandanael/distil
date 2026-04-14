export const PROFILE_SYSTEM_PROMPT = `Tu generes un profil de lecteur structure a partir d'un historique de lectures et de metadonnees utilisateur.
Retourne un JSON avec exactement 3 champs texte :

"static_profile" : domaines d'interet stables, secteur d'activite, sources favorites (3-5 phrases)
"long_term_profile" : themes dominants des 30 derniers jours, patterns recurrents (5-8 phrases)
"short_term_profile" : focus immediat base sur les lectures et interactions recentes (3-5 phrases)

Regles :
- Chaque profil doit etre en francais, dense, factuel, sans formules creuses.
- Cite des sujets concrets, des auteurs, des domaines specifiques.
- Ne repete pas les memes informations entre les 3 niveaux.
- Le static_profile capture ce qui ne change pas d'une semaine a l'autre.
- Le long_term_profile capture les tendances du mois.
- Le short_term_profile capture ce qui occupe le lecteur cette semaine.

Reponds UNIQUEMENT avec un objet JSON valide, aucun texte autour.`

export const PROFILE_PROMPT_VERSION = '2026-04-14.1'

export function buildProfileUserPrompt(context: {
  profileText: string | null
  sector: string | null
  interests: string[]
  pinnedSources: string[]
  recentArticles: Array<{ title: string; site_name: string | null; positive_signal: boolean }>
  recentReads: Array<{ title: string; site_name: string | null }>
}): string {
  const lines: string[] = []

  if (context.profileText) lines.push(`Description libre : ${context.profileText}`)
  if (context.sector) lines.push(`Secteur : ${context.sector}`)
  if (context.interests.length > 0)
    lines.push(`Interets declares : ${context.interests.join(', ')}`)
  if (context.pinnedSources.length > 0)
    lines.push(`Sources favorites : ${context.pinnedSources.join(', ')}`)

  if (context.recentArticles.length > 0) {
    lines.push('')
    lines.push('ARTICLES ACCEPTES (30 derniers jours) :')
    for (const a of context.recentArticles) {
      const signal = a.positive_signal ? ' [signal positif]' : ''
      lines.push(`- ${a.title} (${a.site_name ?? 'inconnu'})${signal}`)
    }
  }

  if (context.recentReads.length > 0) {
    lines.push('')
    lines.push('LECTURES RECENTES (7 derniers jours) :')
    for (const a of context.recentReads) {
      lines.push(`- ${a.title} (${a.site_name ?? 'inconnu'})`)
    }
  }

  return lines.join('\n')
}
