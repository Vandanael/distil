# Plan d'implementation Distil - Sprint Zero Bloc E a Sprint 10

## Contexte

Distil est un read-later intelligent solo-user avec curation IA anti-bruit, anti-bulle. La discovery est terminee (etude marche, card sorting, user flows, specs ecrans, 5 ADR acceptes). Aucun code n'existe encore. Ce plan couvre la totalite de l'implementation, du squelette technique au produit final.

---

## Prealable : 2 ADR a creer avant le code

### ADR-006 : Format hybride pour le profil utilisateur
- `profile_text` (texte libre Express) + `profile_structured` (JSONB Wizard) + `sector` (dropdown Marc)
- Aucun des deux ne remplace l'autre. L'agent de scoring consomme les deux dans son prompt.

### ADR-007 : Stockage des highlights par ancrage texte
- Range-based avec fallback texte (pas de DOM offsets purs, trop fragiles au re-parsing)
- On stocke : texte selectionne, 30 chars avant/apres, CSS selector du parent, offset dans ce parent
- Si le re-ancrage echoue, le highlight reste affichable comme citation orpheline (le texte est toujours la)
- Approche validee par Hypothesis, Apache Annotator, W3C Web Annotation Data Model

---

## Concerns transversaux

### Auth (ADR-003)
- `/login` : email input -> `supabase.auth.signInWithOtp()`
- `/auth/callback` : echange token -> session cookie via `@supabase/ssr`
- `src/middleware.ts` : refresh session, redirige non-authentifie vers `/login`, sans profil vers `/onboarding`
- RLS : `auth.uid() = user_id` sur chaque table, service role pour l'agent de scoring

### Agent de scoring (ADR-002)
```
src/lib/agents/
  types.ts            -- ScoringRequest, ScoringResult, RejectionReason
  scoring-agent.ts    -- orchestrateur : Managed Agent, fallback Messages API
  managed-agent.ts    -- client Claude Managed Agents
  messages-api.ts     -- fallback Messages API + web_search tool
  prompts.ts          -- system prompt, formatage profil
```
- Tourne cote serveur uniquement (Route Handler ou Server Action)
- Recoit profil (text + structured) + batch de candidats
- Retourne : score 0-100, justification, is_serendipity, rejection_reason
- Fallback declenche sur erreur HTTP ou timeout. Log Sentry tag `agent.fallback`.

### Embeddings Voyage (ADR-001)
```
src/lib/embeddings/
  voyage.ts           -- client Voyage API, batch embed
  embed-article.ts    -- embed content_text (chunke si > 8000 tokens)
  embed-profile.ts    -- embed profil pour distance semantique
  embed-query.ts      -- embed requete de recherche
  chunker.ts          -- decoupe articles longs en chunks de ~4000 tokens
```
- Embed au save article, creation highlight/note, update profil
- Colonne `embedding vector(1024)` sur articles, highlights, notes, profiles
- Requete via `<=>` (cosine) et RPC `match_articles()`

### Parsing (ADR-004)
```
src/lib/parsing/
  readability.ts      -- parse(url) -> ParsedArticle
  fetcher.ts          -- fetch avec timeout, retry, user-agent
```
- `@mozilla/readability` + `jsdom` cote serveur
- Extrait : title, author, content_html, content_text, excerpt, word_count
- Temps de lecture : `Math.ceil(wordCount / 238)`

### Erreurs
- Sentry pour les erreurs serveur (+ `src/app/global-error.tsx`)
- shadcn Sonner retokenise pour les toasts utilisateur
- Pas de `console.log` en production

### Tests
- **Vitest** : fonctions pures, route handlers (mock Supabase/API), composants logic-heavy
- **Playwright** : un fichier par persona (`e2e/yvan.spec.ts`, etc.), happy paths uniquement
- Auth E2E : Supabase inbucket pour les magic links en dev

---

## Schema Supabase

### Extensions
```sql
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

### profiles (Sprint 1)
- `id` UUID PK -> auth.users, `profile_text` TEXT, `profile_structured` JSONB, `sector` TEXT
- `interests` TEXT[], `pinned_sources` TEXT[], `daily_cap` INT (defaut 10), `serendipity_quota` FLOAT (defaut 0.15)
- `show_scores` BOOLEAN, `dark_mode` BOOLEAN, `onboarding_completed` BOOLEAN, `onboarding_method` TEXT
- `embedding` vector(1024), timestamps

### articles (Sprint 2)
- `id` UUID PK, `user_id` FK, `url`, `title`, `author`, `site_name`, `published_at`
- `content_html`, `content_text`, `excerpt`, `word_count`, `reading_time_minutes`
- `score` FLOAT, `justification` TEXT, `is_serendipity` BOOLEAN
- `origin` (agent/bookmarklet), `status` (pending/accepted/rejected/archived/read)
- `rejection_reason` TEXT, `kept_anyway` BOOLEAN
- `embedding` vector(1024), timestamps
- Index : `(user_id, status)`, `(user_id, scored_at DESC)`, ivfflat sur embedding, gin trigram sur content_text

### scoring_runs (Sprint 2)
- `id`, `user_id`, `started_at`, `completed_at`, `articles_analyzed/accepted/rejected`, `agent_type`, `error`, `duration_ms`

### highlights (Sprint 4)
- `id`, `article_id` FK, `user_id` FK
- `text_content`, `prefix_context` (30 chars), `suffix_context` (30 chars), `css_selector`, `text_offset`
- `embedding` vector(1024), timestamp

### notes (Sprint 4)
- `id`, `article_id` FK, `highlight_id` FK nullable, `user_id` FK, `content`, `embedding`, timestamps

### tags + article_tags (Sprint 4)
- `tags` : `id`, `user_id`, `name`, UNIQUE(user_id, name)
- `article_tags` : junction table

### article_chunks (Sprint 6)
- `id`, `article_id` FK, `chunk_index`, `content_text`, `embedding` vector(1024)

### RPC match_articles (Sprint 6)
- Cosine similarity search sur articles + chunks, filtre user_id et status, threshold 0.7

---

## Sprint Zero Bloc E - Squelette technique

**But** : app Next.js 15 vide deployable avec toute la toolchain branchee.

### Arborescence cible
```
src/
  app/
    (auth)/login/page.tsx, callback/route.ts
    (main)/layout.tsx, page.tsx (redirect /feed)
    layout.tsx, globals.css, global-error.tsx
  components/ui/        -- shadcn retokenise
  lib/
    supabase/server.ts, client.ts, middleware.ts
    utils.ts            -- cn() helper
  middleware.ts
e2e/fixtures/auth.ts, smoke.spec.ts
public/fonts/Fraunces/, SourceSerif4/, GeistSans/
supabase/migrations/00001_initial_schema.sql, config.toml, seed.sql
playwright.config.ts, vitest.config.ts
.env.local.example
.github/workflows/ci.yml
```

### Etapes
1. `npx create-next-app@latest` (TS, Tailwind, ESLint, App Router, src/, `@/*`)
2. Installer : `@supabase/supabase-js`, `@supabase/ssr`, `vitest`, `@playwright/test`, `@sentry/nextjs`
3. `npx shadcn@latest init` + installer button, card, input, textarea, label, sonner
4. Retokeniser `globals.css` : palette (marine, orange, cream), typo (Fraunces, Source Serif 4, Geist), shadcn semantic tokens
5. Configurer fonts via `next/font/local` dans `layout.tsx`
6. `npx supabase init`, migration initiale (profiles + pgvector)
7. Wirer Supabase clients (server/client/middleware)
8. Sentry init (`npx @sentry/wizard -i nextjs`)
9. Playwright config (chromium, webServer, testDir e2e/)
10. Vitest config (jsdom, aliases)
11. CI : `.github/workflows/ci.yml` (lint, typecheck, unit, E2E)
12. `npx vercel link`

### Definition of done
- `pnpm dev` sert une page avec Fraunces titre, Source Serif body, Geist UI, fond creme, texte marine
- `pnpm test` passe (test dummy), `pnpm playwright test` passe (smoke)
- `pnpm lint` et `tsc --noEmit` passent
- Supabase local demarre, table profiles existe
- Sentry capture une erreur test
- Preview Vercel fonctionne
- CI vert

---

## Sprint 1 - Onboarding + Profil + Auth

**But** : un utilisateur peut se connecter par magic link, completer l'onboarding (Express ou Wizard), et avoir un profil en base.

### Ecrans
- Accueil onboarding (2 cartes : Express / Guide)
- Express (textarea + dropdown secteur + "Personnaliser davantage")
- Wizard (5 etapes : interets, sources, rythme, serendipity, recap)
- Profil/preferences (version initiale)

### Fichiers cles
- `src/app/(auth)/login/page.tsx`, `callback/route.ts`
- `src/app/(onboarding)/page.tsx`, `express/page.tsx`, `wizard/page.tsx`
- `src/app/(onboarding)/wizard/steps/` (5 composants)
- `src/app/(onboarding)/actions.ts` - Server Action `createProfile()`
- `src/app/(main)/profile/page.tsx`, `actions.ts`

### E2E
- `marc.spec.ts` : Express, selectionne "Consulting" sans textarea, profil cree
- `thomas.spec.ts` : Wizard 5 etapes, interets explicites, cap 5, serendipity 30%
- `yvan.spec.ts` : Express, tape "PM senior, product, IA, startups", verifie profil

### Risques
- Deliverabilite magic link en prod -> configurer SMTP custom (Resend/Postmark) tot
- Wizard state -> `useReducer` dans un seul client component, pas de routes separees par etape

---

## Sprint 2 - Agent de scoring backend

**But** : l'agent Claude analyse le web, score les articles contre le profil, stocke acceptes et rejetes en base.

### Pas d'ecran. Backend only.

### Fichiers cles
- Migration `00002_articles_scoring.sql` (articles + scoring_runs)
- `src/lib/agents/` (toute la couche agent)
- `src/lib/parsing/` (Readability + fetcher)
- `src/app/api/scoring/run/route.ts`, `status/route.ts`
- Installer : `@anthropic-ai/sdk`, `@mozilla/readability`, `jsdom`

### Logique serendipity
- `serendipity_quota * daily_cap` articles hors-profil
- Prompt demande explicitement N articles "adjacents mais pas identiques"
- Flag `is_serendipity = true`

### E2E
- `scoring.spec.ts` : trigger run via API pour profil Yvan, verifier articles accepted/rejected en base avec justification/rejection_reason non-null

### Risques
- Beta Managed Agents instable -> fallback Messages API des le jour 1
- Profil 1 phrase (Marc "Consulting") peut donner des resultats faibles -> tester et ajuster prompt avec defaults par secteur

---

## Sprint 3 - Feed + Lecture + Rejetes

**But** : l'utilisateur voit ses articles scores, lit en mode distraction-free, consulte les rejetes avec raisons.

### Ecrans
- Feed hub (cards scores, labels origine, score au hover, lien "Voir les rejetes")
- Lecture distraction-free (article parse, barre d'actions placeholder)
- Ecran Rejetes (raison par article, "Garder quand meme")

### Fichiers cles
- `src/app/(main)/feed/page.tsx` + composants (ArticleCard, FeedHeader, EmptyFeed)
- `src/app/(main)/article/[id]/page.tsx` + ReadingView
- `src/app/(main)/rejected/page.tsx` + RejectedCard + action `keepArticle()`

### Typographie
- Feed : Fraunces titres, Geist metadonnees
- Lecture : Source Serif 4 corps, Fraunces titre article
- UI : Geist partout

### E2E
- `yvan.spec.ts` : feed avec articles, score au hover, ouvre article, lit, retour feed
- `thomas.spec.ts` : ecran rejetes, voit raisons, "Garder quand meme", article remonte

### Risques
- Qualite parsing variable -> tester 10 URLs reelles, fallback "Impossible de parser" avec lien original
- Feed vide jour 1 -> declencher scoring run immediatement apres onboarding

---

## Sprint 4 - Actions post-lecture + Feedback loop + Profil v2

**But** : highlights, notes, tags, archive. La lecture nourrit le profil.

### Ecrans
- Actions post-lecture (highlight popover, note, tag input, archive)
- Profil v2 (toggle "Afficher les scores", bouton "Re-scorer")

### Fichiers cles
- Migration `00003_highlights_notes_tags.sql`
- `src/app/(main)/article/[id]/components/` (HighlightPopover, FloatingActionBar, NoteEditor, TagInput)
- `src/lib/highlights/serializer.ts` + `anchorer.ts` (ADR-007)
- `src/app/(main)/profile/` (toggle score, bouton rescore)

### Feedback loop (MVP minimal)
- `read_at` et `archived_at` enregistres
- Prompt scoring mis a jour : "L'utilisateur a lu et archive des articles sur : [tags des articles archives]"

### E2E
- `claire.spec.ts` : highlight, note sur highlight, tag "semantique", retour feed, re-score
- `yvan.spec.ts` : archive un article, disparait du feed

---

## Sprint 5 - Enrichissement highlights/notes + Embeddings

**But** : tous les contenus sont embeddes. Highlights consultables hors contexte article.

### Fichiers cles
- `src/lib/embeddings/` (voyage.ts, embed-article/highlight/note/profile.ts)
- `src/app/(main)/article/[id]/components/HighlightsSidebar.tsx`
- `src/app/(main)/highlights/page.tsx` (vue globale)

### E2E
- `claire.spec.ts` : page highlights, groupes par article, notes inline

### Risques
- Rate limits Voyage -> batch, embed async, ne jamais re-embedder un contenu inchange
- Latence -> fire-and-forget du point de vue utilisateur

---

## Sprint 6 - Search full-text + semantique

**But** : retrouver articles, highlights, notes par recherche full-text ou semantique.

### Fichiers cles
- Migration `00004_article_chunks_search.sql` (chunks, RPC match_articles, index trigram)
- `src/app/(main)/search/page.tsx` + composants (SearchInput, SearchResults)
- `src/app/(main)/search/actions.ts` (searchFullText, searchSemantic)
- `src/lib/embeddings/chunker.ts`

### E2E
- `claire.spec.ts` : search full-text "semantique", puis search semantique "comment fonctionnent les embeddings"
- `yvan.spec.ts` : retrouve un article archive par titre partiel

---

## Sprint 7 - Anti-bulle Serendipity

**But** : serendipity visible et controlable. Badge, quota, distance semantique.

### Fichiers cles
- `src/app/(main)/feed/components/SerendipityBadge.tsx`
- Migration `00005_serendipity.sql` (colonne serendipity_distance sur profiles)
- Update `prompts.ts` : 3 niveaux de distance (proche/moyen/loin)
- Profil : radio buttons distance semantique

### E2E
- `thomas.spec.ts` : badges serendipity visibles, quota ~30%, change distance a "loin"
- `claire.spec.ts` : au moins 1 article serendipity dans son feed de 10

---

## Sprint 8 - Bookmarklet + API save

**But** : sauvegarder un article depuis n'importe quelle page web.

### Fichiers cles
- `src/app/api/articles/save/route.ts` (POST, auth par token)
- Migration `00006_api_token.sql` (colonne api_token sur profiles)
- `src/app/(main)/profile/components/BookmarkletInstall.tsx`

### E2E
- `sarah.spec.ts` : appel API save, article dans le feed avec label "Sauvegarde par toi"

### Risques
- CORS bookmarklet -> redirect vers `distil.app/save?url=ENCODED` plutot que fetch cross-origin

---

## Sprint 9 - Polish + accessibilite

**But** : raffiner l'UX, performance, clavier, accessibilite.

### Travail
- Audit performance (bundle < 200KB first load JS)
- Raccourcis clavier : j/k feed, Esc retour, h highlight
- Audit accessibilite (aria, focus, contraste WCAG AA)
- Etats d'erreur gracieux partout
- Verifier zero token shadcn par defaut visible
- Regression complete E2E

---

## Sprint 10 - PWA + dark mode + production

**But** : installable, dark mode, pret pour usage quotidien.

### Fichiers cles
- `public/manifest.json`
- Service worker via `next-pwa`
- Tokens dark dans `globals.css` sous `[data-theme="dark"]`
- `src/components/ThemeProvider.tsx`

### E2E
- `sarah.spec.ts` : installe PWA, ouvre, toggle dark mode
- Regression complete light + dark

---

## Graphe de dependances

```
Sprint 0E -> Sprint 1 -> Sprint 2 -> Sprint 3 -> Sprint 4 -> Sprint 5 -> Sprint 6
                                           |             |             |
                                           v             v             v
                                      Sprint 8      Sprint 7      (Sprint 6)
                                           |
                                           v
                                      Sprint 9 -> Sprint 10
```

Sprint 7 (Serendipity) depend du Sprint 5 (embeddings profil).
Sprint 8 (Bookmarklet) depend du Sprint 3 (parsing pipeline).
Le reste est sequentiel.

---

## Variables d'environnement

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=         # server-only, agent scoring
ANTHROPIC_API_KEY=                 # Claude Managed Agents + Messages API
VOYAGE_API_KEY=                    # Voyage voyage-3
SENTRY_DSN=
NEXT_PUBLIC_SENTRY_DSN=
```

Jamais commites. `.env.local.example` les documente avec valeurs vides.

---

## Verification

Pour valider ce plan apres execution :
1. Chaque sprint se termine par `pnpm test` + `pnpm playwright test` verts
2. Chaque migration Supabase est testable via `npx supabase db reset`
3. Preview Vercel deployable a chaque PR
4. Les 5 fichiers persona E2E couvrent tous les happy paths au sprint 10
5. Lighthouse > 90 performance au sprint 10
