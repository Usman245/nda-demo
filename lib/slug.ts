import { customAlphabet } from "nanoid";

const suffix = customAlphabet("abcdefghjkmnpqrstuvwxyz23456789", 5);

export function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

/** Slug from title + outcode, with a random suffix so it is unguessable and unique. */
export function makeDealSlug(title: string, outcode: string) {
  const base = slugify(`${title} ${outcode}`) || "deal";
  return `${base}-${suffix()}`;
}
