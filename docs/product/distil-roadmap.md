# Distil — Roadmap projet

Projet side perso d'Yvan. Veille intelligente + read-later, curation IA anti-bruit, anti-bulle.

## Décisions produit validées

- Web_search au centre, RSS optionnel (pin favoris)
- Scoring transparent : justification par article gardé, écran Rejetés consultable
- Onboarding double : Express (textarea) + Guidé (wizard 5 étapes)
- Anti-bulle visible, badge Serendipity, quota 15% par défaut
- Embeddings Voyage voyage-3, 1024 dimensions
- Palette Le Monde × Substack (marine #11284B + orange désaturé #D94E1F, crème #FBF9F4)
- Typo : Fraunces (titres), Source Serif 4 (lecture), Geist Sans (UI)
- Scope MVP strict : article web only, solo user, bookmarklet inclus
- Phase 2 : PDF, YouTube, extension Chrome, export Obsidian

## Stack

- Next.js 15 App Router, TS strict, Tailwind v4, shadcn retokenisé
- Supabase (Postgres + pgvector + Auth)
- Claude Managed Agents (fallback : Messages API + web_search tool)
- Voyage voyage-3 pour embeddings
- Playwright E2E dès le sprint zero
- Vitest unit, Sentry, Vercel deploy

## Structure complète

```
SPRINT ZERO (Discovery finalisée + Setup)
├── Bloc 0 — Étude marché (open source, payant, presse)   ← AJOUTÉ
├── Bloc A — Atelier tri par cartes
├── Bloc B — User flows détaillés
├── Bloc C — Specs fonctionnelles par écran
├── Bloc D — Setup Claude Code + VS Code + Skills
└── Bloc E — Squelette technique (repo, CI, Playwright, tokens design)

SPRINTS FEATURE (1 sprint = 1 bloc autonome testable)
├── Sprint 1 — Onboarding et profil d'intérêt (Express + Guidé)
├── Sprint 2 — Agent de scoring (web_search au centre)
├── Sprint 3 — Feed et lecture (newspaper UI)
├── Sprint 4 — Actions utilisateur et feedback loop
├── Sprint 5 — Highlights et notes
├── Sprint 6 — Recherche full-text + sémantique
├── Sprint 7 — Anti-bulle Serendipity
├── Sprint 8 — Écran Rejetés et transparence du scoring
├── Sprint 9 — Bookmarklet + API save
└── Sprint 10 — Polish, PWA, dark mode
```

## Personae synthétiques (résumé)

1. Yvan (user zero) — PM senior, cimetière Pocket, veut 5 articles/matin
2. Claire — chercheuse, veut recherche sémantique + anti-bulle + export Obsidian
3. Marc — consultant, ne configurera jamais de RSS, veut push magique
4. Sarah — dev junior, veut bookmarklet et zéro friction
5. Thomas — ML engineer, veut détection anti-slop LLM et scoring transparent
