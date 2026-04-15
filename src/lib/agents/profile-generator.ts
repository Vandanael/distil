import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { PROFILE_SYSTEM_PROMPT, buildProfileUserPrompt } from './profile-prompts'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabaseClient = SupabaseClient<any, any, any>

const MODEL = 'gemini-2.5-flash'

type ProfileOutput = {
  static_profile: string
  long_term_profile: string
  short_term_profile: string
}

export type ProfileGenResult = {
  userId: string
  generated: boolean
  error: string | null
}

async function generateForUser(
  supabase: AnySupabaseClient,
  userId: string,
  profile: {
    profile_text: string | null
    sector: string | null
    interests: string[]
    pinned_sources: string[]
  }
): Promise<ProfileGenResult> {
  const apiKey = process.env.GOOGLE_AI_API_KEY
  if (!apiKey) {
    return { userId, generated: false, error: 'GOOGLE_AI_API_KEY manquante' }
  }

  try {
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()

    // Fetch recent articles + reads in parallel
    const [articlesResult, readsResult] = await Promise.all([
      supabase
        .from('articles')
        .select('title, site_name, positive_signal')
        .eq('user_id', userId)
        .in('status', ['accepted', 'read', 'archived'])
        .gte('scored_at', thirtyDaysAgo)
        .order('scored_at', { ascending: false })
        .limit(50),
      supabase
        .from('articles')
        .select('title, site_name')
        .eq('user_id', userId)
        .eq('status', 'read')
        .gte('read_at', sevenDaysAgo)
        .order('read_at', { ascending: false })
        .limit(20),
    ])

    const userPrompt = buildProfileUserPrompt({
      profileText: profile.profile_text,
      sector: profile.sector,
      interests: profile.interests ?? [],
      pinnedSources: profile.pinned_sources ?? [],
      recentArticles: (articlesResult.data ?? []).map((a) => ({
        title: a.title ?? 'Sans titre',
        site_name: a.site_name,
        positive_signal: a.positive_signal ?? false,
      })),
      recentReads: (readsResult.data ?? []).map((a) => ({
        title: a.title ?? 'Sans titre',
        site_name: a.site_name,
      })),
    })

    const { assertBudget, recordProviderCall } = await import('@/lib/api-budget')
    await assertBudget('gemini')

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
      model: MODEL,
      systemInstruction: PROFILE_SYSTEM_PROMPT,
      generationConfig: {
        responseMimeType: 'application/json',
        maxOutputTokens: 2048,
        // @ts-expect-error - thinkingConfig not typed in SDK
        thinkingConfig: { thinkingBudget: 0 },
      },
    })

    const result = await model.generateContent(userPrompt)
    const text = result.response.text()
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('Aucun JSON dans la reponse')

    const parsed: ProfileOutput = JSON.parse(match[0])
    recordProviderCall('gemini')

    if (!parsed.static_profile || !parsed.long_term_profile || !parsed.short_term_profile) {
      throw new Error('Profil incomplet : champs manquants')
    }

    // Upsert profile
    await supabase.from('user_profile_text').upsert(
      {
        user_id: userId,
        static_profile: parsed.static_profile,
        long_term_profile: parsed.long_term_profile,
        short_term_profile: parsed.short_term_profile,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )

    return { userId, generated: true, error: null }
  } catch (err) {
    return { userId, generated: false, error: err instanceof Error ? err.message : String(err) }
  }
}

export async function generateProfiles(): Promise<ProfileGenResult[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase non configure')
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, profile_text, sector, interests, pinned_sources')
    .eq('onboarding_completed', true)

  if (error || !profiles) {
    throw new Error(`Impossible de charger les profils: ${error?.message}`)
  }

  const results: ProfileGenResult[] = []
  for (const profile of profiles) {
    const result = await generateForUser(supabase, profile.id, profile)
    results.push(result)
  }

  return results
}
