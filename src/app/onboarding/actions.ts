'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { generateProfileEmbedding } from '@/lib/embeddings/profile-embedding'
import { logError } from '@/lib/errors/log-error'
import { redirect } from 'next/navigation'
import { rankForUser } from '@/lib/agents/ranking-agent'
import { embedNewItems } from '@/lib/ingestion/embed-items'

export type ProfileInput = {
  method: 'express' | 'wizard'
  profile_text?: string
  interests?: string[]
  pinned_sources?: string[]
  daily_cap?: number
  serendipity_quota?: number
  language?: 'fr' | 'en' | 'both'
}

// Seuil minimum pour considérer l'édition comme valide.
const RANKING_MIN_ARTICLES = 5
// Timeout applicatif global couvrant le premier ranking + embed + retry.
const RANKING_TIMEOUT_MS = 60_000

/**
 * Déclenche le ranking synchrone pour la première édition du nouvel utilisateur.
 * Logique en 3 branches explicites :
 *   1. Succès direct (>= RANKING_MIN_ARTICLES) → first_edition_empty = false
 *   2. Fallback (embed items manquants + retry)  → first_edition_empty = false si réussi
 *   3. Échec final (timeout ou retry insuffisant) → first_edition_empty = true
 *
 * Les erreurs sont non-bloquantes : l'utilisateur est toujours redirigé.
 */
async function triggerFirstEditionRanking(userId: string): Promise<void> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) return

  const supabase = createServiceClient(supabaseUrl, supabaseServiceKey)

  // Timeout partagé couvrant l'intégralité du flux (premier ranking + embed + retry).
  // maxDuration = 90 sur la page garantit que Netlify ne coupe pas avant ce seuil.
  let clearRankingTimeout = () => {}
  const timeoutPromise = new Promise<never>((_, reject) => {
    const id = setTimeout(() => reject(new Error('ranking_timeout')), RANKING_TIMEOUT_MS)
    clearRankingTimeout = () => clearTimeout(id)
  })

  try {
    const result = await Promise.race([rankForUser(supabase, userId), timeoutPromise])

    if (result.editionSize >= RANKING_MIN_ARTICLES) {
      // Branche 1 : édition suffisante dès le premier ranking.
      await supabase.from('profiles').update({ first_edition_empty: false }).eq('id', userId)
    } else {
      // Branche 2 : pool insuffisant, on embed les items récents sans embeddings puis on retry.
      await Promise.race([embedNewItems(), timeoutPromise])

      // Suppression des entrées du premier ranking avant retry (guard "déjà classé aujourd'hui").
      // Safe : utilisateur nouvellement créé, aucune donnée antérieure légitime.
      // Si ce code est réutilisé ailleurs, ajouter une protection sur la date de création du user.
      const today = new Date().toISOString().slice(0, 10)
      const todayStart = new Date()
      todayStart.setUTCHours(0, 0, 0, 0)
      await supabase.from('daily_ranking').delete().eq('user_id', userId).eq('date', today)
      await supabase
        .from('articles')
        .delete()
        .eq('user_id', userId)
        .gte('last_shown_in_edition_at', todayStart.toISOString())

      const retryResult = await Promise.race([rankForUser(supabase, userId), timeoutPromise])

      if (retryResult.editionSize >= RANKING_MIN_ARTICLES) {
        // Branche 2a : retry suffisant.
        await supabase.from('profiles').update({ first_edition_empty: false }).eq('id', userId)
      } else {
        // Branche 2b : retry insuffisant, pool durablement pauvre pour ce profil.
        await supabase.from('profiles').update({ first_edition_empty: true }).eq('id', userId)
      }
    }

    clearRankingTimeout()
  } catch (err) {
    clearRankingTimeout()
    if (!(err instanceof Error && err.message === 'ranking_timeout')) {
      await logError({ route: 'onboarding.triggerFirstEditionRanking', error: err, userId })
    }
    // Branche 3 : timeout ou erreur inattendue, l'utilisateur verra l'écran dédié.
    await supabase.from('profiles').update({ first_edition_empty: true }).eq('id', userId)
  }
}

export async function createProfile(input: ProfileInput) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Non authentifie')
  }

  const profileStructured = input.language ? { language: input.language } : null

  // Regenere l'embedding en amont : sans lui, le ranking retourne un feed vide.
  let embeddingJson: string | null = null
  try {
    const vector = await generateProfileEmbedding(
      {
        profile_text: input.profile_text ?? null,
        interests: input.interests ?? [],
      },
      user.id
    )
    if (vector) embeddingJson = JSON.stringify(vector)
  } catch (err) {
    await logError({
      route: 'onboarding.createProfile.embedding',
      error: err,
      userId: user.id,
    })
  }

  const { error } = await supabase.from('profiles').upsert({
    id: user.id,
    profile_text: input.profile_text ?? null,
    interests: input.interests ?? [],
    pinned_sources: input.pinned_sources ?? [],
    daily_cap: input.daily_cap ?? 10,
    serendipity_quota: input.serendipity_quota ?? 0.15,
    onboarding_completed: true,
    onboarding_method: input.method,
    profile_structured: profileStructured,
    ...(embeddingJson ? { embedding: embeddingJson } : {}),
  })

  if (error) {
    throw new Error(error.message)
  }

  // Déclenche le ranking synchrone pour garantir une première édition immédiate.
  // Erreurs internes gérées dans triggerFirstEditionRanking : l'utilisateur est
  // redirigé dans tous les cas.
  await triggerFirstEditionRanking(user.id)

  redirect('/onboarding/welcome')
}
