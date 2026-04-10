---
numero: "ADR-001"
titre: "Voyage voyage-3 pour les embeddings"
statut: "accepte"
date: 2026-04-10
---

## Contexte

Distil a besoin de recherche semantique sur la memoire personnelle de l'utilisateur : articles sauvegardes, highlights, notes. Supabase integre pgvector nativement, ce qui resout la couche stockage et requetage vectoriel. Il reste a choisir le modele d'embeddings. Les criteres sont : qualite semantique sur du texte long (articles de presse, posts), cout raisonnable pour un usage solo, et compatibilite avec des dimensions supportees par pgvector.

Options envisagees : OpenAI text-embedding-3-small, Cohere embed-v3, Voyage voyage-3.

## Decision

Nous utilisons Voyage voyage-3 avec des vecteurs de 1024 dimensions pour tous les embeddings de Distil.

## Consequences

- Qualite : voyage-3 est competitive sur les benchmarks de recherche semantique en texte long.
- Cout : dependance a une API externe facturee a l'usage. A surveiller si le volume d'articles ingeres augmente.
- Dependance fournisseur : Voyage AI est un fournisseur tiers. Une migration vers un autre modele imposerait de re-embedder toute la base.
- Dimension fixe : 1024 dimensions est un choix raisonnable entre qualite et volume de stockage. A ne pas changer sans migration complete.
- Interoperabilite : toute modification du modele ou de la dimension necessite une invalidation et regeneration des embeddings existants.
