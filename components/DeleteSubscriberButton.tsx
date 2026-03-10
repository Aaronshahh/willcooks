"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function DeleteSubscriberButton({
  id,
  email,
}: {
  id: string;
  email: string;
}) {
  const router = useRouter();

  async function handleDelete() {
    if (!confirm(`Remove ${email} from the list?`)) return;
    const supabase = createClient();
    await supabase.from("subscribers").delete().eq("id", id);
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      className="text-xs px-3 py-1.5 rounded-lg transition-opacity hover:opacity-80 flex-shrink-0"
      style={{ background: "rgba(220,50,50,0.15)", color: "#f87171" }}
    >
      Remove
    </button>
  );
}
