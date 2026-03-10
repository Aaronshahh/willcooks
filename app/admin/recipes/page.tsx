import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import Link from "next/link";
import type { Recipe } from "@/lib/recipes";
import DeleteRecipeButton from "@/components/DeleteRecipeButton";

export default async function AdminRecipesPage() {
  await requireAuth();

  const supabase = await createClient();
  const { data: recipes } = await supabase
    .from("recipes")
    .select("id, slug, title, location_name, published, created_at, updated_at")
    .order("created_at", { ascending: false });

  const list = (recipes as Recipe[]) ?? [];

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ color: "#f5f0e8", fontFamily: "Georgia, serif" }}
          >
            Your Recipes
          </h1>
          <p className="text-sm mt-1" style={{ color: "#888" }}>
            {list.length} recipe{list.length !== 1 ? "s" : ""} total
          </p>
        </div>
        <Link
          href="/admin/recipes/new"
          className="px-4 py-2 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80"
          style={{ background: "#e8a838", color: "#0f0f0f" }}
        >
          + New Recipe
        </Link>
      </div>

      {list.length === 0 ? (
        <div
          className="text-center py-20 rounded-2xl"
          style={{ background: "#1a1a1a", border: "1px solid #2e2e2e" }}
        >
          <p className="text-4xl mb-4">🍽️</p>
          <p className="font-medium mb-2" style={{ color: "#f5f0e8" }}>
            No recipes yet
          </p>
          <p className="text-sm mb-6" style={{ color: "#888" }}>
            Add your first recipe and it will appear on the world map.
          </p>
          <Link
            href="/admin/recipes/new"
            className="inline-block px-5 py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: "#e8a838", color: "#0f0f0f" }}
          >
            Add first recipe
          </Link>
        </div>
      ) : (
        <div
          className="rounded-2xl overflow-hidden"
          style={{ border: "1px solid #2e2e2e" }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "#1a1a1a", borderBottom: "1px solid #2e2e2e" }}>
                <th className="text-left px-4 py-3 font-semibold" style={{ color: "#aaa" }}>
                  Title
                </th>
                <th className="text-left px-4 py-3 font-semibold" style={{ color: "#aaa" }}>
                  Location
                </th>
                <th className="text-left px-4 py-3 font-semibold" style={{ color: "#aaa" }}>
                  Status
                </th>
                <th className="text-left px-4 py-3 font-semibold" style={{ color: "#aaa" }}>
                  Updated
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {list.map((recipe, i) => (
                <tr
                  key={recipe.id}
                  style={{
                    background: i % 2 === 0 ? "#0f0f0f" : "#141414",
                    borderBottom: "1px solid #2e2e2e",
                  }}
                >
                  <td className="px-4 py-3 font-medium" style={{ color: "#f5f0e8" }}>
                    {recipe.title}
                  </td>
                  <td className="px-4 py-3" style={{ color: "#aaa" }}>
                    {recipe.location_name || <span style={{ color: "#555" }}>—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="inline-block px-2 py-0.5 rounded-full text-xs font-medium"
                      style={
                        recipe.published
                          ? { background: "rgba(52,199,89,0.15)", color: "#34c759" }
                          : { background: "rgba(100,100,100,0.15)", color: "#888" }
                      }
                    >
                      {recipe.published ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: "#555" }}>
                    {new Date(recipe.updated_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      {recipe.published && (
                        <Link
                          href={`/recipe/${recipe.slug}`}
                          target="_blank"
                          className="text-xs px-2.5 py-1 rounded-lg transition-opacity hover:opacity-80"
                          style={{ background: "#2e2e2e", color: "#aaa" }}
                        >
                          Preview
                        </Link>
                      )}
                      <Link
                        href={`/admin/recipes/${recipe.id}/edit`}
                        className="text-xs px-2.5 py-1 rounded-lg transition-opacity hover:opacity-80"
                        style={{ background: "rgba(232,168,56,0.15)", color: "#e8a838" }}
                      >
                        Edit
                      </Link>
                      <DeleteRecipeButton id={recipe.id} title={recipe.title} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
