import type { ServiceClient } from '@/lib/supabase/types'

type FeedbackAction = 'read_full' | 'skip' | 'saved' | 'surprised_useful'

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
  await supabase.from('user_feedback').insert({
    user_id: userId,
    article_id: options.articleId ?? null,
    item_id: options.itemId ?? null,
    action,
    seconds_on_page: options.secondsOnPage ?? null,
  })
}
