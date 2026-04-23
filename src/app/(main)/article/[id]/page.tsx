import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { truncateToExtract } from '@/lib/parsing/extract'
import { ReadingView } from './ReadingView'

type Props = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ from?: string }>
}

function readExtractConfig(): { ratio: number; minWords: number } {
  const ratioRaw = Number(process.env.ARTICLE_EXTRACT_RATIO)
  const minRaw = Number(process.env.ARTICLE_EXTRACT_MIN_WORDS)
  const ratio = Number.isFinite(ratioRaw) && ratioRaw > 0 ? ratioRaw : 0.3
  const minWords = Number.isFinite(minRaw) && minRaw >= 0 ? minRaw : 150
  return { ratio, minWords }
}

function resolveReturnTo(from: string | undefined): '/feed' | '/library' {
  return from === 'library' ? '/library' : '/feed'
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

export default async function ArticlePage({ params, searchParams }: Props) {
  const { id } = await params
  const { from } = await searchParams

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
      'id, item_id, title, author, site_name, published_at, content_html, reading_time_minutes, url, status, is_serendipity, origin'
    )
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!article) notFound()

  let bucket: 'essential' | 'surprise' | null = null
  if (article.item_id) {
    const { data: rankingEntry } = await supabase
      .from('daily_ranking')
      .select('bucket')
      .eq('user_id', user.id)
      .eq('item_id', article.item_id)
      .eq('date', new Date().toISOString().slice(0, 10))
      .maybeSingle()
    if (rankingEntry?.bucket === 'essential' || rankingEntry?.bucket === 'surprise') {
      bucket = rankingEntry.bucket
    }
  }

  const { ratio, minWords } = readExtractConfig()
  const extract = truncateToExtract(article.content_html ?? '', ratio, minWords)

  return (
    <ReadingView
      id={article.id}
      title={article.title}
      author={article.author}
      siteName={article.site_name}
      publishedAt={article.published_at}
      contentHtml={extract.html}
      truncated={extract.truncated}
      readingTimeMinutes={article.reading_time_minutes}
      url={article.url}
      returnTo={resolveReturnTo(from)}
      bucket={bucket}
      isSerendipity={article.is_serendipity}
      origin={article.origin}
    />
  )
}
