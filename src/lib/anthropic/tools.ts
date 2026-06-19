import type Anthropic from "@anthropic-ai/sdk";

/**
 * Advisor tool definitions (see docs/AGENT.md §2).
 * The app executes each tool server-side and returns a tool_result.
 */
export const advisorTools: Anthropic.Tool[] = [
  {
    name: "update_preferences",
    description:
      "Enregistre ou met à jour ce que tu as appris sur le visiteur et son projet d'aménagement. Appelle-le dès que tu obtiens une info utile (foyer, usage, budget, goûts, contraintes). Silencieux pour le visiteur.",
    input_schema: {
      type: "object",
      properties: {
        room: { type: "string", description: "Pièce concernée (ex. salon, cuisine)" },
        household: {
          type: "string",
          description: "Composition du foyer (ex. couple + 2 enfants)",
        },
        usage: { type: "string", description: "Usage prévu de la pièce" },
        budget: {
          type: "string",
          description: "Budget approximatif exprimé par le visiteur",
        },
        style: {
          type: "string",
          description: "Goûts esthétiques (chaleureux, épuré, coloré...)",
        },
        constraints: {
          type: "string",
          description: "Contraintes (animaux, accessibilité, meuble à garder...)",
        },
        notes: { type: "string", description: "Autre info utile" },
      },
    },
  },
  {
    name: "generate_vision",
    description:
      "Demande une projection visuelle 2D de la vue actuelle de la pièce, restylée selon ta proposition d'aménagement. L'application capture la vue courante du splat et génère l'image. Renvoie une URL d'image que tu présentes comme une suggestion illustrative.",
    input_schema: {
      type: "object",
      properties: {
        room: { type: "string", description: "Pièce visualisée" },
        style_brief: {
          type: "string",
          description:
            "Description précise de l'aménagement à visualiser : mobilier, matériaux, couleurs, ambiance lumineuse. Plus c'est précis, meilleur est le rendu.",
        },
      },
      required: ["style_brief"],
    },
  },
  {
    name: "suggest_products",
    description:
      "Recherche dans le catalogue des produits RÉELS correspondant à ta reco. N'invente jamais de produits : présente uniquement ce que cet outil renvoie. Si la liste est vide, dis-le honnêtement.",
    input_schema: {
      type: "object",
      properties: {
        category: {
          type: "string",
          description: "Type de produit (canapé, table, luminaire, tapis...)",
        },
        style: { type: "string", description: "Style recherché" },
        max_price_eur: {
          type: "number",
          description: "Budget max par pièce, en euros",
        },
      },
      required: ["category"],
    },
  },
  {
    name: "offer_lead_capture",
    description:
      "Ouvre le formulaire (avec consentement RGPD) permettant au visiteur d'envoyer sa vision et ses coordonnées à l'agence. Appelle-le quand le visiteur est intéressé. Ne demande JAMAIS toi-même de coordonnées dans le chat.",
    input_schema: {
      type: "object",
      properties: {
        summary: {
          type: "string",
          description:
            "Court résumé de la vision et des préférences du visiteur, pour pré-remplir le message envoyé à l'agence.",
        },
      },
      required: ["summary"],
    },
  },
];
