'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { logError } from '@/lib/errors/log-error'
import type { HighlightAnchor } from '@/lib/highlights/serializer'

export async function addToRead(articleId: string): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  const now = new Date().toISOString()
  const { error } = await supabase
    .from('articles')
    .update({ status: 'to_read', archived_at: now, last_shown_in_edition_at: now })
    .eq('id', articleId)
    .eq('user_id', user.id)
  if (error) await logError({ route: 'addToRead', error, userId: user.id })

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

  const { error: noteError } = await supabase.from('notes').insert({
    article_id: articleId,
    user_id: user.id,
    content,
    highlight_id: highlightId ?? null,
  })
  if (noteError) await logError({ route: 'saveNote', error: noteError, userId: user.id })

  revalidatePath('/library')
}

export async function markNotInterested(
  articleId: string,
  reason: 'off_topic' | 'already_read' | 'dismissed_by_user' = 'dismissed_by_user'
): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  const { error: dismissError } = await supabase
    .from('articles')
    .update({ status: 'not_interested', rejection_reason: reason })
    .eq('id', articleId)
    .eq('user_id', user.id)
  if (dismissError)
    await logError({ route: 'markNotInterested', error: dismissError, userId: user.id })

  revalidatePath('/feed')
  revalidatePath('/library')
}

// Retire un article de la liste "A lire" : remet en status 'pending' neutre
// + reset archived_at. Garde-fou .eq('status', 'to_read') : refuse d'ecraser
// un statut different.
export async function removeFromToRead(articleId: string): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  const { error } = await supabase
    .from('articles')
    .update({ status: 'pending', archived_at: null })
    .eq('id', articleId)
    .eq('user_id', user.id)
    .eq('status', 'to_read')
  if (error) await logError({ route: 'removeFromToRead', error, userId: user.id })

  revalidatePath('/library')
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

  const { error: tagError } = await supabase
    .from('article_tags')
    .upsert({ article_id: articleId, tag_id: tag.id, user_id: user.id })
  if (tagError) await logError({ route: 'addTag', error: tagError, userId: user.id })
}
