export interface Recipe {
  id: string;
  slug: string;
  title: string;
  location_name: string;
  city: string | null;
  country: string | null;
  lat: number | null;
  lng: number | null;
  video_url: string | null;
  body: string | null;
  cover_image_path: string | null;
  published: boolean;
  created_at: string;
  updated_at: string;
}

/** One pin per dish. Dishes at the same location are spread in a small circle. */
export interface RecipePin {
  id: string;
  slug: string;
  title: string;
  location_name: string;
  country: string | null;
  lat: number;
  lng: number;
  cover_image_path: string | null;
}

/**
 * Converts recipes into individual pins.
 * Multiple dishes at the same location are arranged in a small circle so they
 * don't sit exactly on top of each other.
 */
export function computeRecipePins(recipes: Recipe[]): RecipePin[] {
  // Group by rounded coordinates (~1 km precision)
  const groups = new Map<string, Recipe[]>();
  for (const r of recipes) {
    if (r.lat == null || r.lng == null) continue;
    const key = `${r.lat.toFixed(2)},${r.lng.toFixed(2)}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(r);
  }

  const pins: RecipePin[] = [];
  for (const group of groups.values()) {
    const n = group.length;
    group.forEach((recipe, i) => {
      let lat = recipe.lat!;
      let lng = recipe.lng!;

      if (n > 1) {
        // Spread in a circle ~1.5 km radius — invisible at world zoom, clear at city zoom
        const radius = 0.013;
        const angle = -Math.PI / 2 + (2 * Math.PI / n) * i;
        lat += radius * Math.sin(angle);
        lng += radius * Math.cos(angle);
      }

      pins.push({
        id: recipe.id,
        slug: recipe.slug,
        title: recipe.title,
        location_name: recipe.location_name,
        country: recipe.country ?? null,
        lat,
        lng,
        cover_image_path: recipe.cover_image_path,
      });
    });
  }

  return pins;
}

/** @deprecated Use RecipePin / computeRecipePins instead. */
export interface LocationPin {
  lat: number;
  lng: number;
  location_name: string;
  country: string | null;
  recipes: Pick<Recipe, "id" | "slug" | "title" | "cover_image_path">[];
}

export type VideoType = "youtube" | "tiktok" | null;

export interface VideoEmbed {
  type: VideoType;
  id: string;
}

/** Detects platform and extracts the video ID from a URL. */
export function detectVideo(url: string): VideoEmbed | null {
  if (!url) return null;

  // YouTube: youtube.com/watch?v=ID  |  youtu.be/ID  |  youtube.com/shorts/ID
  const ytMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  if (ytMatch) return { type: "youtube", id: ytMatch[1] };

  // TikTok: tiktok.com/@user/video/ID
  const ttMatch = url.match(/tiktok\.com\/@[^/]+\/video\/(\d+)/);
  if (ttMatch) return { type: "tiktok", id: ttMatch[1] };

  return null;
}

/** Legacy helper kept for backwards compat. */
export function extractYoutubeId(url: string): string | null {
  const v = detectVideo(url);
  return v?.type === "youtube" ? v.id : null;
}

/** Returns the public URL for a cover image from Supabase Storage. */
export function getCoverImageUrl(
  supabaseUrl: string,
  path: string | null
): string | null {
  if (!path) return null;
  const base = supabaseUrl.replace(/\/$/, ""); // strip accidental trailing slash
  return `${base}/storage/v1/object/public/recipe-covers/${path}`;
}
