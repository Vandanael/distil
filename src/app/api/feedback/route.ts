import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logFeedback } from '@/lib/feedback/log'
import { enforceRateLimit } from '@/lib/api-rate-limit'

const VALID_ACTIONS = ['skip', 'saved'] as const
type FeedbackAction = (typeof VALID_ACTIONS)[number]

export async function POST(request: Request) {
  const blocked = await enforceRateLimit('userAction', request)
  if (blocked) return blocked

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
  if (!body) {
    return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 })
  }
  const action = body.action as string
  if (!VALID_ACTIONS.includes(action as FeedbackAction)) {
    return NextResponse.json(
      { error: `Action invalide. Valides: ${VALID_ACTIONS.join(', ')}` },
      { status: 400 }
    )
  }

  await logFeedback(supabase, user.id, action as FeedbackAction, {
    articleId: (body.articleId as string) ?? undefined,
    itemId: (body.itemId as string) ?? undefined,
    secondsOnPage: typeof body.secondsOnPage === 'number' ? body.secondsOnPage : undefined,
  })

  return NextResponse.json({ ok: true })
}
