'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArticleCard } from '@/app/(main)/feed/components/ArticleCard'

// Donnees fictives pour tester les composants sans Supabase
const MOCK_ARTICLES = [
  {
    id: 'mock-1',
    title: 'The Intelligence Trap: Why Smart People Make Dumb Mistakes',
    siteName: 'aeon.co',
    excerpt:
      'Educated people are not necessarily better at reasoning — they may just be better at rationalising their preconceptions.',
    readingTimeMinutes: 8,
    score: 87,
    isSerendipity: false,
    origin: 'agent',
    scoredAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    wordCount: 1200,
  },
  {
    id: 'mock-2',
    title: 'Against Productivity Culture',
    siteName: 'harpers.org',
    excerpt:
      'The relentless optimisation de time has made us more efficient and less human. A case for slowness.',
    readingTimeMinutes: 12,
    score: 61,
    isSerendipity: true,
    origin: 'agent',
    scoredAt: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(),
    wordCount: null, // paywall demo
  },
  {
    id: 'mock-3',
    title: 'How LLMs Actually Work: A Practical Guide',
    siteName: 'arxiv.org',
    excerpt: 'Transformers, attention, tokenization — what matters for practitioners.',
    readingTimeMinutes: 5,
    score: 94,
    isSerendipity: false,
    origin: 'bookmarklet',
    scoredAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    wordCount: 2100,
  },
]

const MOCK_REJECTED = [
  {
    id: 'rej-1',
    title: 'Top 10 Productivity Hacks for 2025',
    siteName: 'medium.com',
    rejectionReason: 'Contenu generique, aucune densite informationnelle',
    url: 'https://medium.com/example',
  },
  {
    id: 'rej-2',
    title: 'Why Crypto Will Change Everything (Again)',
    siteName: 'substack.com',
    rejectionReason: 'Hors profil : finance speculatif',
    url: 'https://substack.com/example',
  },
]

const DEFAULT_URLS = `https://www.paulgraham.com/greatwork.html
https://stratechery.com/2024/the-ai-unbundling/`

type RunResult = {
  runId?: string
  accepted?: number
  rejected?: number
  durationMs?: number
  error?: string | null
  raw?: unknown
}

type StatusResult = {
  status?: string
  articlesAnalyzed?: number
  articlesAccepted?: number
  articlesRejected?: number
  agentType?: string
  durationMs?: number
  error?: string | null
  raw?: unknown
}

export function DevDashboard() {
  // --- Scoring run ---
  const [urls, setUrls] = useState(DEFAULT_URLS)
  const [runLoading, setRunLoading] = useState(false)
  const [runResult, setRunResult] = useState<RunResult | null>(null)

  // --- Status check ---
  const [runId, setRunId] = useState('')
  const [statusLoading, setStatusLoading] = useState(false)
  const [statusResult, setStatusResult] = useState<StatusResult | null>(null)

  // --- Parse test ---
  const [parseUrl, setParseUrl] = useState('https://www.paulgraham.com/greatwork.html')
  const [parseLoading, setParseLoading] = useState(false)
  const [parseResult, setParseResult] = useState<unknown>(null)

  // --- Mock feed ---
  const [showScores, setShowScores] = useState(true)

  async function triggerRun() {
    setRunLoading(true)
    setRunResult(null)
    try {
      const res = await fetch('/api/scoring/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          urls: urls
            .split('\n')
            .map((u) => u.trim())
            .filter(Boolean),
        }),
      })
      const data = await res.json()
      setRunResult({ ...data, raw: data })
      if (data.runId) setRunId(data.runId)
    } catch (err) {
      setRunResult({ error: String(err) })
    } finally {
      setRunLoading(false)
    }
  }

  async function checkStatus() {
    if (!runId) return
    setStatusLoading(true)
    setStatusResult(null)
    try {
      const res = await fetch(`/api/scoring/status?runId=${runId}`)
      const data = await res.json()
      setStatusResult({ ...data, raw: data })
    } catch (err) {
      setStatusResult({ error: String(err) })
    } finally {
      setStatusLoading(false)
    }
  }

  async function testParse() {
    setParseLoading(true)
    setParseResult(null)
    try {
      // Appelle un endpoint de test parse (proxy cote client via api route)
      const res = await fetch('/api/dev/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: parseUrl }),
      })
      const data = await res.json()
      setParseResult(data)
    } catch (err) {
      setParseResult({ error: String(err) })
    } finally {
      setParseLoading(false)
    }
  }

  return (
    <main className="min-h-full bg-background p-8 md:p-16">
      <div className="max-w-3xl space-y-12">
        {/* Header */}
        <div className="space-y-2 border-b border-border pb-6">
          <p className="font-ui text-[10px] uppercase tracking-widest text-accent">
            Dev only — not in production
          </p>
          <h1 className="font-ui text-3xl font-semibold text-foreground">Dev Dashboard</h1>
          <p className="font-body text-sm text-muted-foreground">
            Les actions Supabase n&apos;agissent que si{' '}
            <code className="font-ui text-xs text-foreground">.env.local</code> est configure et que
            vous etes authentifie.
          </p>
        </div>

        {/* Section 1 : Scoring run */}
        <section className="space-y-4">
          <div className="space-y-1">
            <h2 className="font-ui text-sm font-semibold uppercase tracking-wider text-foreground">
              01 — Lancer un run de scoring
            </h2>
            <p className="font-body text-xs text-muted-foreground">
              POST /api/scoring/run - une URL par ligne (max 20)
            </p>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="urls"
              className="font-ui text-[10px] uppercase tracking-wider text-muted-foreground"
            >
              URLs candidates
            </Label>
            <Textarea
              id="urls"
              value={urls}
              onChange={(e) => setUrls(e.target.value)}
              rows={4}
              className="font-ui text-xs"
              data-testid="dev-urls"
            />
          </div>

          <Button onClick={triggerRun} disabled={runLoading} data-testid="dev-trigger-run">
            {runLoading ? 'Scoring en cours...' : 'Lancer le scoring'}
          </Button>

          {runResult && (
            <div className="space-y-1 border border-border p-4 font-ui text-xs">
              {runResult.error ? (
                <p className="text-destructive">{runResult.error}</p>
              ) : (
                <>
                  <p>
                    <span className="text-muted-foreground">runId</span>{' '}
                    <span className="text-foreground">{runResult.runId}</span>
                  </p>
                  <p>
                    <span className="text-muted-foreground">acceptes</span>{' '}
                    <span className="text-accent font-semibold">{runResult.accepted}</span>
                    {'  '}
                    <span className="text-muted-foreground">rejetes</span>{' '}
                    <span className="text-foreground">{runResult.rejected}</span>
                  </p>
                  <p>
                    <span className="text-muted-foreground">duree</span>{' '}
                    <span className="text-foreground">{runResult.durationMs}ms</span>
                  </p>
                </>
              )}
            </div>
          )}
        </section>

        {/* Section 2 : Status run */}
        <section className="space-y-4">
          <div className="space-y-1">
            <h2 className="font-ui text-sm font-semibold uppercase tracking-wider text-foreground">
              02 — Statut d&apos;un run
            </h2>
            <p className="font-body text-xs text-muted-foreground">
              GET /api/scoring/status?runId=...
            </p>
          </div>

          <div className="flex gap-2">
            <Input
              value={runId}
              onChange={(e) => setRunId(e.target.value)}
              placeholder="runId (auto-rempli apres un run)"
              className="font-ui text-xs"
              data-testid="dev-run-id"
            />
            <Button
              variant="secondary"
              onClick={checkStatus}
              disabled={statusLoading || !runId}
              data-testid="dev-check-status"
            >
              {statusLoading ? '...' : 'Verifier'}
            </Button>
          </div>

          {statusResult && (
            <div className="space-y-1 border border-border p-4 font-ui text-xs">
              {statusResult.error ? (
                <p className="text-destructive">{statusResult.error}</p>
              ) : (
                <>
                  <p>
                    <span className="text-muted-foreground">status</span>{' '}
                    <span
                      className={
                        statusResult.status === 'completed' ? 'text-accent' : 'text-foreground'
                      }
                    >
                      {statusResult.status}
                    </span>
                  </p>
                  <p>
                    <span className="text-muted-foreground">analyses</span>{' '}
                    <span className="text-foreground">{statusResult.articlesAnalyzed}</span>
                    {'  '}
                    <span className="text-muted-foreground">acceptes</span>{' '}
                    <span className="text-foreground">{statusResult.articlesAccepted}</span>
                    {'  '}
                    <span className="text-muted-foreground">rejetes</span>{' '}
                    <span className="text-foreground">{statusResult.articlesRejected}</span>
                  </p>
                  <p>
                    <span className="text-muted-foreground">agent</span>{' '}
                    <span className="text-foreground">{statusResult.agentType}</span>
                    {'  '}
                    <span className="text-muted-foreground">duree</span>{' '}
                    <span className="text-foreground">{statusResult.durationMs}ms</span>
                  </p>
                </>
              )}
            </div>
          )}
        </section>

        {/* Section 3 : Test parsing */}
        <section className="space-y-4">
          <div className="space-y-1">
            <h2 className="font-ui text-sm font-semibold uppercase tracking-wider text-foreground">
              03 — Tester le parsing
            </h2>
            <p className="font-body text-xs text-muted-foreground">
              Parse une URL via Readability et retourne les metadonnees.
            </p>
          </div>

          <div className="flex gap-2">
            <Input
              value={parseUrl}
              onChange={(e) => setParseUrl(e.target.value)}
              placeholder="https://..."
              className="font-ui text-xs"
              data-testid="dev-parse-url"
            />
            <Button
              variant="secondary"
              onClick={testParse}
              disabled={parseLoading || !parseUrl}
              data-testid="dev-parse-btn"
            >
              {parseLoading ? '...' : 'Parser'}
            </Button>
          </div>

          {parseResult !== null && (
            <pre className="overflow-auto border border-border p-4 font-ui text-xs text-foreground max-h-64">
              {JSON.stringify(parseResult, null, 2)}
            </pre>
          )}
        </section>

        {/* Section 4 : Mock feed */}
        <section className="space-y-4">
          <div className="space-y-1">
            <h2 className="font-ui text-sm font-semibold uppercase tracking-wider text-foreground">
              04 — Feed avec donnees fictives
            </h2>
            <p className="font-body text-xs text-muted-foreground">
              Apercu des composants UI sans Supabase.
            </p>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showScores}
              onChange={(e) => setShowScores(e.target.checked)}
              className="h-4 w-4 border-input accent-primary"
            />
            <span className="font-ui text-sm text-muted-foreground">Afficher les scores</span>
          </label>

          <div className="space-y-6 border border-border p-6">
            {MOCK_ARTICLES.map((a) => (
              <ArticleCard key={a.id} {...a} score={showScores ? a.score : null} />
            ))}
          </div>
        </section>

        {/* Section 5 : Mock rejets */}
        <section className="space-y-4">
          <div className="space-y-1">
            <h2 className="font-ui text-sm font-semibold uppercase tracking-wider text-foreground">
              05 — Rejets avec donnees fictives
            </h2>
          </div>

          <div className="space-y-6 border border-border p-6">
            {MOCK_REJECTED.map((a) => (
              <div key={a.id} className="space-y-2 border-b border-border pb-4 last:border-0">
                <div className="flex items-start justify-between gap-4">
                  <span className="font-ui text-sm font-semibold text-foreground">{a.title}</span>
                  <span className="shrink-0 font-ui text-[11px] uppercase tracking-wider text-muted-foreground">
                    {a.siteName}
                  </span>
                </div>
                <p className="font-body text-xs text-muted-foreground italic">
                  {a.rejectionReason}
                </p>
                <Button variant="secondary" size="sm" disabled>
                  Garder quand meme (mock)
                </Button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
