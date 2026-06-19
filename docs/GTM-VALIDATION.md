# GTM & VALIDATION — Domora

L'erreur à ne pas faire : coder 2 mois puis chercher des clients. **On valide en parallèle du build.** Ce fichier = le plan business + la sécurité.

---

## 1. Pitch (à affiner)

**Une phrase :** « Domora transforme vos annonces en visites 3D où un conseiller IA aide chaque prospect à se projeter — et vous renvoie des leads chauds. »

**Le hook agence :** vos prospects ne regardent plus des photos, ils *meublent leur futur salon*. Celui qui passe 15 min à ça, c'est votre meilleur acheteur — et vous récupérez son contact + ses préférences.

---

## 2. Cible précise

- **Agences immobilières wallonnes** (Liège d'abord — terrain connu), revente + location de biens existants.
- Profils prioritaires : agences indépendantes ou petits réseaux, modernes, qui se battent sur la différenciation des mandats. Le décideur = gérant / responsable marketing.
- Pourquoi elles : budget marketing existant, douleur réelle (décrocher des mandats vendeurs + convertir des prospects), cycle de décision court vs un grand réseau.

---

## 3. Plan de validation (AVANT de scaler le code)

**Objectif : 8–10 interviews d'agences avant d'avoir fini la Phase 1.** Même logique que tes interviews d'agents pour « mode bulles ».

### Les questions (ne pas pitcher, écouter)
1. Comment montrez-vous un bien en ligne aujourd'hui ? (photos / 360 / Matterport ?)
2. Qu'est-ce qui marche / vous frustre là-dedans ?
3. Combien vous coûte une mise en valeur d'annonce aujourd'hui (photo pro, vidéo, Matterport) ?
4. Comment qualifiez-vous un prospect web ? Qu'est-ce qui fait un « bon » lead pour vous ?
5. Sur 100 visiteurs d'une annonce, combien vous laissent leurs coordonnées ? Ça vous suffit ?
6. Le vendeur (propriétaire), qu'est-ce qui le convainc de vous confier le mandat ?
7. *(montrer un mock/démo)* Si un prospect pouvait se balader dans le bien et un conseiller IA l'aidait à se projeter, ça change quoi pour vous ?
8. **Combien payeriez-vous pour ça ? Par annonce ? Par mois ?** (laisser le silence)
9. Qu'est-ce qui vous empêcherait de l'utiliser demain ?

### Critère de GO
- ≥ 3 agences disent spontanément « je payerais » avec un chiffre concret.
- Au moins 1 accepte un **pilote** (1-2 biens, gratuit ou prix cassé) → étude de cas.

> Si personne ne met de chiffre, on a appris un truc essentiel **avant** d'avoir codé 2 mois.

---

## 4. Pricing (hypothèses à tester)

Pistes à confronter aux interviews (ne pas figer trop tôt) :

| Modèle | Idée | Pour qui |
|---|---|---|
| **Par annonce augmentée** | X€/bien (one-shot ou tant qu'actif) | agences à faible volume |
| **Abonnement agence** | Starter / Pro / Multi-bureaux, quota de biens actifs | agences régulières |
| **Freemium** | 1-2 biens gratuits, payant au-delà | acquisition |

Coûts variables à couvrir dans le prix : traitement splat (phase 1 sous-traité), appels Claude, appels restyle image, hébergement. **Calculer le coût par session** tôt pour ne pas vendre à perte.

---

## 5. Le côté two-sided (phase 2, pas avant)

Quand il y aura du trafic qualifié : monétiser les **leads meuble** auprès de retailers wallons/belges (commission ou lead-gen). L'agence amène l'audience, le retailer paye le prospect.

> **Ne pas construire les deux faces en même temps.** Face 1 = agence. Les retailers, c'est une fois qu'on a des sessions à monétiser. Démarrer côté catalogue avec **un** partenaire / liens affiliés simples.

---

## 6. Go-to-market (séquence)

1. **Pilote** : 1-2 agences à Liège, on augmente 2-3 biens réels, gratuit/cassé.
2. **Étude de cas** : mesurer engagement + leads générés vs annonces classiques. Chiffres = arme commerciale.
3. **Prospection ciblée** : agences wallonnes similaires, démo = l'étude de cas. (Réutiliser ton savoir-faire prospection notaires/huissiers.)
4. **Contenu LinkedIn** : montrer des sessions réelles (avec accord), le « avant/après projection ». Ton angle indie + local.
5. **Scale** : packaging self-serve, puis intégration CRM immo (Whise) pour réduire la friction d'onboarding.

---

## 7. Sécurité & GDPR (non négociable, EU)

On manipule des **données personnelles de visiteurs** (coordonnées, préférences, conversations). Belgique/UE → cadre strict.

- **Hébergement** : Supabase **eu-central-1** (données dans l'UE). Vercel : vérifier régions/edge pour ne pas sortir les données perso de l'UE.
- **Consentement explicite** avant toute capture de données perso (bannière + opt-in clair sur le formulaire lead, `consent = true` stocké). Pas de pré-coché.
- **Minimisation** : ne collecter que le nécessaire (nom, contact, préférences). Pas de tracking superflu.
- **Finalité claire** : les données du prospect servent l'agence à le recontacter — le dire explicitement.
- **Droit à l'effacement / accès** : prévoir la suppression d'un lead/session sur demande.
- **RLS étanche** : une agence ne voit jamais les données d'une autre (cf. `SCHEMA.sql`).
- **Secrets** : service_role key, clés Anthropic/restyle = **serveur uniquement**. Rien en `NEXT_PUBLIC_`.
- **Sous-traitants** : Anthropic, fal/Replicate, service splat = sous-traitants au sens RGPD → vérifier leurs garanties (DPA), et **ne pas leur envoyer de données perso visiteur** dans les prompts/images au-delà du nécessaire (les images de pièces vides ne sont pas des données perso ; attention si des personnes/objets identifiants apparaissent).
- **Mentions** : politique de confidentialité + base légale (intérêt légitime / consentement selon le cas).

> Faire un fichier `SECURITE.md` dédié si on va en prod, comme pour Tabellio.

---

## 8. Ce qui prouve qu'on continue (jalons)

- **Validation** : ≥3 agences avec un prix concret + 1 pilote signé.
- **Produit** : la boucle complète (visite → conseil → vision → lead) tourne sur mobile, perf splat OK.
- **Traction** : le pilote génère des leads que l'agence juge utiles (le North Star du BRIEF).

Si ces trois s'allument → on pousse. Sinon, on pivote le maillon qui coince, pas tout le projet.
