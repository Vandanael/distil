---
numero: "ADR-005"
titre: "shadcn/ui retokenise plutot que Tailwind brut"
statut: "accepte"
date: 2026-04-10
---

## Contexte

Distil a besoin d'une identite visuelle forte et editoriale (palette inspiree Le Monde x Substack, typographies Fraunces, Source Serif 4, Geist) tout en evitant de construire chaque composant UI de zero. Deux approches envisagees : Tailwind brut avec composants maison, ou shadcn/ui dont le code est possede et modifiable. shadcn permet de copier les composants dans le repo et de les retokeniser completement via les variables CSS de Tailwind v4.

## Decision

Nous utilisons shadcn/ui avec tokens customises : couleurs et typographie sont entierement redefinies. Le look shadcn par defaut n'apparait pas en production.

## Consequences

- Ownership total : les composants sont dans le repo, pas dans node_modules. On peut les modifier sans attendre une mise a jour upstream.
- Effort initial : la retokenisation complete (couleurs, typographie, spacing si necessaire) est un travail a faire en debut de projet avant de construire les premiers ecrans.
- Coherence : toute nouvelle installation de composant shadcn doit etre retokenisee avant usage. Le look par defaut est a considerer comme un point de depart, jamais un livrable.
- Tailwind v4 : la retokenisation s'appuie sur les CSS custom properties de Tailwind v4. Pas de fichier de config JS pour les tokens, tout passe par globals.css.
