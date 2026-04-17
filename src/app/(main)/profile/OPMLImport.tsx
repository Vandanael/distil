'use client'

import { useRef, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { parseOPML, OPML_MAX_URLS } from '@/lib/opml'
import { updatePinnedSources } from './actions'

export function OPMLImport() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setFileName(file.name)
    const reader = new FileReader()

    reader.onload = (event) => {
      const text = event.target?.result
      if (typeof text !== 'string') return

      let urls: string[]
      try {
        urls = parseOPML(text)
      } catch {
        toast.error('Fichier OPML invalide')
        return
      }

      if (urls.length === 0) {
        toast.error('Aucune source RSS trouvée dans ce fichier')
        return
      }

      const truncated = urls.length > OPML_MAX_URLS
      const urlsToImport = truncated ? urls.slice(0, OPML_MAX_URLS) : urls

      if (truncated) {
        toast.warning(`${urls.length} sources trouvées - tronquées à ${OPML_MAX_URLS}`)
      }

      startTransition(async () => {
        try {
          const { added, total } = await updatePinnedSources(urlsToImport)
          toast.success(`${added} source(s) ajoutée(s) - total : ${total}`)
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Erreur lors de l'import")
        }
      })
    }

    reader.onerror = () => toast.error('Erreur de lecture du fichier')
    reader.readAsText(file)

    // Reset pour permettre un re-import du même fichier
    e.target.value = ''
  }

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept=".opml,.xml,text/x-opml,application/xml,text/xml"
        onChange={handleFileChange}
        className="sr-only"
        aria-label="Importer un fichier OPML"
        id="opml-file-input"
      />
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isPending}
          className="font-ui text-sm px-3 py-1.5 border border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-colors disabled:opacity-40"
        >
          {isPending ? 'Import en cours...' : 'Importer un fichier OPML'}
        </button>
        {fileName && !isPending && (
          <span className="font-body text-xs text-muted-foreground">{fileName}</span>
        )}
      </div>
      <p className="font-body text-xs text-muted-foreground">
        Compatible Feedly, FreshRSS, Miniflux. Maximum 50 sources.
      </p>
    </div>
  )
}
