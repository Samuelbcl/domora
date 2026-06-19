# BRIEF — Domora

> **Nom de travail : Domora.** Placeholder à valider (dispo domaine + marque BE/EU).
> Alternatives à arbitrer : **Stagia**, **Aménia**, **Habio**, **Casavia**.

---

## 1. One-liner

**Domora transforme chaque annonce d'une agence immobilière en une visite 3D photoréaliste navigable, avec un agent IA qui conseille le prospect comme un architecte d'intérieur — et qui le convertit en lead chaud.**

Ce n'est pas un outil de déco. C'est un **outil de vente pour l'agence**, déguisé en expérience pour l'acheteur.

---

## 2. Le problème

Aujourd'hui, pour montrer un bien en ligne, une agence a trois options : photos plates, panorama 360°, ou Matterport. Les trois partagent le même défaut : le prospect **regarde** un espace, il ne s'y **projette** pas. Or en immobilier, ce qui déclenche l'achat ou la location, c'est la **projection émotionnelle** — « je me vois vivre ici ».

En parallèle, les outils de déco IA (Paintit, ReimagineHome, MeltFlex, Decor8…) explosent, mais ils travaillent sur des **photos plates**, déconnectées du bien réel et de l'agence. Personne ne fait le pont entre « la visite du vrai bien » et « l'aide à se projeter dedans ».

**Le trou dans le marché = la fusion.** Espace réel navigable + agent qui conseille vraiment + intégré dans le flux de vente de l'agence.

---

## 3. Segment

**Cible primaire : agences immobilières wallonnes / belges** (revente et location de biens **existants**).

> Décision stratégique assumée : on **ne** cible **pas** les promoteurs / le neuf sur plan. Le neuf, c'est le territoire d'Unreal Engine + pixel streaming (lourd, cher, configurateurs). Nous, on joue le **bien existant** → capture photoréaliste au téléphone (Gaussian Splatting), zéro coût GPU cloud, dans le stack web. La techno suit le segment.

Clientèle adjacente (sources de revenus / partenaires secondaires) :
- **Retailers meuble & cuisine wallons/belges** (leads ultra-qualifiés : quelqu'un qui visualise déjà un canapé dans son futur salon).
- À terme : photographes immo, home stagers, syndics.

L'acheteur/locataire final est **l'utilisateur**, pas le client payant.

---

## 4. La vision produit

Un prospect ouvre une annonce de l'agence sur son téléphone. Au lieu de scroller des photos, il **se balade dans le vrai salon** (splat). Il engage l'agent IA et lui parle comme à un conseiller :

> « J'ai deux gosses et je bosse de la maison, vous feriez quoi de cette pièce ? »

L'agent **mène la consultation** (il pose les bonnes questions : usage, budget, goût, contraintes), puis **propose une vision cohérente en expliquant le pourquoi** (« la lumière vient de l'est, je mettrais le bureau ici, un canapé modulable costaud là, palette chaude car peu de soleil l'aprèm »). Il **montre le rendu**, et chaque pièce proposée est **dispo chez un magasin près de chez le prospect**.

Pendant ce temps, l'agence reçoit un **lead chaud documenté** : qui a engagé, sur quel bien, ses préférences, ses coordonnées, un résumé de session exploitable pour le rappel.

---

## 5. La différenciation (le cœur du projet)

| | Outils déco IA (Paintit, Reimagine…) | Splat tours (SplatLabs, SplatTour…) | **Domora** |
|---|---|---|---|
| Espace réel navigable | ❌ photo plate | ✅ | ✅ |
| Agent qui **conseille** (mène, raisonne, justifie) | ⚠️ prompt → image | ❌ passif | ✅ **consultation menée** |
| Lié à la **transaction immo** | ❌ générique | ⚠️ juste la visite | ✅ intégré annonce + lead |
| **Ancrage local** (retailers BE) | ❌ Amazon US | ❌ | ✅ Wallonie |
| Capture lead pour l'agence | ❌ | ⚠️ basique | ✅ **cœur du produit** |

> **Le wedge n'est PAS la techno.** Le splat se commoditise (Zillow l'a déjà shippé). Le wedge, c'est **la posture de l'agent (conseiller, pas sélecteur de styles) dans le vrai espace, branché sur la vente de l'agence et le commerce meuble local.**

C'est exactement notre force : on est un studio **AI-first + web**, pas un studio 3D qui bolt-on une IA. La plupart des concurrents font l'inverse.

---

## 6. Proposition de valeur

**Pour l'agence (qui paye) :**
- Annonces différenciées → plus de clics, plus de visites physiques qualifiées.
- **Leads chauds & documentés** : un prospect qui passe 15 min à meubler son futur salon est le meilleur signal d'intention qui existe.
- Image moderne / premium auprès des vendeurs (argument pour décrocher des mandats).

**Pour l'acheteur/locataire (l'utilisateur) :**
- Se projeter pour de vrai dans le bien.
- Un conseil d'aménagement gratuit, personnalisé, dans l'espace réel.

**Pour les retailers (revenu secondaire) :**
- Leads d'achat meuble ultra-qualifiés, contextualisés.

---

## 7. Modèle économique

**Principal : SaaS B2B agence.**
- Hypothèse : abonnement par agence avec quota d'annonces actives (ex. plans Starter / Pro / agence multi-bureaux), OU à la carte par annonce « augmentée ».
- À valider en interview (voir `GTM-VALIDATION.md`).

**Secondaire (phase 2+) : commission / lead-gen retailers meuble.**
- Le produit devient une plateforme à deux faces : l'agence amène l'audience qualifiée, le retailer paye le lead.

> Ne pas construire les deux faces en même temps. **Face 1 = agence. Point.** Les retailers viennent quand on a du trafic à monétiser.

---

## 8. Scope — MVP & phasing

**⚠️ Garde-fou anti-sur-scope (le piège principal de ce projet).** Le rêve « l'IA édite la cuisine en vraie 3D dans le splat à la volée » est **bleeding-edge** (éditer un nuage de points = très dur). On ne le construit PAS en v1.

### Phase 1 — MVP (ce qu'on ship)
- Dashboard agence : créer un bien, uploader/lier un splat (capture sous-traitée au début : agent filme, on process via Polycam/Luma/Postshot).
- **Viewer splat web navigable** (Next.js + R3F + renderer splat), mobile-friendly, embeddable.
- **Agent IA conseil** (Claude API) : consultation menée, recos raisonnées.
- **Boucle « vision » = restyle 2D génératif** des vues clés (fal.ai/Replicate ou API interior-AI) déclenché par les recos de l'agent. *Le splat ne change pas ; le restyle est un panneau « vision » séparé.* (voir `ARCHITECTURE.md`)
- **Produits shoppables** : catalogue curé manuellement au début (retailers wallons / liens affiliés).
- **Capture & dashboard de leads** : sessions, préférences, coordonnées, résumé exploitable.

### Phase 1.5 — Objets 3D dans le splat
- Insérer des **meshes meubles (GLTF) pré-modélisés** dans la scène splat (compositing mesh + splat en three.js — bien plus tractable que d'éditer le splat). Catalogue 3D limité mais « vrai » placement dans l'espace.

### Phase 2+
- Pipeline de capture self-serve, intégrations retailers profondes, CRM immo (ex. **Whise**), white-label par agence, mesures dimensionnelles.

### Hors scope (pour l'instant)
- Édition générative du splat lui-même. Promoteurs/neuf. App mobile native (web d'abord).

---

## 9. Paysage concurrentiel (lucide)

- **Déco IA 2D** (Paintit, ReimagineHome, MeltFlex, Decor8, RoomGPT) : matures, financés, mais **2D photo only**, génériques, pas immo-transaction, pas local.
- **Splat / virtual tours** (SplatLabs, SplatTour, 3DVista, Zillow SkyTours) : la techno se commoditise, mais **passifs** (regarder, pas conseiller).
- **Configurateurs Unreal** (ZHA, AEDAS…) : neuf/promoteurs, lourds, pas notre terrain.

→ Notre case vide = **l'intersection des trois**, sur le segment agence/existant, avec ancrage belge.

**Risque concurrentiel réel :** un acteur 2D ajoute le splat + la transaction avant nous. Notre défense = vitesse + focus local + qualité de l'agent conversationnel (notre vrai savoir-faire).

---

## 10. Risques & inconnues

| Risque | Mitigation |
|---|---|
| Les agences ne veulent pas payer | **Valider AVANT de scaler** (interviews + pilote 1-2 agences). Voir GTM. |
| Cohérence du restyle 2D entre les vues | Restyle = panneau « vision » assumé, pas illusion de splat modifié. Conditionner sur la vue (ControlNet/inpainting). |
| Qualité/coût de la capture splat | Sous-traiter au début ; guide de tournage ; viser turnaround < 1 semaine. |
| GDPR (données visiteurs/leads, EU) | Hébergement eu-central-1, consentement explicite, RLS, minimisation. Voir GTM §sécurité. |
| Sourcing catalogue meuble local | Démarrer petit (un partenaire), curation manuelle. |

---

## 11. North Star & métriques

- **North Star : nombre de leads chauds générés / mois pour les agences clientes.** C'est ce qui prouve la valeur et justifie le prix.
- Secondaires : taux d'engagement avec l'agent par visite, durée de session, taux annonce→visite physique, NPS agence.
- Validation (pré-revenu) : nombre d'agences disant « je payerais X€ pour ça » en interview (voir GTM).
