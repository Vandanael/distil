import Link from 'next/link'

export type LibraryTab = 'saved' | 'highlights' | 'filtered'

type Props = { active: LibraryTab }

const TABS: Array<{ id: LibraryTab; label: string }> = [
  { id: 'saved', label: 'Sauvegardes' },
  { id: 'highlights', label: 'Highlights' },
  { id: 'filtered', label: 'Filtres' },
]

export function LibraryTabs({ active }: Props) {
  return (
    <nav
      role="tablist"
      aria-label="Sections de la bibliotheque"
      className="flex gap-6 border-b border-border"
      data-testid="library-tabs"
    >
      {TABS.map(({ id, label }) => {
        const isActive = id === active
        return (
          <Link
            key={id}
            href={`/library?tab=${id}`}
            role="tab"
            aria-selected={isActive}
            aria-current={isActive ? 'page' : undefined}
            data-testid={`library-tab-${id}`}
            className={`-mb-px border-b-2 pb-3 font-ui text-sm transition-colors ${
              isActive
                ? 'border-accent text-foreground font-medium'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
