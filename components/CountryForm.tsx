"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveCountry } from "@/app/actions/countries";
import type { Country } from "@/app/actions/countries";

interface Props {
  country?: Country;
}

export default function CountryForm({ country }: Props) {
  const router = useRouter();
  const [name, setName] = useState(country?.name ?? "");
  const [description, setDescription] = useState(country?.description ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("Country name is required."); return; }
    if (!description.trim()) { setError("Description is required."); return; }

    setSaving(true);
    setError(null);

    const result = await saveCountry({
      id: country?.id,
      name,
      description,
    });

    if (!result.success) {
      setError(result.error ?? "Something went wrong.");
      setSaving(false);
      return;
    }

    router.push("/admin/countries");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl flex flex-col gap-6">
      {/* Country name */}
      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ color: "#ccc" }}>
          Country <span style={{ color: "#e8a838" }}>*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="e.g. Japan"
          className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
          style={{ background: "#0f0f0f", border: "1px solid #2e2e2e", color: "#f5f0e8" }}
        />
        <p className="text-xs mt-1" style={{ color: "#555" }}>
          Must match exactly how you enter the country when adding recipes.
        </p>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ color: "#ccc" }}>
          Cuisine Description <span style={{ color: "#e8a838" }}>*</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={5}
          required
          placeholder="Describe the cuisine, key flavours, and iconic dishes of this country…"
          className="w-full px-3 py-2.5 rounded-lg text-sm outline-none resize-none"
          style={{
            background: "#0f0f0f",
            border: "1px solid #2e2e2e",
            color: "#f5f0e8",
            lineHeight: 1.65,
          }}
        />
        <p className="text-xs mt-1" style={{ color: "#555" }}>
          This replaces the AI-generated overview shown on the map when visitors
          search for this country.
        </p>
      </div>

      {error && (
        <div
          className="text-sm px-3 py-2.5 rounded-lg"
          style={{
            background: "rgba(220,50,50,0.15)",
            color: "#f87171",
            border: "1px solid rgba(220,50,50,0.3)",
          }}
        >
          {error}
        </div>
      )}

      <div className="flex items-center gap-3 pb-8">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 rounded-xl font-semibold text-sm transition-opacity hover:opacity-80 disabled:opacity-50"
          style={{ background: "#e8a838", color: "#0f0f0f" }}
        >
          {saving ? "Saving…" : country ? "Save Changes" : "Add Country"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/countries")}
          className="px-4 py-2.5 rounded-xl font-medium text-sm transition-opacity hover:opacity-80"
          style={{ background: "#2e2e2e", color: "#aaa" }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
