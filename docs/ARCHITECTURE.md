# ARCHITECTURE — Domora

Détail technique. À lire après `BRIEF.md`, avant de coder. Le point le plus important est le **§4 (les 3 approches visuelles)** — c'est là que la plupart des gens sur-scopent et se plantent.

---

## 1. Vue d'ensemble

```
                          ┌──────────────────────────────┐
   Agent immo filme       │   SERVICE CAPTURE (externe)   │
   (vidéo téléphone)  ──▶  │  Polycam / Luma / Postshot    │ ──▶  fichier splat (.spz/.splat/.ksplat)
                          └──────────────────────────────┘
                                        │ upload
                                        ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                              DOMORA (Next.js / Vercel)                       │
│                                                                             │
│  Dashboard agence            Viewer public (tour/[slug])                     │
│  - CRUD biens                - SplatViewer (R3F) ──── navigation libre       │
│  - upload splat              - Agent IA (chat)                               │
│  - dashboard leads           - Panneau "Vision" (restyle 2D)                 │
│                              - Produits shoppables                           │
│                                    │                                         │
│   API (server only)                ▼                                         │
│   /api/agent   ─────▶ Anthropic (Claude)  : consultation + recos             │
│   /api/restyle ─────▶ fal.ai / Replicate  : restyle 2D de la vue             │
│   /api/leads   ─────▶ Supabase            : insert lead + Resend (email)     │
└───────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
                          Supabase (eu-central-1) : DB + Auth + Storage + RLS
```

---

## 2. Pipeline Splat (capture → rendu)

1. **Capture** : l'agent filme une vidéo simple du bien (guide de tournage à fournir). En Phase 1, **on sous-traite le traitement** à un service (Polycam / Luma / Postshot) → on récupère un fichier splat web-ready.
2. **Stockage** : fichier déposé dans Supabase Storage, lié à un `property` (et optionnellement une `room`). Métadonnées dans la table `captures`.
3. **Rendu** : `SplatViewer` (React Three Fiber) charge le splat et permet la navigation libre dans le navigateur. **Le rendu est 100% côté client → zéro coût GPU serveur** (c'est tout l'intérêt vs Unreal/pixel streaming).
4. **Perf** : c'est le point critique sur mobile. Optimiser la taille (formats compressés type `.spz`/`.sog`, chargement progressif), viser un FPS correct sur smartphone milieu de gamme. **Valider ça avant de construire le reste.**

---

## 3. La boucle Agent IA (le cœur)

L'agent n'est **pas** un sélecteur de styles. C'est un **conseiller qui mène la consultation**. Flux logique d'une session :

1. **Accueil + cadrage** : l'agent se présente, explique qu'il aide à se projeter dans le bien.
2. **Consultation** : il pose des questions ciblées (usage de la pièce, composition du foyer, télétravail, budget, goût chaleureux/épuré, contraintes). Il s'adapte — pas un questionnaire rigide.
3. **Reco raisonnée** : il propose un aménagement **en expliquant le pourquoi** (orientation/lumière, circulation, fonction). C'est la valeur différenciante → le *raisonnement* doit être visible.
4. **Visualisation** : il déclenche un **restyle 2D** de la vue courante (voir §4) pour matérialiser la vision.
5. **Produits** : il associe des produits réels (catalogue local) à sa reco, avec budget.
6. **Itération** : « le canapé est trop grand » → il ajuste reco + visuel.
7. **Conversion** : en fin de session, il propose d'envoyer la « vision » + les coordonnées à l'agence → **création du lead** + résumé de session.

### Implémentation
- `/api/agent` (server only) : appelle Claude avec un **system prompt** qui définit la posture (conseiller, mène, justifie, ne survend pas, reste honnête sur ce qui est une suggestion). Persiste `advisor_sessions` + `session_messages`.
- L'agent peut **structurer ses sorties** (ex. JSON pour : reco, viewpoints à restyler, produits suggérés) pour piloter l'UI. Demander à Claude un format strict et parser proprement.
- Contexte injecté : infos du bien, pièce courante, préférences déjà exprimées dans la session.

---

## 4. Les 3 approches visuelles — ⚠️ LE choix structurant

Le rêve « l'IA change la cuisine en 3D dans le splat à la volée » mélange en réalité **trois approches de difficulté très différentes**. Il faut les distinguer et choisir.

### Approche A — Restyle 2D génératif  ✅ **= Phase 1**
- On capture une **image de la vue courante** du splat → on l'envoie à un modèle image (fal.ai/Replicate, inpainting/img2img conditionné, type ControlNet) → on récupère une **image restylée photoréaliste**.
- Affichée comme **panneau « Vision »** à côté/au-dessus du splat. **Le splat ne change pas.**
- ✅ Faisable maintenant, dans le stack web, « styles infinis ». ⚠️ 2D, cohérence limitée entre vues → c'est pourquoi on l'assume comme « panneau vision », pas comme illusion d'un splat modifié.

### Approche B — Objets 3D placés dans le splat  ⏳ **= Phase 1.5**
- On insère des **meshes meubles (GLTF) pré-modélisés** dans la scène three.js, **composités avec le splat** (mesh + splat coexistent en R3F), placés au bon endroit/échelle.
- ✅ Bien plus tractable que d'éditer le splat (on ajoute de la géométrie, on n'édite pas le nuage de points). Vrai placement spatial, navigable. ⚠️ Catalogue 3D limité, gestion occlusion/échelle/ombres à soigner.

### Approche C — Édition générative du splat lui-même  ❌ **hors scope**
- Modifier/régénérer le nuage de gaussiennes (changer réellement la cuisine *dans* le splat). **Bleeding-edge, recherche.** On n'y touche pas.

> **Décision : A en Phase 1, B en Phase 1.5, C jamais (pour l'instant).** Le `RestyleProvider` abstrait l'approche A pour pouvoir changer de fournisseur image sans tout casser.

---

## 5. Services tiers & rôles

| Service | Rôle | Phase |
|---|---|---|
| Polycam / Luma / Postshot | Traitement vidéo → splat | 1 (manuel) |
| Supabase (eu-central-1) | DB + Auth + Storage + RLS | 1 |
| Anthropic (Claude) | Agent conseil | 1 |
| fal.ai / Replicate | Restyle 2D des vues | 1 |
| Vercel | Hébergement / edge | 1 |
| Resend | Emails (lead → agence) | 1 |
| (Whise ou autre CRM immo) | Sync annonces/leads | 2 |

---

## 6. Multi-tenant & sécurité (résumé, détail dans GTM)

- **RLS Supabase obligatoire** : isolation stricte par `agency_id`. Une agence ne voit jamais les biens/leads d'une autre.
- Les **tours publics** (`published`) sont lisibles sans auth (lecture restreinte aux champs publics, via policy + vue dédiée si besoin).
- L'**insert de lead** se fait par un visiteur anonyme → policy d'insert contrôlée + validation côté serveur (`/api/leads`), jamais d'écriture libre.
- **Service role key** : serveur uniquement. Clés image/Anthropic : serveur uniquement. Rien de sensible en `NEXT_PUBLIC_`.
- **GDPR** : eu-central-1, consentement explicite avant capture de données perso, minimisation, droit à l'effacement. Voir `GTM-VALIDATION.md §sécurité`.

---

## 7. Flux de données (session type)

```
Visiteur ouvre tour/[slug]
   └─▶ charge splat (Storage) + crée advisor_session (anon)
Visiteur parle à l'agent
   └─▶ /api/agent → Claude → reco (JSON) → UI
       └─▶ /api/restyle (vue courante) → image vision
       └─▶ produits associés (table products)
Fin de session : "envoyer à l'agence"
   └─▶ /api/leads → insert lead + résumé session + Resend(email agence)
Agence : dashboard/leads → suit le prospect
```
