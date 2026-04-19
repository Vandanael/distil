import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Hiérarchie du score par poids typographique (palette 3 couleurs, pas de teinte dédiée).
export function scoreColorClass(score: number | null | undefined): string {
  if (score == null) return 'text-muted-foreground font-semibold'
  if (score >= 80) return 'text-foreground font-bold'
  if (score >= 60) return 'text-foreground font-semibold'
  return 'text-muted-foreground font-medium'
}
