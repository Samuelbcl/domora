/**
 * Slug helpers for public property URLs (/tour/[slug]).
 */

/** Turn a free-text title into a URL-safe base slug. */
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "") // strip accents (Liège -> liege)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-") // non-alphanumerics -> dash
    .replace(/^-+|-+$/g, "") // trim leading/trailing dashes
    .slice(0, 60);
}

/**
 * Build a unique public slug from a title by appending a short random suffix.
 * The randomness makes a collision on the `properties.slug` unique constraint
 * practically impossible without a DB round-trip.
 */
export function buildUniqueSlug(title: string): string {
  const base = slugify(title) || "bien";
  const suffix = crypto.randomUUID().replace(/-/g, "").slice(0, 6);
  return `${base}-${suffix}`;
}
