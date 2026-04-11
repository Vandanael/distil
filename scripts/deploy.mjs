/**
 * Deploy manuel sur Netlify via build hook.
 * Usage : pnpm deploy
 *
 * Prerequis : NETLIFY_DEPLOY_HOOK dans .env.local
 */
import { readFileSync } from 'fs'
import { execSync } from 'child_process'

const env = readFileSync('.env.local', 'utf8')
const hookUrl = env.match(/NETLIFY_DEPLOY_HOOK=(.+)/)?.[1]?.trim()

if (!hookUrl) {
  console.error('NETLIFY_DEPLOY_HOOK manquant dans .env.local')
  process.exit(1)
}

execSync(`curl -s -X POST "${hookUrl}"`)
console.log('Deploy lance. Build en cours sur https://app.netlify.com/projects/distildev/deploys')
