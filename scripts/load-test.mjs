#!/usr/bin/env node
/**
 * Load test leger - valide que le rate limiter Upstash retourne bien 429.
 *
 * Usage : node scripts/load-test.mjs [baseUrl]
 *   baseUrl defaut : http://localhost:3000
 *
 * Tests :
 * 1. Burst /api/feed/status (userActionRateLimiter = 60/min) : 70 req, attend au moins un 429.
 * 2. Burst /api/scoring/run (expensiveRateLimiter = 10/min) : 15 req, attend 429 autour de la 11e.
 * 3. Cron excluded : /api/cron/* ne doit pas etre rate limite (auth check passe avant).
 *
 * Limites :
 * - Pas de connexion reelle : les 429 peuvent tomber avant 401 selon l'ordre middleware.
 *   Ici le middleware runs en premier, donc 429 attendu meme sans cookie.
 * - Ce n'est PAS un test de charge : juste une verif que la protection fonctionne.
 */

const BASE = process.argv[2] ?? 'http://localhost:3000'

async function burst(path, count) {
  const results = { status: {}, total: count }
  const promises = []
  for (let i = 0; i < count; i++) {
    promises.push(
      fetch(`${BASE}${path}`, { method: 'POST' })
        .then((r) => {
          results.status[r.status] = (results.status[r.status] ?? 0) + 1
        })
        .catch(() => {
          results.status.error = (results.status.error ?? 0) + 1
        })
    )
  }
  await Promise.all(promises)
  return results
}

async function main() {
  console.log(`Load test vs ${BASE}\n${'─'.repeat(50)}`)

  console.log('\n1. userAction burst (/api/feed/status × 70)')
  const r1 = await burst('/api/feed/status', 70)
  console.log(`   status counts : ${JSON.stringify(r1.status)}`)
  const has429_1 = (r1.status['429'] ?? 0) > 0
  console.log(`   429 observe : ${has429_1 ? 'OUI' : 'NON'}`)

  console.log('\n2. expensive burst (/api/scoring/run × 15)')
  const r2 = await burst('/api/scoring/run', 15)
  console.log(`   status counts : ${JSON.stringify(r2.status)}`)
  const has429_2 = (r2.status['429'] ?? 0) > 0
  console.log(`   429 observe : ${has429_2 ? 'OUI' : 'NON'}`)

  console.log('\n3. cron bypass (/api/cron/budget-alert × 5)')
  const r3 = await burst('/api/cron/budget-alert', 5)
  console.log(`   status counts : ${JSON.stringify(r3.status)}`)
  const no429_3 = (r3.status['429'] ?? 0) === 0
  console.log(`   pas de 429 (attendu) : ${no429_3 ? 'OUI' : 'NON'}`)

  const pass = has429_1 && has429_2 && no429_3
  console.log(`\n${'─'.repeat(50)}`)
  console.log(pass ? 'OK - rate limiter fonctionne.' : 'FAIL - comportement inattendu.')
  process.exit(pass ? 0 : 1)
}

main().catch((e) => {
  console.error('Erreur :', e)
  process.exit(1)
})
