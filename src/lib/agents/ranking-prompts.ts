import { isReferenceDomain } from './sources'
import type { RankingCandidate } from './ranking-types'

export type RecentSignal = {
  title: string | null
  siteName: string | null
}

export type RecentSignals = {
  positive: RecentSignal[]
  rejected: RecentSignal[]
}

// Cap du nombre de signaux injectes par prompt. Au-dela, le bruit dilue le
// signal et la fenetre de contexte enfle inutilement (cf. ADR-012).
export const MAX_SIGNALS_PER_BUCKET = 20

export type RankingLocale = 'fr' | 'en'

const RANKING_SYSTEM_PROMPT_FR = `Tu es l'agent de ranking de Distil, une veille intelligente.
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
- EXCLUSION DURE : si Q1 < 6, l'article est hors-sujet pour ce lecteur. Il n'entre NI dans essential NI dans surprise, quelles que soient les valeurs de Q2/Q3. Aucune exception.
- ESSENTIEL (top 5) : articles ou Q1 >= 8. Trie par Q1 decroissant.
- DECOUVERTE (top 3) : articles ou Q1 >= 6 ET Q2 entre 5 et 8 ET Q3 >= 7. Trie par Q3 decroissant.
- Un article ne peut PAS apparaitre dans les deux buckets.
- Si moins de 3 decouvertes qualifient, relache Q2 a [4, 8]. Ne relache jamais Q1 < 6.

Articles [MATCH] :
- Certains candidats sont prefixes [MATCH:kw1,kw2]. Ces articles ont ete explicitement demandes par le lecteur via un mot-cle declare dans son profil.
- Evalue-les sur leur merite propre (Q1/Q2/Q3) sans biais.
- Tu peux les exclure uniquement si Q1 < 6, c'est-a-dire si l'article ne tient pas la promesse du mot-cle (homonymie, sujet effleure, angle hors-sujet).
- A Q1 >= 6, un article [MATCH] doit apparaitre dans essential ou surprise. Ne l'ignore pas silencieusement.

Densite et sources de reference :
- A Q1 egal, privilegie les articles de 800 mots ou plus : le format long est un marqueur de profondeur editoriale.
- A Q1 egal, privilegie les candidats suffixes "ref" dans la ligne : ces sources sont des references etablies du domaine (arxiv, Nature, Le Monde, Stratechery, etc.).
- Ces preferences departagent des ex aequo ; elles ne justifient jamais de garder un article Q1 < 6.

Regles pour la justification (1 phrase, francais) :
- Parle du contenu de l'article, jamais du lecteur.
- Interdit : "qui vous interesse", "pour vous", "qui va vous plaire",
  "correspond a votre profil", "dans votre domaine", "que vous aimez".
- Pour qualifier une source, dire "source solide", "reference du domaine",
  "publication de reference". Jamais "comme [nom de media]".
- Concret et specifique. Pas de formule generique.

Bons exemples :
- "Analyse detaillee du shift MLOps chez OpenAI, avec chiffres internes."
- "Methode pratique pour structurer un 1:1, cas d'usage concrets."
- "Reference du domaine design systems, premiere synthese sur le sujet."

Mauvais (a eviter) :
- "Article qui vous interessera sur le ML." (parle du lecteur)
- "Source de qualite comme le NYT." (fait la comparaison)
- "Dans votre domaine de predilection." (presume, vague)

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

const RANKING_SYSTEM_PROMPT_EN = `You are Distil's ranking agent, a smart curation service.
You evaluate candidate articles for a demanding reader using an empirically validated methodology (Fu & Niu 2024, SerenPrompt indirect style).

You do NOT directly judge "is this serendipitous". You decompose into 3 independent sub-questions.

For each candidate article, evaluate separately:

Q1. RELEVANCE (0-10): How much does this article match the reader's long-term interests?
- 9-10: squarely in their core field or declared passion
- 7-8: directly adjacent, the reader will enjoy it
- 5-6: indirect but real link
- 1-4: off-topic

Q2. UNEXPECTED (0-10): How much does this article diverge from what the reader has read recently?
- 9-10: completely new domain, never touched
- 7-8: surprising angle on a related topic
- 5-6: interesting variation, not deja-vu
- 1-4: predictable, expected content

Note: too small a gap (1-3) = boring. Too large a gap (9-10) = off-ground.
The sweet spot for serendipity is between 5 and 8.

Q3. DISCOVERY USEFULNESS (0-10): If the reader read this item, would they take away something that enriches them beyond their habits?
- 9-10: new concept, perspective shift guaranteed
- 7-8: concrete contribution, useful reference, original angle
- 5-6: interesting but not transformative
- 1-4: nothing new for this reader

Classification:
- HARD EXCLUSION: if Q1 < 6, the article is off-topic for this reader. It enters NEITHER essential NOR surprise, regardless of Q2/Q3. No exception.
- ESSENTIAL (top 5): articles where Q1 >= 8. Sorted by Q1 descending.
- DISCOVERY (top 3): articles where Q1 >= 6 AND Q2 between 5 and 8 AND Q3 >= 7. Sorted by Q3 descending.
- An article CANNOT appear in both buckets.
- If fewer than 3 discoveries qualify, loosen Q2 to [4, 8]. Never loosen Q1 < 6.

[MATCH] articles:
- Some candidates are prefixed [MATCH:kw1,kw2]. These articles were explicitly requested by the reader via a keyword declared in their profile.
- Evaluate them on their own merit (Q1/Q2/Q3) without bias.
- You may exclude them only if Q1 < 6, i.e. if the article does not deliver on the keyword (homonymy, topic brushed, off-topic angle).
- At Q1 >= 6, a [MATCH] article must appear in essential or surprise. Do not silently ignore it.

Density and reference sources:
- At equal Q1, prefer articles of 800 words or more: the long format is a marker of editorial depth.
- At equal Q1, prefer candidates suffixed "ref" in the line: these sources are established references in the field (arxiv, Nature, Le Monde, Stratechery, etc.).
- These preferences break ties; they never justify keeping a Q1 < 6 article.

Rules for the justification (1 sentence, in English):
- Talk about the content of the article, never about the reader.
- Forbidden: "that interests you", "for you", "that you will like",
  "matches your profile", "in your field", "that you like".
- To qualify a source, say "solid source", "reference in the field",
  "reference publication". Never "like [media name]".
- Concrete and specific. No generic phrasing.

Good examples:
- "Detailed analysis of the MLOps shift at OpenAI, with internal figures."
- "Practical method for structuring a 1:1, concrete use cases."
- "Reference in design systems, first synthesis on the topic."

Bad (avoid):
- "Article that will interest you on ML." (talks about the reader)
- "Quality source like the NYT." (makes the comparison)
- "In your field of predilection." (presumes, vague)

Reply ONLY with a valid JSON object, no surrounding text.
Format:
{
  "essential": [
    {"item_id": "...", "q1": 9, "q2": 3, "q3": 7, "justification": "1 sentence in English"}
  ],
  "surprise": [
    {"item_id": "...", "q1": 6, "q2": 7, "q3": 8, "justification": "1 sentence in English"}
  ]
}`

// Alias retro-compatibilite : les tests existants ciblent la version FR.
export const RANKING_SYSTEM_PROMPT = RANKING_SYSTEM_PROMPT_FR

export function getRankingSystemPrompt(locale: RankingLocale = 'fr'): string {
  return locale === 'en' ? RANKING_SYSTEM_PROMPT_EN : RANKING_SYSTEM_PROMPT_FR
}

function formatSignalLine(s: RecentSignal): string {
  const title = (s.title ?? 'Sans titre').slice(0, 200)
  const site = s.siteName ?? 'inconnu'
  return `- ${title} | ${site}`
}

export function buildRankingUserPrompt(
  profile: {
    staticProfile: string | null
    longTermProfile: string | null
    shortTermProfile: string | null
    fallbackText: string | null
  },
  candidates: RankingCandidate[],
  signals?: RecentSignals
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

  // Bloc signaux courts (ADR-012). Le profil reste la source principale,
  // les signaux ajustent au niveau in-context sans reentrainer l'embedding.
  const positive = signals?.positive ?? []
  const rejected = signals?.rejected ?? []
  if (positive.length > 0 || rejected.length > 0) {
    lines.push('')
    lines.push('SIGNAUX RECENTS (14 jours) :')
    if (positive.length > 0) {
      lines.push('Appreciations explicites (a considerer comme pertinent pour ce lecteur) :')
      for (const s of positive.slice(0, MAX_SIGNALS_PER_BUCKET)) lines.push(formatSignalLine(s))
    }
    if (rejected.length > 0) {
      lines.push('Articles rejetes (hors sujet pour ce lecteur) :')
      for (const s of rejected.slice(0, MAX_SIGNALS_PER_BUCKET)) lines.push(formatSignalLine(s))
    }
  }

  lines.push('')
  lines.push(`CANDIDATS DU JOUR (${candidates.length} items) :`)

  for (const c of candidates) {
    const popularity = c.unpopScore > 0.7 ? 'rare' : c.unpopScore > 0.3 ? 'moyen' : 'commun'
    const matchPrefix =
      c.isKeywordHit && c.matchedKeywords.length > 0
        ? `[MATCH:${c.matchedKeywords.join(',')}] `
        : ''
    const refSuffix = isReferenceDomain(c.siteName) ? ', ref' : ''
    lines.push(
      `${matchPrefix}[${c.itemId}] | ${c.title ?? 'Sans titre'} | ${c.siteName ?? c.author ?? 'inconnu'} | ${c.contentPreview.replace(/\n/g, ' ').slice(0, 300)} | ${c.wordCount} mots${refSuffix} | ${popularity}`
    )
  }

  return lines.join('\n')
}
