---
name: lesson-capture
description: Capture une lecon apprise en creant un fichier dans docs/lessons/ et en mettant a jour l'index. Se declenche quand l'utilisateur dit "lesson:", "lecon:" ou "capture cette lecon".
---

## Ce que fait ce skill

Ce skill formalise un apprentissage en un fichier structure et l'indexe immediatement pour qu'il soit retrouvable. L'objectif est de rendre la capture sans friction : l'utilisateur decrit la lecon, le skill fait le reste.

## Declencheurs

- L'utilisateur commence son message par `lesson:` ou `lecon:`
- L'utilisateur dit "capture cette lecon" ou equivalent

## Workflow

1. **Lire** `docs/lessons/TEMPLATE.md` pour avoir le format de reference.

2. **Determiner la date du jour** au format ISO 8601 (`YYYY-MM-DD`).

3. **Construire le nom de fichier** : `YYYY-MM-DD-slug-kebab-case.md` ou le slug est derive du titre fourni par l'utilisateur (minuscules, tirets, sans accents, sans caracteres speciaux).

4. **Creer le fichier** `docs/lessons/YYYY-MM-DD-slug.md` en remplissant toutes les sections du template avec le contenu fourni par l'utilisateur :
   - `date` : date du jour
   - `titre` : titre court factuel
   - `tags` : un ou plusieurs parmi `bug`, `archi`, `perf`, `dx`, `produit`
   - Sections : Contexte, Probleme, Solution, A retenir

5. **Mettre a jour `docs/lessons/INDEX.md`** :
   - Ajouter une ligne dans la table principale (Date, Titre, Tags, Fichier avec lien relatif)
   - Ajouter une reference courte dans chaque section "Par tag" correspondant aux tags choisis

6. **Confirmer** a l'utilisateur : nom du fichier cree, tags, lien vers le fichier.

## Format de confirmation

```
Lecon capturee : docs/lessons/YYYY-MM-DD-slug.md
Tags : [tag1, tag2]
Index mis a jour.
```
