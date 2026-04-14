import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { logFeedback } from '@/lib/feedback/log'

const VALID_ACTIONS = ['read_full', 'skip', 'saved', 'surprised_useful'] as const
type FeedbackAction = (typeof VALID_ACTIONS)[number]

export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'misconfigured' }, { status: 500 })
  }

  const cookieStore = await cookies()
  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (toSet) => {
        for (const { name, value, options } of toSet) {
          cookieStore.set(name, value, options)
        }
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const body = (await request.json()) as Record<string, unknown>
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
