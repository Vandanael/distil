import { type SupabaseClient } from '@supabase/supabase-js'

type FeedbackAction = 'read_full' | 'skip' | 'saved' | 'surprised_useful'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabaseClient = SupabaseClient<any, any, any>

export async function logFeedback(
  supabase: AnySupabaseClient,
  userId: string,
  action: FeedbackAction,
  options: {
    articleId?: string
    itemId?: string
    secondsOnPage?: number
  } = {}
): Promise<void> {
  await supabase.from('user_feedback').insert({
    user_id: userId,
    article_id: options.articleId ?? null,
    item_id: options.itemId ?? null,
    action,
    seconds_on_page: options.secondsOnPage ?? null,
  })
}
