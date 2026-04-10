---
name: adr-new
description: Cree un nouvel ADR numerote automatiquement dans docs/decisions/ et met a jour l'index. Se declenche sur "nouvel ADR", "adr:" ou "decision d'archi".
---

## Ce que fait ce skill

Ce skill formalise une decision d'architecture en un ADR numerote, nomme de facon coherente, et indexe immediatement. Il garantit que chaque decision non triviale est tracee avant d'etre implementee.

## Declencheurs

- L'utilisateur commence par `adr:` ou `nouvel ADR`
- L'utilisateur dit "decision d'archi" ou "je veux documenter une decision"

## Workflow

1. **Lire `docs/decisions/INDEX.md`** pour identifier le dernier numero utilise et determiner le prochain (`ADR-NNN` avec zero-padding sur 3 chiffres).

2. **Lire `docs/decisions/TEMPLATE.md`** pour avoir le format de reference.

3. **Construire le nom de fichier** : `ADR-NNN-slug-kebab-case.md` ou le slug est derive du titre fourni par l'utilisateur.

4. **Creer le fichier** `docs/decisions/ADR-NNN-slug.md` en remplissant le template :
   - `numero` : `ADR-NNN`
   - `titre` : titre court et factuel de la decision
   - `statut` : `propose` par defaut (l'utilisateur peut preciser `accepte` ou `obsolete`)
   - `date` : date du jour au format ISO 8601
   - Sections : Contexte, Decision (voix active), Consequences

5. **Mettre a jour `docs/decisions/INDEX.md`** : ajouter une ligne dans la table (Numero, Titre, Statut, Date avec lien relatif vers le fichier).

6. **Confirmer** a l'utilisateur et rappeler la regle : avant d'implementer, s'assurer que le statut passe a `accepte`.

## Format de confirmation

```
ADR cree : docs/decisions/ADR-NNN-slug.md
Statut : propose
Index mis a jour.
Penser a passer le statut a "accepte" avant implementation.
```
