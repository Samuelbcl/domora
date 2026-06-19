# CLAUDE.md — Domora

Master prompt pour Claude Code. Lis ce fichier en premier, puis `docs/ARCHITECTURE.md` et `supabase/schema.sql`. **Ne sur-scope pas** : on construit la Phase 1 du `docs/BRIEF.md`, rien d'autre.

---

## Contexte (résumé)

Domora = SaaS B2B pour **agences immobilières wallonnes**. On augmente leurs annonces de biens **existants** avec :
1. une **visite 3D navigable** (Gaussian Splatting, rendu web),
2. un **agent IA conseil en aménagement** (Claude API) qui mène une consultation et propose des recos raisonnées,
3. une **boucle « vision »** = restyle 2D génératif des vues + produits shoppables locaux,
4. une **capture de leads** documentée pour l'agence.

Détail complet : `docs/BRIEF.md`. Détail technique : `docs/ARCHITECTURE.md`.

---

## Stack (imposé)

- **Framework** : Next.js 15 (App Router) + TypeScript (strict).
- **UI** : Tailwind CSS + shadcn/ui. Mobile-first (l'acheteur est sur téléphone).
- **3D web** : `@react-three/fiber` + `@react-three/drei` + renderer Gaussian Splatting (voir ARCHITECTURE — Spark / lib gsplat). Postprocessing seulement si nécessaire.
- **DB / Auth / Storage** : Supabase (région **eu-central-1**, GDPR). RLS multi-tenant **obligatoire**.
- **Agent IA** : Anthropic API (Claude). Modèle au choix dans une variable d'env, jamais hardcodé.
- **Restyle image** : fal.ai **ou** Replicate (abstraire derrière une interface `RestyleProvider` pour pouvoir switcher).
- **Hébergement** : Vercel. **Emails** : Resend.
- **Capture splat** : service externe au début (Polycam / Luma / Postshot). L'app ne fait que **stocker + rendre** le fichier splat.

> Ne pas introduire d'autre lib lourde sans raison. Pas de state manager externe tant que React state/Context suffit.

---

## Conventions

- TypeScript strict, pas de `any` non justifié. Types partagés dans `src/types`.
- Server Components par défaut ; Client Components seulement pour l'interactif (viewer 3D, chat agent).
- Accès DB via le client Supabase ; **jamais** de requête qui bypasse la RLS depuis le front. Service role key **uniquement** côté serveur (route handlers / server actions).
- Variables d'env validées au boot (zod). Aucune clé secrète exposée au client (`NEXT_PUBLIC_` réservé au non-sensible).
- Commits clairs, petits. Un milestone = une PR mentale.
- Français pour le contenu produit / prompts agent ; anglais pour le code (identifiants, commentaires techniques).

---

## Arborescence cible

```
src/
  app/
    (marketing)/              # landing publique
    (dashboard)/              # espace agence (auth)
      properties/             # CRUD biens
      properties/[id]/        # édition bien + captures + statut
      leads/                  # dashboard leads
    tour/[slug]/              # viewer public d'une annonce augmentée (no auth)
    api/
      agent/route.ts          # endpoint agent IA (Claude) — server only
      restyle/route.ts        # endpoint restyle image — server only
      leads/route.ts          # capture lead (insert anon)
  components/
    viewer/                   # SplatViewer (R3F), contrôles navigation
    advisor/                  # UI chat agent + panneau "vision"
    products/                 # carte produit shoppable
    dashboard/                # tables, forms (shadcn)
    ui/                       # shadcn
  lib/
    supabase/                 # clients (browser/server), helpers
    anthropic/                # wrapper agent + system prompt + outils
    restyle/                  # RestyleProvider (fal | replicate)
    env.ts                    # validation env (zod)
  types/
supabase/
  schema.sql                  # = SCHEMA.sql de ce dossier
```

---

## Plan de build (ordre strict)

1. **Setup** : Next 15 + TS strict + Tailwind + shadcn + Supabase clients + `env.ts` (zod). Appliquer `supabase/schema.sql` sur le projet Supabase. Seed minimal (1 agence démo, 1 bien démo).
2. **Auth agence + dashboard squelette** : login Supabase, layout dashboard, garde RLS vérifiée.
3. **CRUD biens** : créer/éditer un bien, statuts (`draft` / `published`), génération du `slug` public.
4. **Upload & rendu splat** : stocker un fichier splat (Storage), `SplatViewer` R3F qui le charge et permet de naviguer. **Valider la perf mobile ici** (taille fichier, FPS) avant d'aller plus loin.
5. **Viewer public** `tour/[slug]` : rendu du splat d'un bien publié, sans auth, embeddable (iframe-friendly).
6. **Agent IA conseil** : endpoint `api/agent` (Claude), system prompt + outils complets dans `docs/AGENT.md` (posture « conseiller qui mène la consultation »). UI chat dans le viewer. Persistance session + messages.
7. **Boucle vision (restyle 2D)** : sur reco de l'agent, capturer la vue courante → `api/restyle` → afficher le rendu restylé en panneau « vision ». Conditionner le restyle sur l'image de la vue.
8. **Produits shoppables** : catalogue (table `products`), l'agent associe des produits à ses recos, affichage cartes + lien sortant. Curation manuelle au début.
9. **Capture lead** : formulaire léger déclenché en fin de session (ou sur action « envoyer ma vision à l'agence »), insert anon via `api/leads`, résumé de session généré par l'agent, email à l'agence (Resend), affichage dans dashboard `leads`.
10. **Polish** : empty states, loading, erreurs, responsive, consentement GDPR (bannière + opt-in lead).

> Après chaque étape : ça compile, ça tourne, c'est testable manuellement. Pas d'étape 7 si l'étape 4 (perf splat mobile) n'est pas validée.

---

## Definition of Done — Phase 1

- Une agence peut créer un bien, y attacher un splat, le publier → URL publique navigable sur mobile.
- Un visiteur peut se balader, discuter avec l'agent, obtenir des recos raisonnées + un restyle 2D + des produits.
- Le visiteur peut laisser ses coordonnées → l'agence reçoit un lead documenté (email + dashboard).
- RLS étanche entre agences. Consentement GDPR en place. Aucune clé secrète côté client.

---

## Garde-fous (rappel)

- ❌ **Pas** d'édition du splat lui-même. Le « change la cuisine » v1 = restyle 2D en panneau séparé.
- ❌ Pas d'objets 3D dans le splat en Phase 1 (c'est Phase 1.5).
- ❌ Pas de système retailers/commission en Phase 1 (juste catalogue curé + liens).
- ❌ Pas de promoteurs / configurateur neuf.
- ✅ Si un choix te bloque, privilégie **shipper la boucle complète en mince** plutôt que perfectionner un maillon.
