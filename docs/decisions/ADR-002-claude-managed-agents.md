---
numero: "ADR-002"
titre: "Claude Managed Agents pour l'agent de veille"
statut: "accepte"
date: 2026-04-10
---

## Contexte

L'agent de scoring de Distil doit tourner en continu, effectuer des recherches web, et scorer les contenus selon le profil d'interet de l'utilisateur. Claude Managed Agents est en beta publique depuis avril 2026 et integre nativement un outil `web_search`, ce qui evite de construire cette couche manuellement. L'alternative principale est la Messages API Anthropic avec un outil `web_search` configure manuellement.

## Decision

Nous utilisons Claude Managed Agents comme solution principale pour l'agent de veille. Nous maintenons un fallback via la Messages API Anthropic avec outil `web_search` explicite en cas d'indisponibilite ou de limitation de la beta.

## Consequences

- Dependance beta : Claude Managed Agents est en beta publique. L'API peut changer sans preavis. Le fallback Messages API doit rester fonctionnel et teste.
- Integration simplifiee : web_search integre nativement reduit le code d'orchestration a maintenir.
- Fallback prevu : la separation entre la logique metier de scoring et le transport agent permet de switcher sans tout réécrire.
- Observabilite : a preciser selon ce qu'expose Managed Agents en termes de logs et traces.
