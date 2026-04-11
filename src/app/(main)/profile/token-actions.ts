'use server'

import { createClient } from '@/lib/supabase/server'
import { generateToken, hashToken } from '@/lib/tokens/api-tokens'

export type ApiTokenRow = {
  id: string
  name: string
  last_used_at: string | null
  created_at: string
}

export async function listApiTokens(): Promise<ApiTokenRow[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('api_tokens')
    .select('id, name, last_used_at, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return data ?? []
}

export async function createApiToken(name: string): Promise<{ token: string; id: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifie')

  const token = generateToken()
  const tokenHash = await hashToken(token)

  const { data, error } = await supabase
    .from('api_tokens')
    .insert({ user_id: user.id, name: name.trim(), token_hash: tokenHash })
    .select('id')
    .single()

  if (error || !data) throw new Error('Impossible de creer le token')

  return { token, id: data.id }
}

export async function deleteApiToken(tokenId: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifie')

  await supabase
    .from('api_tokens')
    .delete()
    .eq('id', tokenId)
    .eq('user_id', user.id)
}
