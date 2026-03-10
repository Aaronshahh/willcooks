import AdminShell from "@/components/AdminShell";

/**
 * Admin layout – renders the nav shell.
 * Auth is checked per-page via requireAuth() (server layout guard pattern).
 * /admin/login renders without auth check.
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminShell>{children}</AdminShell>;
}
