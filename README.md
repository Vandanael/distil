# Distil

Veille intelligente et read-later personnel. Distil capte, filtre et organise l'information en ligne -- l'IA propose, l'humain décide.

## Stack

|                 |                                                           |
| --------------- | --------------------------------------------------------- |
| Framework       | Next.js 16 App Router, TypeScript strict                  |
| Style           | Tailwind v4, shadcn/ui retokenisé                         |
| Base de données | Supabase (Postgres + pgvector + Auth)                     |
| Scoring         | Gemini 2.5 Flash                                          |
| Embeddings      | Voyage AI (voyage-3)                                      |
| Email           | Resend                                                    |
| Deploy          | Netlify                                                   |

## Démarrage

```bash
pnpm install
cp .env.local.example .env.local  # remplir les clés
pnpm dev
```

L'app tourne sur [localhost:3000](http://localhost:3000).

## Variables d'environnement

Voir `.env.local.example` -- toutes les clés sont documentées.

Les clés essentielles pour le dev :

- `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` + `SUPABASE_SERVICE_ROLE_KEY`
- `GOOGLE_AI_API_KEY` (scoring + ranking)
- `VOYAGE_API_KEY` (embeddings)
- `DEV_BYPASS_AUTH=true` (bypass auth en local)

## Commandes

```bash
pnpm dev          # serveur de développement
pnpm build        # build production
pnpm test:run     # tests unitaires (Vitest)
pnpm e2e          # tests E2E (Playwright)
pnpm typecheck    # vérification TypeScript
pnpm lint         # ESLint
pnpm deploy       # déploiement Netlify via webhook
```

## Architecture

```
src/
  app/
    (main)/       # pages protégées par auth
      feed/       # fil principal
      article/    # lecture + highlights + notes
      archive/    # articles archivés
      search/     # recherche full-text et sémantique
      profile/    # préférences utilisateur
    api/
      cron/       # refresh quotidien + digest email
      scoring/    # pipeline de scoring à la demande
      articles/   # bookmarklet (save/signal)
  lib/
    agents/       # scoring LLM (Gemini), discovery RSS
    parsing/      # Readability + sanitize-html
    email/        # templates digest + tokens HMAC
    hooks/        # swipe to dismiss, keyboard nav, dismiss with undo
    embeddings/   # Voyage AI
supabase/
  migrations/     # 9 migrations (schema + RLS)
e2e/              # tests Playwright par persona
```

## Pipeline de scoring

1. **Discovery** -- flux RSS des sources du profil (130 sources indexées)
2. **Parse** -- Readability + sanitize-html, max 20 articles par run
3. **Score** -- LLM évalue 0-100 selon le profil, avec signaux positifs (archivés récemment) et négatifs (rejetés comme hors-sujet)
4. **Store** -- articles acceptés stockés avec embeddings vectoriels

Seuil d'acceptation : 60/100. Quota sérendipité : 15% par défaut.

## Tests

134 tests unitaires (Vitest) + E2E Playwright par persona (Yvan, Marc, Thomas, Claire, Sarah).

```bash
pnpm test:run     # unitaires
pnpm e2e          # E2E (nécessite pnpm dev en parallèle)
```
