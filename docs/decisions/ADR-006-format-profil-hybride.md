---
numero: "ADR-006"
titre: "Format hybride pour le profil utilisateur"
statut: "accepte"
date: 2026-04-10
---

## Contexte

Le profil d'interet est la source de verite de l'agent de scoring. Deux chemins d'onboarding produisent des donnees de nature differente : Express donne un texte libre d'une a quelques phrases, le Wizard donne des donnees structurees (interets, sources, rythme, quota). Il faut choisir un format de stockage qui serve les deux sans forcer l'un dans le moule de l'autre.

Options envisagees :
- Texte brut uniquement : simple mais perd la precision du Wizard
- JSON structure uniquement : ne peut pas accueillir un profil Express d'une phrase
- Hybride : les deux coexistent, chacun optionnel, l'agent consomme les deux

## Decision

Nous utilisons un format hybride dans la table `profiles` :
- `profile_text TEXT` : texte libre issu du chemin Express (ou du textarea du Wizard)
- `profile_structured JSONB` : donnees structurees issues du Wizard (interests, pinned_sources, daily_cap, serendipity_quota)
- `sector TEXT` : secteur selectionne dans le dropdown Express (mitigation Marc)

Aucun des deux champs ne remplace l'autre. Les deux sont optionnels individuellement mais au moins un doit etre renseigne. Le prompt de scoring concatene les deux : "Profil libre : {profile_text}. Preferences structurees : {JSON.stringify(profile_structured)}. Secteur : {sector}."

Quand un utilisateur Express edite ensuite son profil via l'ecran preferences, les champs structures se remplissent progressivement sans ecraser le texte libre.

## Consequences

- Flexibilite : Express fonctionne avec une seule phrase, Wizard avec des donnees precises. Les deux coexistent.
- Schema stable : pas de migration a prevoir si l'utilisateur passe d'Express a Wizard. Les colonnes sont la des le depart.
- Prompt agent plus riche : l'agent recoit toujours le maximum d'informations disponibles, quelle que soit la methode d'onboarding.
- Validation : au moins un de `profile_text`, `sector`, ou `profile_structured` non-vide est requis pour soumettre l'onboarding.
- Evolution : si de nouveaux champs structures sont ajoutes (ex. langues, formats preferes), ils s'ajoutent dans le JSONB sans migration de colonne.
