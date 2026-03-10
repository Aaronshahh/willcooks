"use server";

import { createClient } from "@/lib/supabase/server";
import { geocodeLocation } from "@/lib/geocode";
import slugify from "slugify";
import { revalidatePath } from "next/cache";

export interface RecipeFormData {
  id?: string;
  title: string;
  city: string;
  country: string;
  video_url: string;
  description: string;
  body: string;
  published: boolean;
  cover_image_path?: string | null;
}

export interface ActionResult {
  success: boolean;
  error?: string;
  geocodeDisplay?: string;
  slug?: string;
}

function generateSlug(title: string): string {
  return slugify(title, { lower: true, strict: true, trim: true });
}

export async function saveRecipe(
  formData: RecipeFormData
): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Not authenticated." };

  const city = formData.city.trim();
  const country = formData.country.trim();

  // Build the combined display name from the explicit city + country fields
  const location_name = [city, country].filter(Boolean).join(", ");

  // Geocode for lat/lng only — country comes directly from the form
  let lat: number | null = null;
  let lng: number | null = null;
  let geocodeDisplay: string | undefined;

  if (location_name) {
    const geo = await geocodeLocation(location_name);
    if (geo) {
      lat = geo.lat;
      lng = geo.lng;
      geocodeDisplay = geo.displayName;
    }
  }

  const slug = generateSlug(formData.title);

  const record = {
    title: formData.title.trim(),
    slug,
    location_name,
    city: city || null,
    country: country || null,
    lat,
    lng,
    video_url: formData.video_url.trim() || null,
    description: formData.description.trim() || null,
    body: formData.body || null,
    published: formData.published,
    cover_image_path: formData.cover_image_path ?? null,
  };

  if (formData.id) {
    // Update
    const { error } = await supabase
      .from("recipes")
      .update(record)
      .eq("id", formData.id);

    if (error) return { success: false, error: error.message };
  } else {
    // Insert – handle duplicate slugs by appending timestamp
    let finalSlug = slug;
    const { data: existing } = await supabase
      .from("recipes")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (existing) {
      finalSlug = `${slug}-${Date.now()}`;
    }

    const { error } = await supabase
      .from("recipes")
      .insert({ ...record, slug: finalSlug });

    if (error) return { success: false, error: error.message };
  }

  revalidatePath("/");
  revalidatePath("/admin/recipes");

  return {
    success: true,
    geocodeDisplay,
    slug: record.slug,
  };
}

export async function uploadCoverImage(
  file: File,
  recipeId: string
): Promise<{ path: string | null; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { path: null, error: "Not authenticated." };

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${recipeId}.${ext}`;

  const { error } = await supabase.storage
    .from("recipe-covers")
    .upload(path, file, { upsert: true, contentType: file.type });

  if (error) return { path: null, error: error.message };

  return { path };
}
