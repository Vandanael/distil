import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Teinte du score : vert = match fort (>= 80), neutre = milieu, atténué = faible.
// La serendipity garde son label accent orange, indépendant du score.
export function scoreColorClass(score: number | null | undefined): string {
  if (score == null) return 'text-muted-foreground'
  if (score >= 80) return 'text-match-strong'
  if (score >= 60) return 'text-foreground'
  return 'text-muted-foreground'
}
