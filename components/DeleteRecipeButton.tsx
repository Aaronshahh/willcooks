"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface Props {
  id: string;
  title: string;
}

export default function DeleteRecipeButton({ id, title }: Props) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setLoading(true);

    const supabase = createClient();
    await supabase.from("recipes").delete().eq("id", id);

    router.refresh();
    setLoading(false);
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="text-xs px-2.5 py-1 rounded-lg transition-opacity hover:opacity-80 disabled:opacity-50"
      style={{ background: "rgba(220,50,50,0.15)", color: "#f87171" }}
    >
      {loading ? "…" : "Delete"}
    </button>
  );
}
