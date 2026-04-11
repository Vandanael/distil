'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { generateBookmarkletCode } from '@/lib/bookmarklet/generate'
import { createApiToken, deleteApiToken } from './token-actions'
import type { ApiTokenRow } from './token-actions'

type Props = {
  tokens: ApiTokenRow[]
}

export function TokensSection({ tokens: initialTokens }: Props) {
  const [tokens, setTokens] = useState(initialTokens)
  const [newName, setNewName] = useState('')
  const [createdToken, setCreatedToken] = useState<{ token: string; id: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    startTransition(async () => {
      const result = await createApiToken(newName.trim())
      setCreatedToken(result)
      setTokens((prev) => [
        {
          id: result.id,
          name: newName.trim(),
          last_used_at: null,
          created_at: new Date().toISOString(),
        },
        ...prev,
      ])
      setNewName('')
    })
  }

  function handleDelete(tokenId: string) {
    startTransition(async () => {
      await deleteApiToken(tokenId)
      setTokens((prev) => prev.filter((t) => t.id !== tokenId))
      if (createdToken?.id === tokenId) setCreatedToken(null)
    })
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="font-ui text-sm font-semibold text-foreground">Bookmarklet</h2>
        <p className="font-body text-sm text-muted-foreground">
          Sauvegardez n&apos;importe quelle page web dans Distil depuis votre navigateur.
        </p>
      </div>

      {/* Token cree : affichage one-shot */}
      {createdToken && (
        <div className="space-y-3 border border-accent/40 p-4 bg-accent/5">
          <p className="font-ui text-xs font-semibold text-accent uppercase tracking-wider">
            Copiez ce token maintenant - il ne sera plus affiche
          </p>
          <code
            className="block font-mono text-xs text-foreground break-all bg-muted px-3 py-2"
            data-testid="created-token-value"
          >
            {createdToken.token}
          </code>

          <div className="space-y-2">
            <p className="font-ui text-xs text-muted-foreground">
              Glissez ce lien dans votre barre de favoris :
            </p>
            <a
              href={generateBookmarkletCode(createdToken.token, appUrl)}
              className="inline-block font-ui text-sm font-semibold text-accent border border-accent px-3 py-1.5 hover:bg-accent hover:text-white transition-colors"
              data-testid="bookmarklet-link"
              onClick={(e) => e.preventDefault()}
              draggable
            >
              + Ajouter a Distil
            </a>
          </div>

          <button
            type="button"
            className="font-ui text-xs text-muted-foreground hover:text-foreground underline"
            onClick={() => setCreatedToken(null)}
          >
            Masquer
          </button>
        </div>
      )}

      {/* Liste des tokens existants */}
      {tokens.length > 0 && (
        <ul className="space-y-0 border border-border divide-y divide-border">
          {tokens.map((token) => (
            <li key={token.id} className="flex items-center justify-between gap-4 px-4 py-3">
              <div className="min-w-0">
                <p className="font-ui text-sm text-foreground truncate">{token.name}</p>
                <p className="font-ui text-[11px] text-muted-foreground">
                  Cree le {formatDate(token.created_at)}
                  {token.last_used_at && ` - Utilise le ${formatDate(token.last_used_at)}`}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(token.id)}
                disabled={isPending}
                data-testid={`delete-token-${token.id}`}
                className="shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                Revoquer
              </Button>
            </li>
          ))}
        </ul>
      )}

      {/* Formulaire creation */}
      <form onSubmit={handleCreate} className="flex gap-2">
        <Input
          type="text"
          placeholder="Nom du token (ex: Safari Mac)"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          disabled={isPending}
          className="h-10 text-sm"
          data-testid="token-name-input"
        />
        <Button
          type="submit"
          disabled={isPending || !newName.trim()}
          size="sm"
          className="shrink-0 h-10"
          data-testid="create-token-btn"
        >
          {isPending ? 'Creation...' : 'Creer'}
        </Button>
      </form>
    </div>
  )
}
