---
numero: "ADR-003"
titre: "Supabase magic link pour l'authentification"
statut: "accepte"
date: 2026-04-10
---

## Contexte

Distil est un MVP solo user. Pas de multi-tenant prevu a court terme. L'objectif est une auth minimale, sans friction d'onboarding, et sans complexite de gestion de mots de passe. Supabase Auth propose magic link (lien email sans mot de passe) parmi ses methodes natives.

## Decision

Nous utilisons le magic link email via Supabase Auth comme unique methode d'authentification pour le MVP.

## Consequences

- Pas de gestion de mot de passe : aucun hashage, aucune politique de rotation, aucun flux "mot de passe oublie" a implementer.
- Dependance deliverability : l'acces a l'app est conditionne a la reception de l'email. Un probleme de deliverabilite (spam, quota) bloque l'utilisateur.
- Fournisseur email : le fournisseur SMTP configure dans Supabase (a preciser) determine la fiabilite de la livraison.
- Evolution : si un second utilisateur doit etre ajoute, magic link reste suffisant. Une refonte auth n'est necessaire qu'en cas de besoin multi-tenant reel.
