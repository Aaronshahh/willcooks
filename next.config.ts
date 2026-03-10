import type { NextConfig } from "next";

// Extract the Supabase hostname at build/start time so Next.js image
// optimization can allowlist it explicitly (avoids wildcard matching issues).
function getSupabaseHostname(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  try {
    if (url) return new URL(url).hostname;
  } catch {
    // fall through to wildcard
  }
  return "*.supabase.co";
}

const nextConfig: NextConfig = {
  devIndicators: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: getSupabaseHostname(),
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "img.youtube.com",
      },
    ],
  },
};

export default nextConfig;
