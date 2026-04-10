/**
 * Verifie que le bundle JS statique reste sous le budget defini.
 *
 * Contexte : .next/static/chunks/ contient le framework (React 19 + Next.js 16)
 * + les chunks applicatifs. Le framework seul represente ~700 KB — c'est un cout
 * fixe. Le budget surveille les regressions (ajout accidentel d'une librairie lourde).
 *
 * Historique :
 *   Sprint 1  : 870 KB total, 222 KB plus gros chunk (React + framework)
 *
 * Cible Sprint 9 : < 200 KB first load JS app-only (Lighthouse), budgets a resserer.
 *
 * Usage : pnpm build && pnpm check:budget
 */
import { readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const BUDGETS = {
  // Total JS dans .next/static/chunks/ (framework + app)
  // Sprint 1 baseline : 870 KB — budget = baseline + 25% de marge
  totalChunksKb: 1100,
  // Plus gros chunk individuel — React + Next.js runtime ~ 222 KB actuellement
  largestChunkKb: 300,
}

const chunksDir = '.next/static/chunks'

let files
try {
  files = readdirSync(chunksDir).filter((f) => f.endsWith('.js'))
} catch {
  console.error('Erreur : lancez "pnpm build" avant "pnpm check:budget"')
  process.exit(1)
}

let totalBytes = 0
let largestBytes = 0
let largestFile = ''

for (const file of files) {
  const size = statSync(join(chunksDir, file)).size
  totalBytes += size
  if (size > largestBytes) {
    largestBytes = size
    largestFile = file
  }
}

const totalKb = totalBytes / 1024
const largestKb = largestBytes / 1024

console.log(`\nBudget JS - Distil\n${'─'.repeat(40)}`)
console.log(`Total chunks  : ${totalKb.toFixed(1)} KB  (budget : ${BUDGETS.totalChunksKb} KB)`)
console.log(
  `Plus gros     : ${largestKb.toFixed(1)} KB  (${largestFile})  (budget : ${BUDGETS.largestChunkKb} KB)`
)
console.log(`Fichiers JS   : ${files.length}`)

let failed = false

if (totalKb > BUDGETS.totalChunksKb) {
  console.error(
    `\nERREUR : budget total depasse — ${totalKb.toFixed(1)} KB > ${BUDGETS.totalChunksKb} KB`
  )
  failed = true
}

if (largestKb > BUDGETS.largestChunkKb) {
  console.error(
    `ERREUR : chunk trop lourd — ${largestFile} (${largestKb.toFixed(1)} KB > ${BUDGETS.largestChunkKb} KB)`
  )
  failed = true
}

if (failed) {
  process.exit(1)
} else {
  console.log('\nOK — budget respecte.')
}
