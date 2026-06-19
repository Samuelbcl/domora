import { NextResponse } from "next/server";
import { z } from "zod";
import type Anthropic from "@anthropic-ai/sdk";

import { env } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildSystemPrompt } from "@/lib/anthropic/system-prompt";
import { runAdvisor } from "@/lib/anthropic/agent";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  propertyId: z.uuid(),
  sessionId: z.uuid().nullish(), // first turn sends null
  message: z.string().trim().min(1).max(4000),
});

export async function POST(req: Request) {
  if (!env.ANTHROPIC_API_KEY || !env.ANTHROPIC_MODEL) {
    return NextResponse.json(
      { error: "Le conseiller IA n'est pas encore configuré." },
      { status: 503 },
    );
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }
  const { propertyId, sessionId, message } = parsed.data;

  const admin = createAdminClient();

  // The advisor only runs on published tours.
  const { data: property } = await admin
    .from("properties")
    .select("id, title, address, agency_id, status, agencies(name)")
    .eq("id", propertyId)
    .eq("status", "published")
    .maybeSingle();

  if (!property) {
    return NextResponse.json({ error: "Bien introuvable." }, { status: 404 });
  }

  const agency = Array.isArray(property.agencies)
    ? property.agencies[0]
    : property.agencies;

  // Load or create the advisor session (visitor is anonymous).
  let session: { id: string; preferences: Record<string, unknown> } | null = null;
  if (sessionId) {
    const { data } = await admin
      .from("advisor_sessions")
      .select("id, preferences")
      .eq("id", sessionId)
      .eq("property_id", propertyId)
      .maybeSingle();
    if (data) session = { id: data.id, preferences: data.preferences ?? {} };
  }
  if (!session) {
    const { data, error } = await admin
      .from("advisor_sessions")
      .insert({
        property_id: property.id,
        agency_id: property.agency_id,
        preferences: {},
      })
      .select("id, preferences")
      .single();
    if (error || !data) {
      return NextResponse.json(
        { error: "Impossible de démarrer la session." },
        { status: 500 },
      );
    }
    session = { id: data.id, preferences: data.preferences ?? {} };
  }

  const activeSession = session; // non-null, stable across the async tool loop

  // Build the Claude message history from stored visible turns.
  const { data: history } = await admin
    .from("session_messages")
    .select("role, content")
    .eq("session_id", activeSession.id)
    .order("created_at", { ascending: true });

  const messages: Anthropic.MessageParam[] = (history ?? [])
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));
  messages.push({ role: "user", content: message });

  // Persist the visitor message.
  await admin.from("session_messages").insert({
    session_id: activeSession.id,
    role: "user",
    content: message,
  });

  // Mutable preferences + UI signals collected during the tool loop.
  let preferences = { ...activeSession.preferences };
  let leadForm: { summary: string } | null = null;

  const system = buildSystemPrompt({
    agencyName: agency?.name ?? "votre agence",
    propertyTitle: property.title,
    propertyAddress: property.address,
    roomLabel: null,
    preferences,
  });

  const reply = await runAdvisor({
    system,
    messages,
    executeTool: async (name, input) => {
      switch (name) {
        case "update_preferences": {
          preferences = { ...preferences, ...input };
          await admin
            .from("advisor_sessions")
            .update({ preferences })
            .eq("id", activeSession.id);
          return "Préférences enregistrées.";
        }
        case "suggest_products": {
          const category = String(input.category ?? "");
          const maxPrice =
            typeof input.max_price_eur === "number" ? input.max_price_eur : null;
          let query = admin
            .from("products")
            .select("name, category, retailer, price_eur, product_url")
            .or(`agency_id.is.null,agency_id.eq.${property.agency_id}`)
            .limit(6);
          if (category) query = query.ilike("category", `%${category}%`);
          if (maxPrice != null) query = query.lte("price_eur", maxPrice);
          const { data: products } = await query;
          return JSON.stringify(products ?? []);
        }
        case "generate_vision": {
          // Restyle 2D is built in step 7 — acknowledge gracefully for now.
          return "La projection visuelle n'est pas encore disponible (fonctionnalité à venir). Décris plutôt ta proposition avec des mots.";
        }
        case "offer_lead_capture": {
          leadForm = { summary: String(input.summary ?? "") };
          return "Le formulaire de contact a été proposé au visiteur.";
        }
        default:
          return "Outil inconnu.";
      }
    },
  });

  // Persist the assistant reply.
  await admin.from("session_messages").insert({
    session_id: activeSession.id,
    role: "assistant",
    content: reply,
  });

  return NextResponse.json({
    sessionId: activeSession.id,
    reply,
    leadForm,
  });
}
