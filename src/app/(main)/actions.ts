'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function keepArticle(articleId: string): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('articles')
    .update({ status: 'pending', kept_anyway: true })
    .eq('id', articleId)
    .eq('user_id', user.id)

  revalidatePath('/library')
  revalidatePath('/feed')
}

export async function markAsRead(articleId: string): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('articles')
    .update({ status: 'read', read_at: new Date().toISOString() })
    .eq('id', articleId)
    .eq('user_id', user.id)
    .neq('status', 'not_interested') // ne pas ecraser un rejet explicite

  revalidatePath('/feed')
  revalidatePath('/library')
}
