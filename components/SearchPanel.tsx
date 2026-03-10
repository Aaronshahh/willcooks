"use client";

import { useState, useEffect } from "react";
import type { RecipePin } from "@/lib/recipes";

interface Props {
  pins: RecipePin[];
  isOpen: boolean;
  /** Reports the primary country from the current search query back to WorldMap */
  onCountryChange: (country: string | null) => void;
}

interface LocationResult {
  type: "location";
  locationName: string;
  country: string | null;
  recipeCount: number;
  recipes: { slug: string; title: string }[];
}

interface RecipeResult {
  type: "recipe";
  title: string;
  slug: string;
  locationName: string;
  country: string | null;
}

type SearchResult = LocationResult | RecipeResult;

function buildResults(pins: RecipePin[], raw: string): SearchResult[] {
  const q = raw.toLowerCase();
  const locationResults: LocationResult[] = [];
  const recipeResults: RecipeResult[] = [];
  const seenLocations = new Set<string>();

  for (const pin of pins) {
    const locationMatch =
      pin.location_name.toLowerCase().includes(q) ||
      (pin.country?.toLowerCase().includes(q) ?? false);

    if (locationMatch && !seenLocations.has(pin.location_name)) {
      seenLocations.add(pin.location_name);
      // Gather all dishes at this location
      const locationPins = pins.filter((p) => p.location_name === pin.location_name);
      locationResults.push({
        type: "location",
        locationName: pin.location_name,
        country: pin.country ?? null,
        recipeCount: locationPins.length,
        recipes: locationPins.map((p) => ({ slug: p.slug, title: p.title })),
      });
    }

    if (!locationMatch && pin.title.toLowerCase().includes(q)) {
      recipeResults.push({
        type: "recipe",
        title: pin.title,
        slug: pin.slug,
        locationName: pin.location_name,
        country: pin.country ?? null,
      });
    }
  }

  return [...locationResults, ...recipeResults];
}

export default function SearchPanel({ pins, isOpen, onCountryChange }: Props) {
  const [query, setQuery] = useState("");

  // Results update instantly on every keystroke
  const results: SearchResult[] =
    query.trim().length > 1 ? buildResults(pins, query.trim()) : [];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    // Clear the map card as soon as the search bar is emptied
    if (!val.trim()) onCountryChange(null);
  };

  // Map fly-to + AI only trigger on Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const primary = results[0]?.country ?? null;
      onCountryChange(primary);
    }
  };

  // Clear when panel closes
  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      onCountryChange(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  return (
    <div
      className="absolute top-0 bottom-0 left-0 z-20 flex"
      style={{
        width: isOpen ? 320 : 0,
        overflow: "hidden",
        transition: "width 0.32s cubic-bezier(0.4,0,0.2,1)",
        pointerEvents: isOpen ? "auto" : "none",
      }}
    >
      <div
        className="flex flex-col h-full"
        style={{
          width: 320,
          minWidth: 320,
          background: "rgba(10,10,10,0.97)",
          backdropFilter: "blur(14px)",
          borderRight: "1px solid #2a2a2a",
        }}
      >
        {/* ── Header + search ── */}
        <div className="px-5 pt-14 pb-4" style={{ borderBottom: "1px solid #1e1e1e" }}>
          <p
            className="text-xs uppercase tracking-widest mb-3 font-semibold"
            style={{ color: "#e8a838" }}
          >
            Explore
          </p>
          <div className="relative">
            <span
              className="absolute left-3 top-1/2 -translate-y-1/2 text-sm select-none"
              style={{ color: "#555" }}
            >
              🔍
            </span>
            <input
              type="text"
              value={query}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder="Country or dish… (Enter to explore)"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm outline-none"
              style={{
                background: "#1a1a1a",
                border: "1px solid #2e2e2e",
                color: "#f5f0e8",
              }}
              suppressHydrationWarning
            />
          </div>
        </div>

        {/* ── Results ── */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {query.trim().length <= 1 ? (
            <div className="flex flex-col items-center pt-8">
              <img
                src="/cooking_load.gif"
                alt=""
                className="select-none"
                style={{ width: 120, height: 120, objectFit: "contain" }}
              />
              <p className="text-sm mt-3" style={{ color: "#555" }}>
                Search a country or dish
              </p>
            </div>
          ) : results.length === 0 ? (
            <p className="text-sm text-center pt-10" style={{ color: "#555" }}>
              No results for &ldquo;{query}&rdquo;
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {results.map((result, i) => {
                if (result.type === "location") {
                  return (
                    <div
                      key={`loc-${i}`}
                      className="rounded-xl p-3 cursor-default"
                      style={{ background: "#141414", border: "1px solid #222" }}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-semibold" style={{ color: "#e8a838" }}>
                          📍 {result.locationName}
                          {result.country && result.country !== result.locationName && (
                            <span style={{ color: "#888", fontWeight: 400 }}>
                              {" "}· {result.country}
                            </span>
                          )}
                        </span>
                        <span className="text-xs" style={{ color: "#555" }}>
                          {result.recipeCount}{" "}
                          {result.recipeCount === 1 ? "recipe" : "recipes"}
                        </span>
                      </div>
                      {result.recipes.slice(0, 3).map((r) => (
                        <a
                          key={r.slug}
                          href={`/recipe/${r.slug}`}
                          className="block text-sm py-0.5 hover:underline"
                          style={{ color: "#888" }}
                        >
                          {r.title}
                        </a>
                      ))}
                    </div>
                  );
                }

                return (
                  <a
                    key={`rec-${i}`}
                    href={`/recipe/${result.slug}`}
                    className="flex items-center justify-between rounded-xl p-3"
                    style={{ background: "#141414", border: "1px solid #222" }}
                  >
                    <span className="text-sm font-medium" style={{ color: "#f5f0e8" }}>
                      {result.title}
                    </span>
                    <span className="text-xs ml-2 flex-shrink-0" style={{ color: "#555" }}>
                      📍 {result.locationName}
                    </span>
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
