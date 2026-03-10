import { createClient } from "@/lib/supabase/server";
import DeleteSubscriberButton from "@/components/DeleteSubscriberButton";

export const dynamic = "force-dynamic";

interface Subscriber {
  id: string;
  email: string;
  created_at: string;
}

export default async function SubscribersPage() {
  const supabase = await createClient();
  const { data: subscribers } = await supabase
    .from("subscribers")
    .select("id, email, created_at")
    .order("created_at", { ascending: false });

  const list = (subscribers as Subscriber[]) ?? [];

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "#f5f0e8" }}>
            Subscribers
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "#666" }}>
            {list.length} {list.length === 1 ? "person" : "people"} following Will&apos;s cooking
          </p>
        </div>
        {list.length > 0 && (
          <a
            href={`data:text/plain;charset=utf-8,${encodeURIComponent(list.map((s) => s.email).join("\n"))}`}
            download="subscribers.txt"
            className="text-xs px-3 py-1.5 rounded-lg transition-opacity hover:opacity-80"
            style={{ background: "#2e2e2e", color: "#aaa" }}
          >
            Export emails
          </a>
        )}
      </div>

      {list.length === 0 ? (
        <div
          className="text-center py-16 rounded-2xl"
          style={{ background: "#1a1a1a", border: "1px solid #2e2e2e" }}
        >
          <p className="text-sm" style={{ color: "#555" }}>
            No subscribers yet. Share the site and they&apos;ll show up here.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {list.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between px-4 py-3 rounded-xl"
              style={{ background: "#1a1a1a", border: "1px solid #2e2e2e" }}
            >
              <div>
                <p className="text-sm font-medium" style={{ color: "#f5f0e8" }}>
                  {s.email}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "#555" }}>
                  Subscribed{" "}
                  {new Date(s.created_at).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
              <DeleteSubscriberButton id={s.id} email={s.email} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
