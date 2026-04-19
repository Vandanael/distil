import { logError } from '@/lib/errors/log-error'
import type { ServiceClient } from '@/lib/supabase/types'

type FeedbackAction = 'skip' | 'saved'

export async function logFeedback(
  supabase: ServiceClient,
  userId: string,
  action: FeedbackAction,
  options: {
    articleId?: string
    itemId?: string
    secondsOnPage?: number
  } = {}
): Promise<void> {
  const { error } = await supabase.from('user_feedback').insert({
    user_id: userId,
    article_id: options.articleId ?? null,
    item_id: options.itemId ?? null,
    action,
    seconds_on_page: options.secondsOnPage ?? null,
  })
  if (error) await logError({ route: 'logFeedback', error, userId, context: { action } })
}
