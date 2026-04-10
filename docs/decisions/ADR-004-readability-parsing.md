---
numero: "ADR-004"
titre: "Readability Mozilla pour le parsing d'articles"
statut: "accepte"
date: 2026-04-10
---

## Contexte

Distil doit extraire le contenu propre des articles web pour la lecture distraction-free et pour l'embedding. Deux options ont ete evaluees : Readability (Mozilla, open source) et Mercury Parser. Le critere principal est la qualite d'extraction sur des sources de presse et de blogs, sans introduire de dependance a un service tiers payant.

## Decision

Nous utilisons Readability (Mozilla) cote serveur pour le parsing d'articles. La decision est revisable si la qualite d'extraction s'avere insuffisante sur les sources prioritaires de Distil.

## Consequences

- Open source : pas de dependance a un fournisseur tiers, pas de cout d'usage, code auditable.
- Qualite a valider : Readability est calibre pour des pages editoriales standard. Des sources atypiques (newsletters, agregateurs, pages JS-heavy) peuvent donner des resultats degrades.
- Execution serveur : le parsing se fait dans un Server Action ou une Route Handler Next.js. Pas de parsing cote client.
- Revisabilite : si la qualite est insuffisante sur un segment de sources, Mercury ou une solution custom peuvent remplacer Readability sans impacter l'interface.
