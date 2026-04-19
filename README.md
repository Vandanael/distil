# Distil

Veille intelligente et read-later personnel. Distil capte, filtre et organise l'information en ligne -- l'IA propose, l'humain décide.

## Stack

|                 |                                                           |
| --------------- | --------------------------------------------------------- |
| Framework       | Next.js 16 App Router, TypeScript strict, React 19        |
| Style           | Tailwind v4, shadcn/ui retokenisé                         |
| Base de données | Supabase (Postgres + pgvector + Auth Google OAuth)        |
| Scoring, ranking, profil | Gemini 2.5 Flash                                 |
| Embeddings      | Voyage AI (voyage-3)                                      |
| Email digest    | Resend + Netlify scheduled function                       |
| Rate limiting   | Upstash Redis (per-IP et per-user)                        |
| Tests           | Vitest (unit + composants), Playwright (E2E par persona)  |
| Deploy          | Netlify                                                   |

## Démarrage

```bash
pnpm install
cp .env.example .env.local  # remplir les clés
pnpm dev
```

L'app tourne sur [localhost:3000](http://localhost:3000).

## Variables d'environnement

Voir `.env.example`. Clés essentielles pour le dev :

- `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` + `SUPABASE_SERVICE_ROLE_KEY`
- `GOOGLE_AI_API_KEY` (scoring + ranking + profile-generator)
- `VOYAGE_API_KEY` (embeddings)
- `CRON_SECRET` (protège /api/cron/\*)
- `DEV_BYPASS_AUTH=true` (bypass auth en local uniquement, `NODE_ENV=development`)

Optionnels : `RESEND_API_KEY` (digest), `VAPID_*` (push PWA), `UPSTASH_REDIS_*` (rate limit), `NETLIFY_DEPLOY_HOOK` (deploy manuel).

## Commandes

```bash
pnpm dev           # serveur de développement
pnpm build         # build production
pnpm test:run      # tests unitaires (Vitest)
pnpm e2e           # tests E2E (Playwright)
pnpm typecheck     # vérification TypeScript
pnpm lint          # ESLint
pnpm check:budget  # budget quotidien Gemini + Voyage (scripts/check-budget.mjs)
pnpm deploy        # déploiement Netlify via webhook
```

Scripts standalone (ops) dans `scripts/` : `bulk-ingest-feeds`, `bulk-embed-items`, `rerank-demo`, `reseed-demo-profiles`, `audit-diversity`, `create-test-accounts`, `load-test`.

## Architecture

```
src/
  app/
    page.tsx        # homepage éditoriale publique (édition du jour)
    about/          # pages publiques
    demo/[slug]/    # aperçu demo par persona (pm, consultant, dev)
    login/          # Google OAuth
    onboarding/     # wizard profil + preview
    (main)/         # routes protégées
      feed/         # fil principal
      article/      # lecture + highlights + notes
      library/      # /library?tab=saved|highlights|filtered (unifie archive/highlights/rejected)
      search/       # full-text + semantique
      profile/      # preferences + export Obsidian
    api/
      cron/         # refresh, digest, cleanup
      articles/     # save + signal (bookmarklet)
      feedback/     # "hors sujet", "deja lu"
      scoring/      # pipeline a la demande
  lib/
    agents/         # scoring, ranking, discovery RSS, profile-generator (Gemini)
    embeddings/     # Voyage AI
    parsing/        # Readability + sanitize-html
    email/          # templates digest + HMAC unsubscribe
    push/           # web-push VAPID
    rate-limit*/    # Upstash + fallback in-memory
    security/       # SSRF guard, beta gate
supabase/
  migrations/       # 22 migrations (schema, RLS, seeds, hardening)
scripts/            # ops standalone (seed, ingest, embed, rerank, audit)
e2e/                # Playwright : smoke, a11y, library, reading-flow, transparency + 5 personae
```

## Pipeline de scoring

1. **Discovery** -- RSS des sources pinned + seed diversifie (26 feeds cross-domaines)
2. **Parse** -- Readability + sanitize-html
3. **Score** -- Gemini evalue selon le profil + signaux (positif archivage, negatif dismiss)
4. **Rank** -- pipeline v2 serendipite (essential vs surprise), guard cosine anti-fuite thematique
5. **Store** -- articles scores stockes avec embeddings pgvector

Seuil d'acceptation : 60/100. Quota sérendipité configurable par profil.

## Tests

Unitaires (Vitest) + E2E (Playwright) par persona (Yvan, Marc, Thomas, Claire, Sarah) + specs transverses (smoke, a11y, library, reading-flow, transparency, about, navigation).

```bash
pnpm test:run      # unitaires
pnpm e2e           # E2E (nécessite pnpm dev en parallèle)
```

## Documentation

- `docs/decisions/` -- ADR (10 décisions d'architecture)
- `docs/lessons/` -- retours d'expérience, pièges connus (grep avant de debug)
- `docs/sprints/` -- plans et wrapups
- `docs/product/` -- vision, personas, specs d'écrans, audit concurrentiel
- `CLAUDE.md` -- guide de travail pour Claude Code
