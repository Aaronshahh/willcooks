"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/client";
import { saveRecipe } from "@/app/actions/recipes";
import type { Recipe } from "@/lib/recipes";
import Image from "next/image";
import { getCoverImageUrl, detectVideo } from "@/lib/recipes";

const RichTextEditor = dynamic(() => import("@/components/RichTextEditor"), {
  ssr: false,
  loading: () => (
    <div
      className="rounded-xl px-4 py-3 text-sm"
      style={{ background: "#0f0f0f", border: "1px solid #2e2e2e", color: "#555", minHeight: 280 }}
    >
      Loading editor…
    </div>
  ),
});

interface Props {
  recipe?: Recipe;
}

export default function RecipeForm({ recipe }: Props) {
  const router = useRouter();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

  const [title, setTitle] = useState(recipe?.title ?? "");
  const [city, setCity] = useState(recipe?.city ?? "");
  const [country, setCountry] = useState(recipe?.country ?? "");
  const [videoUrl, setVideoUrl] = useState(recipe?.video_url ?? "");
  const [body, setBody] = useState(recipe?.body ?? "");
  const [published, setPublished] = useState(recipe?.published ?? false);
  const [coverPath, setCoverPath] = useState<string | null>(
    recipe?.cover_image_path ?? null
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [geocodeDisplay, setGeocodeDisplay] = useState<string | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);

  const coverInputRef = useRef<HTMLInputElement>(null);

  const existingCoverUrl = getCoverImageUrl(supabaseUrl, coverPath);
  const videoEmbed = detectVideo(videoUrl);

  async function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (<= 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError("Cover image must be under 2MB.");
      return;
    }

    setUploadingCover(true);
    setError(null);

    // We need a deterministic path – use recipe id if editing, else a temp UUID
    const tempId = recipe?.id ?? crypto.randomUUID();
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const path = `${tempId}.${ext}`;

    const supabase = createClient();
    const { error: uploadError } = await supabase.storage
      .from("recipe-covers")
      .upload(path, file, { upsert: true, contentType: file.type });

    if (uploadError) {
      setError(`Cover upload failed: ${uploadError.message}`);
      setUploadingCover(false);
      return;
    }

    setCoverPath(path);
    setUploadingCover(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError("Title is required."); return; }
    if (!country.trim()) { setError("Country is required."); return; }

    setSaving(true);
    setError(null);
    setGeocodeDisplay(null);

    const result = await saveRecipe({
      id: recipe?.id,
      title,
      city,
      country,
      video_url: videoUrl,
      body,
      published,
      cover_image_path: coverPath,
    });

    if (!result.success) {
      setError(result.error ?? "Something went wrong.");
      setSaving(false);
      return;
    }

    if (result.geocodeDisplay) {
      setGeocodeDisplay(result.geocodeDisplay);
    }

    setSaving(false);
    router.push("/admin/recipes");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto flex flex-col gap-6">
      {/* Title */}
      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ color: "#ccc" }}>
          Recipe Title <span style={{ color: "#e8a838" }}>*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="e.g. Tokyo Ramen"
          className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
          style={{
            background: "#0f0f0f",
            border: "1px solid #2e2e2e",
            color: "#f5f0e8",
          }}
        />
      </div>

      {/* City + Country */}
      <div className="flex flex-col gap-4">
        <div className="flex gap-3">
          {/* City */}
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1.5" style={{ color: "#ccc" }}>
              City
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => { setCity(e.target.value); setGeocodeDisplay(null); }}
              placeholder="e.g. Tokyo"
              className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
              style={{
                background: "#0f0f0f",
                border: "1px solid #2e2e2e",
                color: "#f5f0e8",
              }}
            />
          </div>

          {/* Country */}
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1.5" style={{ color: "#ccc" }}>
              Country <span style={{ color: "#e8a838" }}>*</span>
            </label>
            <input
              type="text"
              value={country}
              onChange={(e) => { setCountry(e.target.value); setGeocodeDisplay(null); }}
              required
              placeholder="e.g. Japan"
              className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
              style={{
                background: "#0f0f0f",
                border: "1px solid #2e2e2e",
                color: "#f5f0e8",
              }}
            />
          </div>
        </div>

        <p className="text-xs -mt-2" style={{ color: "#666" }}>
          The map pin will be placed automatically when you save.
        </p>

        {geocodeDisplay && (
          <p
            className="text-xs px-2.5 py-1.5 rounded-lg -mt-2"
            style={{ background: "rgba(52,199,89,0.1)", color: "#34c759" }}
          >
            📍 Map pin set to: {geocodeDisplay}
          </p>
        )}
      </div>

      {/* Video URL – YouTube or TikTok */}
      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ color: "#ccc" }}>
          Video URL
        </label>
        <input
          type="url"
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          placeholder="YouTube or TikTok link…"
          className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
          style={{
            background: "#0f0f0f",
            border: "1px solid #2e2e2e",
            color: "#f5f0e8",
          }}
        />
        <p className="text-xs mt-1" style={{ color: "#555" }}>
          Paste a YouTube (<code style={{ color: "#888" }}>youtube.com/watch?v=…</code> or Shorts) or TikTok (<code style={{ color: "#888" }}>tiktok.com/@user/video/…</code>) link.
        </p>

        {/* YouTube preview */}
        {videoEmbed?.type === "youtube" && (
          <div
            className="mt-3 rounded-xl overflow-hidden relative"
            style={{ paddingBottom: "56.25%" }}
          >
            <iframe
              className="absolute inset-0 w-full h-full"
              src={`https://www.youtube.com/embed/${videoEmbed.id}`}
              title="Video preview"
              allowFullScreen
            />
          </div>
        )}

        {/* TikTok preview */}
        {videoEmbed?.type === "tiktok" && (
          <div className="mt-3 flex justify-center">
            <iframe
              src={`https://www.tiktok.com/embed/v2/${videoEmbed.id}`}
              style={{ width: 325, height: 580, borderRadius: 12, border: "none" }}
              allow="encrypted-media"
              allowFullScreen
              title="TikTok preview"
            />
          </div>
        )}

        {/* Unrecognised URL warning */}
        {videoUrl && !videoEmbed && (
          <p
            className="mt-2 text-xs px-2.5 py-1.5 rounded-lg"
            style={{ background: "rgba(220,150,50,0.1)", color: "#f0a040", border: "1px solid rgba(220,150,50,0.25)" }}
          >
            URL not recognised. Paste a full YouTube or TikTok video link.
          </p>
        )}
      </div>

      {/* Cover image */}
      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ color: "#ccc" }}>
          Cover Image
        </label>
        {existingCoverUrl && (
          <div className="relative w-full h-48 rounded-xl overflow-hidden mb-3">
            <Image
              src={existingCoverUrl}
              alt="Cover"
              fill
              className="object-cover"
              sizes="640px"
            />
            <button
              type="button"
              onClick={() => setCoverPath(null)}
              className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold"
              style={{ background: "rgba(0,0,0,0.7)", color: "#fff" }}
            >
              ×
            </button>
          </div>
        )}
        <input
          type="file"
          accept="image/*"
          ref={coverInputRef}
          onChange={handleCoverChange}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => coverInputRef.current?.click()}
          disabled={uploadingCover}
          className="px-4 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-50"
          style={{ background: "#2e2e2e", color: "#aaa" }}
        >
          {uploadingCover
            ? "Uploading…"
            : existingCoverUrl
            ? "Change cover image"
            : "Upload cover image"}
        </button>
        <p className="text-xs mt-1" style={{ color: "#555" }}>
          Max 2MB. JPG, PNG, or WebP.
        </p>
      </div>

      {/* Blog post body */}
      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ color: "#ccc" }}>
          Recipe Blog Post
        </label>
        <RichTextEditor value={body} onChange={setBody} />
        <p className="text-xs mt-1" style={{ color: "#555" }}>
          Write your recipe, story, tips, and instructions here.
        </p>
      </div>

      {/* Publish toggle */}
      <div
        className="flex items-center justify-between p-4 rounded-xl"
        style={{ background: "#1a1a1a", border: "1px solid #2e2e2e" }}
      >
        <div>
          <p className="font-medium text-sm" style={{ color: "#f5f0e8" }}>
            {published ? "Published" : "Draft"}
          </p>
          <p className="text-xs mt-0.5" style={{ color: "#666" }}>
            {published
              ? "Visible on the map and to all visitors."
              : "Only you can see this. Publish when ready."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setPublished(!published)}
          className="relative inline-flex h-7 w-12 items-center rounded-full transition-colors"
          style={{ background: published ? "#e8a838" : "#2e2e2e" }}
          aria-checked={published}
          role="switch"
        >
          <span
            className="inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow"
            style={{ transform: `translateX(${published ? "22px" : "4px"})` }}
          />
        </button>
      </div>

      {/* Error */}
      {error && (
        <div
          className="text-sm px-3 py-2.5 rounded-lg"
          style={{
            background: "rgba(220,50,50,0.15)",
            color: "#f87171",
            border: "1px solid rgba(220,50,50,0.3)",
          }}
        >
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 pb-8">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 rounded-xl font-semibold text-sm transition-opacity hover:opacity-80 disabled:opacity-50"
          style={{ background: "#e8a838", color: "#0f0f0f" }}
        >
          {saving ? "Saving…" : recipe ? "Save Changes" : "Create Recipe"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/recipes")}
          className="px-4 py-2.5 rounded-xl font-medium text-sm transition-opacity hover:opacity-80"
          style={{ background: "#2e2e2e", color: "#aaa" }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
