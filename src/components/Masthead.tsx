import Link from 'next/link'
import { type ReactNode } from 'react'

type Props = {
  date: string
  rightSlot?: ReactNode
  dateSuffix?: ReactNode
  brandHref?: string
}

export function Masthead({ date, rightSlot, dateSuffix, brandHref }: Props) {
  const brand = (
    <span className="font-display text-2xl md:text-3xl leading-none italic text-accent">
      Distil
    </span>
  )

  return (
    <header className="border-t-2 border-foreground pt-3">
      <div className="flex items-center justify-between gap-4 h-8">
        <div className="flex items-center gap-3 md:gap-5 min-w-0 h-full">
          {brandHref ? (
            <Link href={brandHref} className="hover:text-foreground transition-colors">
              {brand}
            </Link>
          ) : (
            brand
          )}
          <span
            className="hidden sm:inline text-border text-[15px] leading-none"
            aria-hidden="true"
          >
            |
          </span>
          <span className="hidden sm:inline font-ui text-[15px] text-subtle truncate leading-none capitalize">
            {date}
          </span>
          {dateSuffix && (
            <span className="hidden sm:inline font-ui text-[15px] text-subtle/60 leading-none">
              {dateSuffix}
            </span>
          )}
        </div>
        {rightSlot && <div className="flex items-center gap-1 shrink-0 h-full">{rightSlot}</div>}
      </div>
    </header>
  )
}
