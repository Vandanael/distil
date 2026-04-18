type Props = {
  size?: number
  className?: string
  title?: string
}

const DROP_PATH = 'M16 29 C22 22 25 17 25 12 C25 7 21 3 16 3 C11 3 7 7 7 12 C7 17 10 22 16 29 Z'

export function BrandGlyph({ size = 24, className, title }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
    >
      {title ? <title>{title}</title> : null}
      <defs>
        <clipPath id="distil-glyph-bot">
          <rect x="0" y="21" width="32" height="11" />
        </clipPath>
      </defs>
      <path d={DROP_PATH} fill="currentColor" clipPath="url(#distil-glyph-bot)" />
      <path
        d={DROP_PATH}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  )
}
