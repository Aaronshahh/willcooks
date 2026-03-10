import { createClient } from "@/lib/supabase/server";
import { detectVideo, getCoverImageUrl, type Recipe } from "@/lib/recipes";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("recipes")
    .select("title, location_name")
    .eq("slug", slug)
    .eq("published", true)
    .single();

  if (!data) return { title: "Recipe Not Found – Will Cooks" };

  return {
    title: `${data.title} – Will Cooks`,
    description: `A recipe from ${data.location_name} by Will.`,
  };
}

export default async function RecipePage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: recipe } = await supabase
    .from("recipes")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .single();

  if (!recipe) notFound();

  const r = recipe as Recipe;
  const video = detectVideo(r.video_url ?? "");
  const coverUrl = getCoverImageUrl(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    r.cover_image_path
  );

  const formattedDate = new Date(r.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div
      className="min-h-screen"
      style={{ background: "#0f0f0f", color: "#f5f0e8" }}
    >
      {/* Nav */}
      <nav
        className="sticky top-0 z-10 px-6 py-3 flex items-center gap-3"
        style={{
          background: "rgba(15,15,15,0.95)",
          backdropFilter: "blur(10px)",
          borderBottom: "1px solid #2e2e2e",
        }}
      >
        <Link
          href="/"
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          style={{ color: "#e8a838" }}
        >
          <span className="text-lg">←</span>
          <span
            className="font-bold text-lg"
            style={{ fontFamily: "Georgia, serif" }}
          >
            Will Cooks
          </span>
        </Link>
      </nav>

      <article className="max-w-3xl mx-auto px-6 py-10">
        {/* Cover image */}
        {coverUrl && (
          <div className="relative w-full h-64 md:h-96 rounded-2xl overflow-hidden mb-8">
            <Image
              src={coverUrl}
              alt={r.title}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 768px) 100vw, 768px"
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to top, rgba(15,15,15,0.5) 0%, transparent 60%)",
              }}
            />
          </div>
        )}

        {/* Title & meta */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm" style={{ color: "#e8a838" }}>
              📍 {r.location_name}
            </span>
            <span style={{ color: "#444" }}>·</span>
            <span className="text-sm" style={{ color: "#888" }}>
              {formattedDate}
            </span>
          </div>
          <h1
            className="text-3xl md:text-5xl font-bold leading-tight"
            style={{ fontFamily: "Georgia, serif", color: "#f5f0e8" }}
          >
            {r.title}
          </h1>
        </div>

        {/* Video embed – YouTube or TikTok */}
        {video?.type === "youtube" && (
          <div className="mb-10">
            <div
              className="relative w-full rounded-2xl overflow-hidden"
              style={{ paddingBottom: "56.25%" }}
            >
              <iframe
                className="absolute inset-0 w-full h-full"
                src={`https://www.youtube.com/embed/${video.id}`}
                title={r.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        )}

        {video?.type === "tiktok" && (
          <div className="mb-10 flex justify-center">
            <div className="rounded-2xl overflow-hidden" style={{ width: 325, maxWidth: "100%" }}>
              <iframe
                src={`https://www.tiktok.com/embed/v2/${video.id}`}
                style={{ width: 325, height: 740, maxWidth: "100%" }}
                allow="encrypted-media"
                allowFullScreen
                title={r.title}
              />
            </div>
          </div>
        )}

        {/* Blog body */}
        {r.body && (
          <div
            className="prose-recipe"
            dangerouslySetInnerHTML={{ __html: r.body }}
          />
        )}

        {/* Footer */}
        <div
          className="mt-16 pt-8 flex items-center justify-between"
          style={{ borderTop: "1px solid #2e2e2e" }}
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all hover:opacity-80"
            style={{
              background: "rgba(232,168,56,0.15)",
              color: "#e8a838",
              border: "1px solid rgba(232,168,56,0.3)",
            }}
          >
            ← Back to the Map
          </Link>
        </div>
      </article>
    </div>
  );
}
