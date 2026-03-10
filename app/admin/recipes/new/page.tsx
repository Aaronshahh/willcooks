import { requireAuth } from "@/lib/auth";
import RecipeForm from "@/components/RecipeForm";

export default async function NewRecipePage() {
  await requireAuth();

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1
          className="text-2xl font-bold"
          style={{ color: "#f5f0e8", fontFamily: "Georgia, serif" }}
        >
          New Recipe
        </h1>
        <p className="text-sm mt-1" style={{ color: "#888" }}>
          Fill in the details below. The map pin will be placed automatically.
        </p>
      </div>
      <RecipeForm />
    </div>
  );
}
