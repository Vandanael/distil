/**
 * Garde-fou : la service-role key Supabase ne doit JAMAIS apparaitre dans un
 * composant client. Sinon elle serait embarquee dans le bundle JS sert au
 * navigateur, contournant totalement RLS.
 *
 * Heuristique :
 *   - scanne tous les fichiers src/**\/*.ts(x)
 *   - s'ils referencent SUPABASE_SERVICE_ROLE_KEY
 *   - le fichier NE doit PAS commencer par 'use client'
 *
 * Les scripts/ et e2e/ sont hors scope bundle donc exclus.
 */
import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const SRC_ROOT = 'src'
const FORBIDDEN_MARKER = "'use client'"
const SECRET_NEEDLE = 'SUPABASE_SERVICE_ROLE_KEY'

function walk(dir: string): string[] {
  const entries = readdirSync(dir)
  const files: string[] = []
  for (const entry of entries) {
    const full = join(dir, entry)
    const stat = statSync(full)
    if (stat.isDirectory()) {
      files.push(...walk(full))
    } else if (/\.(ts|tsx)$/.test(entry) && !/\.test\.(ts|tsx)$/.test(entry)) {
      files.push(full)
    }
  }
  return files
}

describe('service-role guard', () => {
  it('aucune reference a SUPABASE_SERVICE_ROLE_KEY dans un composant client', () => {
    const offenders: string[] = []
    for (const file of walk(SRC_ROOT)) {
      const content = readFileSync(file, 'utf8')
      if (!content.includes(SECRET_NEEDLE)) continue
      // Premiere ligne non-vide doit ne pas etre 'use client'
      const firstLine = content
        .split('\n')
        .map((l) => l.trim())
        .find((l) => l.length > 0)
      if (firstLine === FORBIDDEN_MARKER || firstLine === `"use client"`) {
        offenders.push(file)
      }
    }
    expect(offenders, `service-role key dans composants client : ${offenders.join(', ')}`).toEqual(
      []
    )
  })
})
