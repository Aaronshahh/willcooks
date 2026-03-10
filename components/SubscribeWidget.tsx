"use client";

import { useState } from "react";
import { subscribeEmail } from "@/app/actions/subscribers";

type State = "idle" | "open" | "loading" | "success" | "already";

export default function SubscribeWidget() {
  const [state, setState] = useState<State>("idle");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setState("loading");
    setError(null);

    const result = await subscribeEmail(email);

    if (result.alreadySubscribed) {
      setState("already");
      return;
    }
    if (!result.success) {
      setError(result.error ?? "Something went wrong.");
      setState("open");
      return;
    }
    setState("success");
  }

  // ── Collapsed pill ──────────────────────────────────────────────────────────
  if (state === "idle") {
    return (
      <button
        onClick={() => setState("open")}
        className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-medium transition-all hover:opacity-90 active:scale-95"
        style={{
          background: "rgba(15,15,15,0.88)",
          border: "1px solid #2e2e2e",
          backdropFilter: "blur(10px)",
          color: "#aaa",
          boxShadow: "0 2px 12px rgba(0,0,0,0.4)",
        }}
      >
        <span style={{ fontSize: 15 }}>✉</span>
        Follow Will&apos;s cooking
      </button>
    );
  }

  // ── Success ─────────────────────────────────────────────────────────────────
  if (state === "success" || state === "already") {
    return (
      <div
        className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm"
        style={{
          background: "rgba(15,15,15,0.88)",
          border: "1px solid rgba(52,199,89,0.35)",
          backdropFilter: "blur(10px)",
          color: "#34c759",
          boxShadow: "0 2px 12px rgba(0,0,0,0.4)",
        }}
      >
        <span>✓</span>
        {state === "already"
          ? "You're already subscribed!"
          : "Subscribed! You'll hear from Will soon."}
      </div>
    );
  }

  // ── Expanded form ────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col items-center gap-2">
      {/* Error shown above the bar */}
      {error && (
        <div
          className="text-xs px-3 py-1.5 rounded-xl text-center"
          style={{
            background: "rgba(220,50,50,0.88)",
            color: "#fff",
            backdropFilter: "blur(6px)",
            maxWidth: 300,
          }}
        >
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 px-3 py-2 rounded-2xl"
        style={{
          background: "rgba(15,15,15,0.93)",
          border: "1px solid #2e2e2e",
          backdropFilter: "blur(12px)",
          boxShadow: "0 2px 16px rgba(0,0,0,0.5)",
        }}
      >
        <span className="text-sm flex-shrink-0" style={{ color: "#666" }}>✉</span>
        <input
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setError(null); }}
          placeholder="Your email…"
          required
          autoFocus
          className="bg-transparent outline-none text-sm w-44"
          style={{ color: "#f5f0e8", caretColor: "#e8a838" }}
          suppressHydrationWarning
        />
        <button
          type="submit"
          disabled={state === "loading"}
          className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-opacity hover:opacity-80 disabled:opacity-50 flex-shrink-0"
          style={{ background: "#e8a838", color: "#0a0a0a" }}
        >
          {state === "loading" ? "…" : "Follow"}
        </button>
        <button
          type="button"
          onClick={() => { setState("idle"); setError(null); setEmail(""); }}
          className="text-sm leading-none flex-shrink-0"
          style={{ color: "#555" }}
          aria-label="Close"
        >
          ✕
        </button>
      </form>
    </div>
  );
}
