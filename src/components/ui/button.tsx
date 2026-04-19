import { Button as ButtonPrimitive } from '@base-ui/react/button'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'group/button inline-flex shrink-0 items-center justify-center border border-transparent bg-clip-padding font-ui text-sm font-semibold whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-40 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*="size-"])]:size-4',
  {
    variants: {
      variant: {
        /* Marine - autorite, CTA principal */
        default: 'bg-primary text-primary-foreground hover:bg-primary/85',
        /* Contour - alternatif discret */
        outline: 'border-border bg-background hover:bg-muted hover:text-foreground',
        /* Creme muet - secondaire */
        secondary: 'bg-secondary text-secondary-foreground border-border hover:bg-muted',
        /* Orange - emphase editoriale */
        accent: 'bg-accent text-accent-foreground hover:bg-accent/85',
        /* Fantome */
        ghost: 'hover:bg-muted hover:text-foreground',
        /* Destructif */
        destructive: 'bg-destructive/10 text-destructive hover:bg-destructive/15',
        /* Lien */
        link: 'text-accent underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 gap-2 px-4',
        sm: 'h-8 gap-1.5 px-3 text-sm',
        lg: 'h-11 gap-2 px-5',
        xl: 'h-13 gap-2 px-6 text-base',
        icon: 'size-10',
        'icon-sm': 'size-8',
        'icon-lg': 'size-11',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

function Button({
  className,
  variant = 'default',
  size = 'default',
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
