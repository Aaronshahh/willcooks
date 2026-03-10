"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    router.push("/admin/recipes");
    router.refresh();
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "#0f0f0f" }}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-8"
        style={{ background: "#1a1a1a", border: "1px solid #2e2e2e" }}
      >
        <div className="text-center mb-8 relative">
          <a
            href="/"
            className="absolute left-0 top-0 flex items-center gap-1.5 text-xs transition-opacity hover:opacity-80"
            style={{ color: "#666" }}
          >
            <span style={{ fontSize: 16 }}>←</span>
            Back
          </a>
          <h1
            className="text-3xl font-bold"
            style={{ color: "#e8a838", fontFamily: "Georgia, serif" }}
          >
            Will Cheffing
          </h1>
          <p className="text-sm mt-2" style={{ color: "#888" }}>
            Admin login
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium mb-1.5"
              style={{ color: "#ccc" }}
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-colors"
              style={{
                background: "#0f0f0f",
                border: "1px solid #2e2e2e",
                color: "#f5f0e8",
              }}
              placeholder="will@example.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium mb-1.5"
              style={{ color: "#ccc" }}
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-colors"
              style={{
                background: "#0f0f0f",
                border: "1px solid #2e2e2e",
                color: "#f5f0e8",
              }}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div
              className="text-sm px-3 py-2.5 rounded-lg"
              style={{ background: "rgba(220,50,50,0.15)", color: "#f87171", border: "1px solid rgba(220,50,50,0.3)" }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg font-semibold text-sm transition-opacity disabled:opacity-50 mt-2"
            style={{
              background: "#e8a838",
              color: "#0f0f0f",
            }}
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
