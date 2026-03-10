import { createClient } from "@/lib/supabase/server";
import { computeRecipePins, type Recipe } from "@/lib/recipes";
import WorldMap from "@/components/WorldMap";

export const revalidate = 60;

export default async function Home() {
  const supabase = await createClient();

  const { data: recipes } = await supabase
    .from("recipes")
    .select("id, slug, title, location_name, city, country, lat, lng, description, cover_image_path, published")
    .eq("published", true)
    .order("created_at", { ascending: false });

  const pins = computeRecipePins((recipes as Recipe[]) ?? []);

  return <WorldMap pins={pins} />;
}
