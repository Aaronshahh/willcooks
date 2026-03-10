"use client";

import { deleteCountry } from "@/app/actions/countries";

export default function DeleteCountryButton({
  id,
  name,
}: {
  id: string;
  name: string;
}) {
  async function handleDelete() {
    if (!confirm(`Delete "${name}"?`)) return;
    await deleteCountry(id);
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      className="text-xs px-3 py-1.5 rounded-lg transition-opacity hover:opacity-80"
      style={{ background: "rgba(220,50,50,0.15)", color: "#f87171" }}
    >
      Delete
    </button>
  );
}
