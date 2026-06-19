# Domora — Dossier projet

SaaS B2B pour **agences immobilières wallonnes** : visite 3D navigable (Gaussian Splatting) + **agent IA conseil en aménagement** + capture de leads chauds.

## Structure

```
domora/
├── README.md                  ← tu es ici
├── CLAUDE.md                  ← master prompt Claude Code (à lire en premier)
├── docs/
│   ├── BRIEF.md               ← vision, segment, différenciation, business model
│   ├── ARCHITECTURE.md        ← pipeline splat, boucle agent IA, les 3 approches visuelles
│   ├── AGENT.md               ← system prompt + outils du conseiller IA (étape 6)
│   └── GTM-VALIDATION.md      ← validation (interviews agences), pricing, GDPR, go-to-market
└── supabase/
    └── schema.sql             ← schéma Postgres + RLS multi-tenant
```

## Démarrer

1. Mets le contenu de ce dossier à la racine de ton repo Next.js.
2. Dans Claude Code : « **Lis CLAUDE.md et attaque l'étape 1 du plan de build.** »
3. Applique `supabase/schema.sql` sur ton projet Supabase (eu-central-1).
4. **En parallèle** : cale 2-3 interviews d'agences liégeoises (les 9 questions sont dans `docs/GTM-VALIDATION.md`). Valide avant de scaler.

## Garde-fou principal

On construit la **Phase 1** : visite splat + agent conseil + restyle 2D + leads. **Pas** d'édition 3D du splat (bleeding-edge). Détail dans `docs/ARCHITECTURE.md §4`.

---
*« Domora » = nom de travail, à valider (dispo domaine + marque).*
