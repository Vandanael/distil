'use client'

import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { parseOPML, OPML_MAX_URLS } from '@/lib/opml'
import { useLocale } from '@/lib/i18n/context'

type OPMLImportButtonProps = {
  onImport: (urls: string[]) => void | Promise<void>
  disabled?: boolean
  showHint?: boolean
  'data-testid'?: string
}

/**
 * Bouton d'import OPML partagé entre onboarding et profile.
 * Lit le fichier côté client, parse via parseOPML, délègue l'effet d'ajout
 * au parent via onImport(urls).
 */
export function OPMLImportButton({
  onImport,
  disabled,
  showHint = true,
  'data-testid': testId,
}: OPMLImportButtonProps) {
  const { t } = useLocale()
  const inputRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [isBusy, setIsBusy] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    setFileName(file.name)
    const reader = new FileReader()

    reader.onload = async (event) => {
      const text = event.target?.result
      if (typeof text !== 'string') return

      let urls: string[]
      try {
        urls = parseOPML(text)
      } catch {
        toast.error(t.forms.opmlInvalid)
        return
      }

      if (urls.length === 0) {
        toast.error(t.forms.opmlEmpty)
        return
      }

      const truncated = urls.length > OPML_MAX_URLS
      const payload = truncated ? urls.slice(0, OPML_MAX_URLS) : urls
      if (truncated) {
        toast.warning(`${urls.length} ${t.forms.opmlTruncated} ${OPML_MAX_URLS}`)
      }

      try {
        setIsBusy(true)
        await onImport(payload)
        toast.success(`${payload.length} ${t.forms.opmlAdded}`)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : t.forms.opmlReadError)
      } finally {
        setIsBusy(false)
      }
    }

    reader.onerror = () => toast.error(t.forms.opmlReadError)
    reader.readAsText(file)
  }

  const inactive = disabled || isBusy

  return (
    <div className="space-y-1.5" data-testid={testId}>
      <input
        ref={inputRef}
        type="file"
        accept=".opml,.xml,text/x-opml,application/xml,text/xml"
        onChange={handleChange}
        className="sr-only"
        aria-label={t.forms.opmlButton}
        id={testId ? `${testId}-file` : 'opml-file-input'}
      />
      <div className="flex items-center gap-3 flex-wrap">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={inactive}
          className="font-ui text-sm px-3 py-1.5 border border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-colors disabled:opacity-40"
        >
          {isBusy ? t.forms.opmlPending : t.forms.opmlButton}
        </button>
        {fileName && !isBusy && (
          <span className="font-body text-sm text-muted-foreground">{fileName}</span>
        )}
      </div>
      {showHint && (
        <p className="font-body text-sm text-muted-foreground">{t.forms.opmlHint}</p>
      )}
    </div>
  )
}
