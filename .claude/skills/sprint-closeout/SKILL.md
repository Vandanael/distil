---
name: sprint-closeout
description: Cloture un sprint en generant le wrapup dans docs/sprints/, en mettant a jour l'index, et en proposant des lessons candidates a archiver. Se declenche sur "closeout sprint N" ou "fin du sprint N".
---

## Ce que fait ce skill

Ce skill genere le bilan d'un sprint termine : ce qui a ete livre, ce qui ne l'a pas ete, les decisions prises en cours de route, et les apprentissages qui meritent d'etre captures comme lessons. Il maintient une trace de la velocite reelle du projet.

## Declencheurs

- L'utilisateur dit `closeout sprint N` ou `fin du sprint N`
- L'utilisateur dit "je veux clore le sprint" suivi d'un numero

## Workflow

1. **Lire `docs/sprints/INDEX.md`** pour verifier que le sprint N n'a pas deja un wrapup associe.

2. **Lire `docs/product/`** pour retrouver les objectifs initiaux du sprint (roadmap, specs). Si aucun fichier de planification n'existe pour ce sprint, demander a l'utilisateur de fournir les objectifs initiaux et les resultats.

3. **Construire le nom de fichier** : `sprint-N-wrapup.md`.

4. **Generer le fichier** `docs/sprints/sprint-N-wrapup.md` avec les sections suivantes :

```
# Sprint N - Wrapup

## Dates
[debut] -> [fin]

## Livre
- Liste des fonctionnalites ou ecrans effectivement livres

## Pas livre
- Ce qui etait prevu mais reporte, avec la raison courte

## Decisions prises en cours de sprint
- Arbitrages, pivots, coupes de scope (avec lien vers ADR si applicable)

## Lessons candidates
- Liste des apprentissages qui meritent d'etre captures via /lesson
```

5. **Mettre a jour `docs/sprints/INDEX.md`** : ajouter ou completer la ligne du sprint N (dates, ecrans livres, lien vers le wrapup).

6. **Proposer les lessons candidates** a l'utilisateur : lister les points de la section "Lessons candidates" et suggerer explicitement de les capturer avec `lesson: [titre]`.

## Format de confirmation

```
Wrapup genere : docs/sprints/sprint-N-wrapup.md
Index des sprints mis a jour.

Lessons candidates a capturer :
- [titre 1] -> taper : lesson: [titre 1]
- [titre 2] -> taper : lesson: [titre 2]
```
