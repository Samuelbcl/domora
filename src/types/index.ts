/**
 * Shared application types (see CLAUDE.md — Conventions).
 * Hand-written for now; can be replaced by Supabase-generated types later.
 */

export type PropertyStatus = "draft" | "published" | "archived";

export type Property = {
  id: string;
  agency_id: string;
  slug: string;
  title: string;
  address: string | null;
  description: string | null;
  status: PropertyStatus;
  created_at: string;
  updated_at: string;
};
