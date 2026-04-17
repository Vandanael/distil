'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { HighlightAnchor } from '@/lib/highlights/serializer'

export async function archiveArticle(articleId: string): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('articles')
    .update({ status: 'archived', archived_at: new Date().toISOString() })
    .eq('id', articleId)
    .eq('user_id', user.id)

  revalidatePath('/feed')
  revalidatePath('/library')
}

export async function saveHighlight(
  articleId: string,
  anchor: HighlightAnchor
): Promise<string | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('highlights')
    .insert({
      article_id: articleId,
      user_id: user.id,
      text_content: anchor.textContent,
      prefix_context: anchor.prefixContext,
      suffix_context: anchor.suffixContext,
      css_selector: anchor.cssSelector,
      text_offset: anchor.textOffset,
    })
    .select('id')
    .single()

  revalidatePath('/library')
  return data?.id ?? null
}

export async function saveNote(
  articleId: string,
  content: string,
  highlightId?: string
): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  await supabase.from('notes').insert({
    article_id: articleId,
    user_id: user.id,
    content,
    highlight_id: highlightId ?? null,
  })

  revalidatePath('/library')
}

export async function dismissArticle(
  articleId: string,
  reason: 'off_topic' | 'already_read' | 'dismissed_by_user' = 'dismissed_by_user'
): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('articles')
    .update({ status: 'rejected', rejection_reason: reason })
    .eq('id', articleId)
    .eq('user_id', user.id)

  revalidatePath('/feed')
}

export async function addTag(articleId: string, tagName: string): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  const normalized = tagName.trim().toLowerCase()
  if (!normalized || normalized.length > 50) return
  if (!/^[\p{L}\p{N}\s\-_]+$/u.test(normalized)) return

  // Upsert tag
  const { data: tag } = await supabase
    .from('tags')
    .upsert({ user_id: user.id, name: normalized }, { onConflict: 'user_id,name' })
    .select('id')
    .single()

  if (!tag) return

  await supabase
    .from('article_tags')
    .upsert({ article_id: articleId, tag_id: tag.id, user_id: user.id })
}
