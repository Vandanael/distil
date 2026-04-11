# Distil - Guide de travail

## Pitch produit

Distil est une veille intelligente et un read-later personnel : il capte, filtre et organise l'information en ligne pour qu'elle reste au service du jugement humain.
L'objectif est de lutter contre le bruit informationnel et les bulles de filtre grace a une curation IA transparente et une diversite editoriale by design.
Solo user, MVP d'abord : chaque fonctionnalite doit valoir son cout de complexite.

---

## Principes editoriaux

1. **Jugement humain pilote l'algo, pas l'inverse.** L'IA propose, trie, resumes -- l'utilisateur decide ce qui compte. Aucun mecanisme de scoring ne doit etre opaque ou irreversible.

2. **Transparence comme pilier, pas comme option.** Chaque score, chaque signal de curation expose sa source. Si on ne peut pas expliquer pourquoi un article remonte, il ne remonte pas.

3. **Diversite by design via Serendipity.** Le systeme introduit activement des signaux hors-bulle. La decouverte n'est pas un effet de bord, c'est une feature de premier rang.

4. **Design editorial communique les valeurs avant le contenu.** La typographie, la hierarchie visuelle, les labels de provenance parlent avant le texte. L'interface est editoriale ou elle ne sert a rien.

---

## Stack technique

| Couche          | Choix                                                        |
| --------------- | ------------------------------------------------------------ |
| Framework       | Next.js 16 App Router, TypeScript strict                     |
| Style           | Tailwind v4, shadcn/ui retokenise (pas de tokens par defaut) |
| Base de donnees | Supabase : Postgres + pgvector + Auth                        |
| IA / agents     | Claude Messages API (Anthropic) - Haiku pour scoring         |
| Embeddings      | Voyage voyage-3                                              |
| Tests           | Vitest (unit), Playwright (E2E)                              |
| Observabilite   | Netlify function logs + Supabase logs                        |
| Deploy          | Netlify                                                      |

---

## Conventions de code

- TypeScript strict partout. `any` interdit. `unknown` + narrowing si necessaire.
- Composants UI : shadcn/ui uniquement, retokenises via `globals.css`. Ne jamais utiliser les tokens shadcn par defaut en production.
- Nommage : composants en PascalCase, fonctions utilitaires en camelCase, constantes en SCREAMING_SNAKE_CASE.
- Imports : chemins absolus via `@/` (alias src/). Pas d'imports relatifs remontants (`../../`).
- Textes UI et docs : jamais de tiret cadratin. Utiliser le tiret demi-cadratin (`-`) ou reformuler.
- Commentaires : en francais, concis, uniquement si la logique n'est pas auto-explicite.
- Pas de `console.log` en production. Netlify function logs pour les erreurs server-side.
- Server Components par defaut. `'use client'` uniquement si interactivite reelle necessaire.

---

## Structure de la documentation

```
docs/
  lessons/     <- Retours d'experience, bugs deja-vus, pieges evites  -> INDEX.md
  decisions/   <- ADR (Architecture Decision Records)                  -> INDEX.md
  sprints/     <- Notes de sprint, retrospectives                       -> INDEX.md
  product/     <- Vision, personas, roadmap, specs fonctionnelles
```

- **Avant toute decision d'architecture non triviale** : relire `docs/decisions/` et verifier si un ADR couvre deja le sujet.
- **Avant de debugger un bug qui sent le deja-vu** : `grep -r "mot-cle" docs/lessons/` avant de chercher ailleurs.
- **Apres chaque incident ou apprentissage notable** : documenter dans `docs/lessons/`.

---

## Personae utilisateurs

- **Yvan** - PM senior, user zero, valide les arbitrages produit sur le terrain.
- **Claire** - Chercheuse, veut de la semantique profonde et une sortie compatible Obsidian.
- **Marc** - Consultant, veut un "push magique" : zero friction, contenu pertinent arrive seul.
- **Sarah** - Dev junior, entre dans l'app via bookmarklet, usage mobile-first.
- **Thomas** - ML engineer, allergique au slop, veut de la densite et des sources primaires.

---

## Regles de travail avec Claude Code

- MVP strict : pas de feature speculaire. Si une fonctionnalite n'a pas de persona qui en a besoin aujourd'hui, elle n'entre pas dans le sprint.
- Chaque PR porte un seul intent. Pas de refactoring opportuniste dans une PR de feature.
- Les tests E2E Playwright couvrent les happy paths des personae, pas des cas inventés.
- Supabase RLS active des le debut. Pas de bypass en developpement.
- Les variables d'environnement sensibles restent dans `.env.local`, jamais committées.
