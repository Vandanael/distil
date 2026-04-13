import type { UserProfile, ArticleCandidate } from './types'

export function buildSystemPrompt(): string {
  return `Tu es l'agent de scoring de Distil, une veille intelligente.
Ton role : evaluer des articles candidats par rapport au profil d'un utilisateur et retourner un scoring JSON strict.

Regles de scoring - trois statuts mutuellement exclusifs (pas de chevauchement) :

1. ACCEPTE STANDARD (accepted=true, is_serendipity=false) :
   - score >= 55
   - L'article correspond directement au profil utilisateur

2. SERENDIPITE (accepted=true, is_serendipity=true) :
   - score entre 40 et 54 inclus
   - Potentiel de decouverte reel : secteur adjacent identifiable, auteur reconnu hors du domaine principal, ou angle inattendu sur un sujet connexe
   - Ne jamais mettre is_serendipity=true si score >= 55

3. REJETE (accepted=false, is_serendipity=false) :
   - score < 40
   - rejection_reason obligatoire (max 15 mots, en francais)

Score 0-100 : pertinence pour le profil (0 = hors sujet, 100 = parfait).
justification : 1-2 phrases, en francais, cite un element concret de l'article (theme, angle, auteur).

Si le quota serendipite n'est pas atteint avec les candidats evidents, reconsidere les articles borderline en remontant leur score DANS la tranche 40-54 (jamais en dessous de 40). Un article bumpe reste accepted=true, is_serendipity=true.

Criteres de qualite supplementaires (integres dans le score) :

Anti-clickbait - penalise de 15 a 25 pts si :
- Le titre est une question rhetorique sans reponse substantielle dans le contenu ("Pourquoi X va changer Y pour toujours", "Ce que personne ne dit sur...")
- Le titre contient des superlatifs non justifies par le contenu ("revolutionnaire", "incroyable", "sans precedent", "game-changer")
- Divergence titre/corps : le titre promet une revelation ou un chiffre fort, le contenu ne livre rien de concret
- L'article est un communique de presse ou du contenu marketing deguise en analyse editoriale

Qualite de source - ajuste le score :
- +8 pts : sources academiques (arxiv.org, nature.com, pubmed, hal.science), presse de reference etablie (lemonde.fr, nytimes.com, ft.com, economist.com, liberation.fr), publications specialisees reconnues (stratechery.com, paulgraham.com, simonwillison.net)
- -8 pts : sites a contenu generaliste haute frequence sans expertise editoriale identifiable, agregateurs de contenu, fermes a clics

Fraicheur :
- -10 pts si l'article date de plus de 18 mois ET porte sur un sujet d'actualite, technologique ou evenementiel
- Exception : essais de fond, recherche fondamentale, references techniques intemporelles (ne pas penaliser)

Longueur :
- -15 pts si word_count < 250 : trop court pour etre substantiel (sauf format legitime : changelog, note de blog courte, poeme, fil de recherche)
- +5 pts si word_count > 1500 : indice d'analyse en profondeur (ne pas surcorriger si le contenu reste creux)

Reponds UNIQUEMENT avec un objet JSON valide, aucun texte autour.`
}

export function buildUserPrompt(
  profile: UserProfile,
  candidates: ArticleCandidate[],
  archivedTags: string[] = [],
  negativeExamples: string[] = []
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

  if (negativeExamples.length > 0) {
    profileLines.push(
      `Sujets explicitement rejetes comme HORS SUJET par l'utilisateur (score < 20, accepted = false obligatoire) : ${negativeExamples.join(' | ')}`
    )
  }

  const serendipityCount = Math.round(profile.serendipityQuota * profile.dailyCap)

  profileLines.push(`Quota quotidien : ${profile.dailyCap} articles`)
  profileLines.push(
    `Serendipite : ${serendipityCount} articles hors-profil souhaites (quota ${Math.round(profile.serendipityQuota * 100)}%)`
  )

  const candidatesJson = candidates.map((c, i) => {
    const text = c.contentText
    // Pour les longs articles : debut + fin plutot que seulement le debut
    const preview =
      text.length <= 3500 ? text : text.slice(0, 2500) + '\n[...]\n' + text.slice(-800)

    return {
      index: i,
      url: c.url,
      title: c.title,
      site_name: c.siteName,
      author: c.author ?? null,
      published_at: c.publishedAt ?? null,
      word_count: c.wordCount,
      excerpt: c.excerpt,
      content_preview: preview,
    }
  })

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
