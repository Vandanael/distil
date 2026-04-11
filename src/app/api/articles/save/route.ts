import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateTokenFormat, hashToken } from '@/lib/tokens/api-tokens'
import { parseUrl } from '@/lib/parsing/readability'
import { runScoringAgent } from '@/lib/agents/scoring-agent'
import { generateEmbedding } from '@/lib/embeddings/voyage'
import type { UserProfile, ArticleCandidate } from '@/lib/agents/types'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

// Preflight CORS pour les requetes bookmarklet cross-origin
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { error: 'Supabase non configure' },
      { status: 503, headers: CORS_HEADERS }
    )
  }

  // Authentification par Bearer token
  const authHeader = request.headers.get('Authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token || !validateTokenFormat(token)) {
    return NextResponse.json(
      { error: 'Token invalide ou manquant' },
      { status: 401, headers: CORS_HEADERS }
    )
  }

  // Client service_role : bypass RLS pour la lookup token (user non authentifie par cookie)
  const supabase = createClient(supabaseUrl, serviceRoleKey)

  const tokenHash = await hashToken(token)
  const { data: tokenRow } = await supabase
    .from('api_tokens')
    .select('id, user_id')
    .eq('token_hash', tokenHash)
    .single()

  if (!tokenRow) {
    return NextResponse.json(
      { error: 'Token inconnu ou revoque' },
      { status: 401, headers: CORS_HEADERS }
    )
  }

  const { user_id: userId, id: tokenId } = tokenRow

  // Mise a jour last_used_at (best-effort, non bloquant)
  void supabase
    .from('api_tokens')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', tokenId)

  // Extraire l'URL du body
  const body: unknown = await request.json().catch(() => null)
  const url =
    body &&
    typeof body === 'object' &&
    'url' in body &&
    typeof (body as Record<string, unknown>).url === 'string'
      ? (body as { url: string }).url
      : null

  if (!url) {
    return NextResponse.json(
      { error: 'Corps invalide : { url: string } attendu' },
      { status: 400, headers: CORS_HEADERS }
    )
  }

  // Verifier doublon
  const { data: existing } = await supabase
    .from('articles')
    .select('id')
    .eq('user_id', userId)
    .eq('url', url)
    .single()

  if (existing) {
    return NextResponse.json(
      { error: 'already_exists', articleId: existing.id },
      { status: 409, headers: CORS_HEADERS }
    )
  }

  // Parser l'URL
  let parsed: Awaited<ReturnType<typeof parseUrl>>
  try {
    parsed = await parseUrl(url)
  } catch {
    return NextResponse.json(
      { error: 'Impossible de parser cette URL' },
      { status: 422, headers: CORS_HEADERS }
    )
  }

  // Charger le profil utilisateur
  const { data: profile } = await supabase
    .from('profiles')
    .select(
      'profile_text, profile_structured, sector, interests, pinned_sources, daily_cap, serendipity_quota'
    )
    .eq('id', userId)
    .single()

  if (!profile) {
    return NextResponse.json(
      { error: 'Profil introuvable' },
      { status: 404, headers: CORS_HEADERS }
    )
  }

  const userProfile: UserProfile = {
    profileText: profile.profile_text ?? null,
    profileStructured: profile.profile_structured ?? null,
    sector: profile.sector ?? null,
    interests: profile.interests ?? [],
    pinnedSources: profile.pinned_sources ?? [],
    dailyCap: profile.daily_cap ?? 10,
    serendipityQuota: profile.serendipity_quota ?? 0.15,
  }

  const candidate: ArticleCandidate = {
    url: parsed.url,
    title: parsed.title,
    excerpt: parsed.excerpt,
    contentText: parsed.contentText,
    siteName: parsed.siteName,
    author: parsed.author ?? null,
    publishedAt: parsed.publishedAt ?? null,
  }

  // Scorer l'article
  const result = await runScoringAgent({
    profile: userProfile,
    candidates: [candidate],
    runId: 'bookmarklet',
  })

  const scored = result.scored[0]
  if (!scored) {
    return NextResponse.json({ error: 'Scoring echoue' }, { status: 500, headers: CORS_HEADERS })
  }

  // Persister
  const { data: inserted } = await supabase
    .from('articles')
    .insert({
      user_id: userId,
      url: parsed.url,
      title: parsed.title,
      author: parsed.author,
      site_name: parsed.siteName,
      published_at: parsed.publishedAt,
      content_html: parsed.contentHtml,
      content_text: parsed.contentText,
      excerpt: parsed.excerpt,
      word_count: parsed.wordCount,
      reading_time_minutes: parsed.readingTimeMinutes,
      og_image_url: parsed.ogImageUrl,
      score: scored.score,
      justification: scored.justification,
      is_serendipity: scored.isSerendipity,
      rejection_reason: scored.rejectionReason,
      status: scored.accepted ? 'accepted' : 'rejected',
      origin: 'bookmarklet',
      scored_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  // Embedding best-effort
  if (inserted && process.env.VOYAGE_API_KEY && parsed.contentText) {
    void generateEmbedding(parsed.contentText).then((embedding) =>
      supabase.from('articles').update({ embedding }).eq('id', inserted.id)
    )
  }

  return NextResponse.json(
    {
      articleId: inserted?.id ?? null,
      accepted: scored.accepted,
      score: scored.score,
      rejectionReason: scored.rejectionReason,
    },
    { status: 200, headers: CORS_HEADERS }
  )
}
