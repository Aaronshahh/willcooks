import { type NextRequest, NextResponse } from "next/server";

/**
 * Proxy (formerly middleware) – Next.js 16 file convention.
 * Auth is handled in server layouts/pages via Supabase server client.
 * This proxy only handles cookie pass-through for the Supabase session.
 */
export function proxy(request: NextRequest) {
  return NextResponse.next({ request });
}

export const config = {
  matcher: ["/admin/:path*"],
};
