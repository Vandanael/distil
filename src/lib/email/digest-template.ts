type DigestArticle = {
  id: string
  title: string | null
  site_name: string | null
  excerpt: string | null
  score: number | null
  reading_time_minutes: number | null
}

type DigestData = {
  articles: DigestArticle[]
  appUrl: string
  unsubscribeUrl: string
  date: string
}

function scoreColor(score: number): string {
  if (score >= 70) return '#22c55e'
  if (score >= 40) return '#facc15'
  return '#f87171'
}

function articleRow(article: DigestArticle, appUrl: string): string {
  const title = article.title ?? 'Sans titre'
  const meta = [
    article.site_name,
    article.reading_time_minutes ? `${article.reading_time_minutes} min` : null,
  ]
    .filter(Boolean)
    .join(' · ')
  const link = `${appUrl}/article/${article.id}`

  const scoreHtml =
    article.score !== null
      ? `<td style="width:48px;text-align:right;font-family:monospace;font-size:13px;color:${scoreColor(article.score)};vertical-align:top;padding-top:2px;">${Math.round(article.score)}%</td>`
      : ''

  return `
    <tr>
      <td style="padding:16px 0;border-bottom:1px solid #e2e0d8;vertical-align:top;">
        <a href="${link}" style="color:#1a3a2e;text-decoration:none;font-size:16px;font-weight:600;line-height:1.4;display:block;">${escapeHtml(title)}</a>
        ${meta ? `<span style="font-size:13px;color:#587060;line-height:1.6;">${escapeHtml(meta)}</span>` : ''}
        ${article.excerpt ? `<p style="font-size:14px;color:#587060;line-height:1.5;margin:4px 0 0;">${escapeHtml(article.excerpt).slice(0, 140)}${(article.excerpt?.length ?? 0) > 140 ? '...' : ''}</p>` : ''}
      </td>
      ${scoreHtml}
    </tr>`
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function buildDigestHtml(data: DigestData): string {
  const rows = data.articles.map((a) => articleRow(a, data.appUrl)).join('')

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light dark">
  <title>Distil - ${data.date}</title>
</head>
<body style="margin:0;padding:0;background:#f7f8f3;font-family:-apple-system,system-ui,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px;">
    <!-- Header -->
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td style="border-bottom:2px solid #1a3a2e;padding-bottom:12px;">
          <a href="${data.appUrl}/feed" style="color:#7A2E3A;font-size:20px;font-weight:700;text-decoration:none;">Distil</a>
          <span style="float:right;font-size:12px;color:#587060;">${escapeHtml(data.date)}</span>
        </td>
      </tr>
    </table>

    <p style="font-size:14px;color:#1a3a2e;margin:16px 0 24px;">Votre veille du jour</p>

    <!-- Articles -->
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      ${rows}
    </table>

    <!-- CTA -->
    <div style="text-align:center;margin:32px 0;">
      <a href="${data.appUrl}/feed" style="display:inline-block;background:#1a3a2e;color:#f7f8f3;font-size:14px;font-weight:600;padding:12px 28px;text-decoration:none;">Ouvrir Distil</a>
    </div>

    <!-- Footer -->
    <div style="border-top:1px solid #e2e0d8;padding-top:16px;margin-top:16px;">
      <p style="font-size:11px;color:#587060;line-height:1.5;margin:0;">
        Cet email est envoyé car vous avez activé le digest dans vos <a href="${data.appUrl}/profile" style="color:#7A2E3A;">préférences</a>.
        <a href="${data.unsubscribeUrl}" style="color:#587060;">Se désabonner</a>
      </p>
    </div>
  </div>
</body>
</html>`
}

export function buildDigestText(data: DigestData): string {
  const lines = data.articles.map((a, i) => {
    const title = a.title ?? 'Sans titre'
    const meta = [a.site_name, a.score !== null ? `${Math.round(a.score)}%` : null]
      .filter(Boolean)
      .join(' · ')
    return `${i + 1}. ${title}\n   ${meta}\n   ${data.appUrl}/article/${a.id}`
  })

  return `Distil - ${data.date}\nVotre veille du jour\n\n${lines.join('\n\n')}\n\n---\nOuvrir Distil: ${data.appUrl}/feed\nSe désabonner: ${data.unsubscribeUrl}`
}
