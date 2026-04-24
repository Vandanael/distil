'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { deleteAccount, updateProfile } from './actions'
import { Spinner } from '@/components/ui/spinner'

async function runScoring(urls: string[]): Promise<{ accepted: number; rejected: number }> {
  const res = await fetch('/api/scoring/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ urls }),
  })
  if (!res.ok) throw new Error('Erreur serveur')
  return res.json() as Promise<{ accepted: number; rejected: number }>
}

type Props = {
  dailyCap: number
  serendipityQuota: number
}

export function AdvancedSettings({ dailyCap: initialCap, serendipityQuota: initialQuota }: Props) {
  const [dailyCap, setDailyCap] = useState(initialCap)
  const [serendipityQuota, setSerendipityQuota] = useState(initialQuota)
  const [isPending, startTransition] = useTransition()
  const [showScoringPanel, setShowScoringPanel] = useState(false)
  const [scoringUrls, setScoringUrls] = useState('')
  const [isScoringPending, startScoringTransition] = useTransition()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [isDeleting, startDeleteTransition] = useTransition()

  const selectClass =
    'h-10 w-full border border-input bg-background px-3 font-ui text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'
  const labelClass = 'font-ui text-sm text-muted-foreground'

  function persistRythme(next: { daily_cap?: number; serendipity_quota?: number }) {
    startTransition(async () => {
      try {
        await updateProfile(next)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde.')
      }
    })
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="daily-cap" className={labelClass}>
            Articles par jour
          </Label>
          <select
            id="daily-cap"
            value={dailyCap}
            onChange={(e) => {
              const v = Number(e.target.value)
              setDailyCap(v)
              persistRythme({ daily_cap: v })
            }}
            disabled={isPending}
            data-testid="daily-cap-select"
            className={selectClass}
          >
            {[5, 10, 20, 30].map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="serendipity" className={labelClass}>
            Sérénidipité
          </Label>
          <select
            id="serendipity"
            value={serendipityQuota}
            onChange={(e) => {
              const v = Number(e.target.value)
              setSerendipityQuota(v)
              persistRythme({ serendipity_quota: v })
            }}
            disabled={isPending}
            data-testid="serendipity-select"
            className={selectClass}
          >
            {[0, 0.15, 0.3, 0.5].map((v) => (
              <option key={v} value={v}>
                {Math.round(v * 100)}%
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="font-ui text-sm font-medium text-foreground">Analyser des articles</p>
            <p className="font-body text-sm text-muted-foreground">
              Collez des URLs d&apos;articles, Distil les analyse et les score.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowScoringPanel(!showScoringPanel)}
            data-testid="toggle-scoring-panel"
          >
            {showScoringPanel ? 'Fermer' : 'Coller des URLs'}
          </Button>
        </div>

        {showScoringPanel && (
          <div className="space-y-3 border border-border p-4">
            <Label className="font-ui text-sm text-muted-foreground">
              URLs à analyser (une par ligne)
            </Label>
            <Textarea
              placeholder={`https://example.com/article-1\nhttps://example.com/article-2`}
              value={scoringUrls}
              onChange={(e) => setScoringUrls(e.target.value)}
              rows={5}
              disabled={isScoringPending}
              data-testid="scoring-urls-input"
            />
            <Button
              type="button"
              size="sm"
              disabled={isScoringPending || !scoringUrls.trim()}
              data-testid="run-scoring-btn"
              onClick={() => {
                const urls = scoringUrls
                  .split('\n')
                  .map((u) => u.trim())
                  .filter((u) => u.startsWith('http'))
                if (urls.length === 0) {
                  toast.error('Aucune URL valide')
                  return
                }
                startScoringTransition(async () => {
                  const toastId = toast.loading(
                    `Analyse de ${urls.length} article${urls.length > 1 ? 's' : ''}...`
                  )
                  try {
                    const result = await runScoring(urls)
                    toast.success(
                      `${result.accepted} retenu${result.accepted > 1 ? 's' : ''}, ${result.rejected} rejet${result.rejected > 1 ? 'é' : 'é'}`,
                      { id: toastId }
                    )
                    setScoringUrls('')
                    setShowScoringPanel(false)
                  } catch {
                    toast.error('Erreur lors du scoring', { id: toastId })
                  }
                })
              }}
            >
              {isScoringPending && <Spinner className="size-4" />}
              {isScoringPending ? 'Analyse en cours...' : 'Analyser'}
            </Button>
          </div>
        )}
      </div>

      <div className="border-t border-destructive/30 pt-6 space-y-3">
        <p className="font-ui text-sm font-medium text-destructive">Zone dangereuse</p>
        <p className="font-body text-sm text-muted-foreground">
          Supprimer votre compte et toutes vos données. Cette action est irréversible.
        </p>
        {confirmDelete ? (
          <div className="space-y-3 border border-destructive/30 p-4">
            <p className="font-ui text-sm text-destructive">
              Êtes-vous sûr ? Toutes vos données seront supprimées définitivement.
            </p>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={isDeleting}
                onClick={() => {
                  startDeleteTransition(async () => {
                    try {
                      await deleteAccount()
                    } catch (err) {
                      toast.error(
                        err instanceof Error ? err.message : 'Erreur lors de la suppression.'
                      )
                      setConfirmDelete(false)
                    }
                  })
                }}
              >
                {isDeleting && <Spinner className="size-4" />}
                {isDeleting ? 'Suppression...' : 'Confirmer la suppression'}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isDeleting}
                onClick={() => setConfirmDelete(false)}
              >
                Annuler
              </Button>
            </div>
          </div>
        ) : (
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => setConfirmDelete(true)}
          >
            Supprimer mon compte
          </Button>
        )}
      </div>
    </div>
  )
}
