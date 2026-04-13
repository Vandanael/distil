import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { ReadingView } from './ReadingView'

type Props = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return { title: 'Article - Distil' }
  }
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { title: 'Article - Distil' }

  const { data } = await supabase
    .from('articles')
    .select('title, site_name, excerpt')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!data) return { title: 'Article - Distil' }
  return {
    title: data.title ? `${data.title} - Distil` : 'Article - Distil',
    description: data.excerpt ?? (data.site_name ? `Lu sur ${data.site_name}` : undefined),
  }
}

export default async function ArticlePage({ params }: Props) {
  const { id } = await params

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return (
      <main className="flex min-h-full flex-col items-center justify-center p-8 bg-background">
        <p className="font-ui text-sm text-muted-foreground">Supabase non configure.</p>
      </main>
    )
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) notFound()

  const { data: article } = await supabase
    .from('articles')
    .select(
      'id, title, author, site_name, published_at, content_html, reading_time_minutes, url, status, score, justification, is_serendipity'
    )
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!article) notFound()

  const { data: profile } = await supabase
    .from('profiles')
    .select('show_scores')
    .eq('id', user.id)
    .single()

  return (
    <ReadingView
      id={article.id}
      title={article.title}
      author={article.author}
      siteName={article.site_name}
      publishedAt={article.published_at}
      contentHtml={article.content_html ?? ''}
      readingTimeMinutes={article.reading_time_minutes}
      url={article.url}
      score={profile?.show_scores !== false ? (article.score ?? null) : null}
      justification={article.justification ?? null}
      isSerendipity={article.is_serendipity ?? false}
    />
  )
}
