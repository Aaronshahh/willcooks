import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { notFound } from "next/navigation";
import RecipeForm from "@/components/RecipeForm";
import type { Recipe } from "@/lib/recipes";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditRecipePage({ params }: Props) {
  const { id } = await params;
  await requireAuth();

  const supabase = await createClient();

  const { data: recipe } = await supabase
    .from("recipes")
    .select("*")
    .eq("id", id)
    .single();

  if (!recipe) notFound();

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1
          className="text-2xl font-bold"
          style={{ color: "#f5f0e8", fontFamily: "Georgia, serif" }}
        >
          Edit Recipe
        </h1>
        <p className="text-sm mt-1" style={{ color: "#888" }}>
          Update the details below. The map pin will update automatically.
        </p>
      </div>
      <RecipeForm recipe={recipe as Recipe} />
    </div>
  );
}
