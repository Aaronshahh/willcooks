import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import type { Country } from "@/app/actions/countries";
import DeleteCountryButton from "@/components/DeleteCountryButton";

export const dynamic = "force-dynamic";

export default async function CountriesPage() {
  const supabase = await createClient();
  const { data: countries } = await supabase
    .from("countries")
    .select("*")
    .order("name");

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "#f5f0e8" }}>
            Countries
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "#666" }}>
            Hand-written cuisine descriptions shown on the map. Overrides AI.
          </p>
        </div>
        <Link
          href="/admin/countries/new"
          className="px-4 py-2 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80"
          style={{ background: "#e8a838", color: "#0f0f0f" }}
        >
          + Add Country
        </Link>
      </div>

      {/* List */}
      {!countries?.length ? (
        <div
          className="text-center py-16 rounded-2xl"
          style={{ background: "#1a1a1a", border: "1px solid #2e2e2e" }}
        >
          <p className="text-sm" style={{ color: "#555" }}>
            No countries added yet. Click <strong style={{ color: "#aaa" }}>+ Add Country</strong> to write
            your first cuisine description.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {(countries as Country[]).map((c) => (
            <div
              key={c.id}
              className="rounded-xl p-4"
              style={{ background: "#1a1a1a", border: "1px solid #2e2e2e" }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm mb-1" style={{ color: "#e8a838" }}>
                    {c.name}
                  </p>
                  <p
                    className="text-sm leading-relaxed line-clamp-2"
                    style={{ color: "#888" }}
                  >
                    {c.description}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link
                    href={`/admin/countries/${c.id}/edit`}
                    className="text-xs px-3 py-1.5 rounded-lg transition-opacity hover:opacity-80"
                    style={{ background: "#2e2e2e", color: "#aaa" }}
                  >
                    Edit
                  </Link>
                  <DeleteCountryButton id={c.id} name={c.name} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
