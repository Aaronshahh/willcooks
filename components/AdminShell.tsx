"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AdminShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === "/admin/login";

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  if (isLoginPage) return <>{children}</>;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#0f0f0f" }}>
      <nav
        className="px-6 py-3 flex items-center justify-between"
        style={{ background: "#1a1a1a", borderBottom: "1px solid #2e2e2e" }}
      >
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="font-bold text-lg"
            style={{ color: "#e8a838", fontFamily: "Georgia, serif" }}
          >
            Will Cheffing
          </Link>
          <Link
            href="/admin/recipes"
            className="text-sm font-medium transition-colors hover:opacity-80"
            style={{ color: pathname.startsWith("/admin/recipes") ? "#e8a838" : "#aaa" }}
          >
            Recipes
          </Link>
          <Link
            href="/admin/recipes/new"
            className="text-sm font-medium transition-colors hover:opacity-80"
            style={{ color: pathname === "/admin/recipes/new" ? "#e8a838" : "#aaa" }}
          >
            + New Recipe
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-sm px-3 py-1.5 rounded-lg transition-opacity hover:opacity-80 flex items-center gap-1.5"
            style={{ color: "#aaa", background: "#2e2e2e" }}
          >
            <span>←</span> Map
          </Link>
          <button
            onClick={handleSignOut}
            className="text-sm px-3 py-1.5 rounded-lg transition-opacity hover:opacity-80"
            style={{ color: "#888", background: "#2e2e2e" }}
          >
            Sign out
          </button>
        </div>
      </nav>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
