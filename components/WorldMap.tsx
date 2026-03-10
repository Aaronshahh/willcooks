"use client";

import { useEffect, useRef, useState } from "react";
import type { RecipePin } from "@/lib/recipes";
import { getCoverImageUrl } from "@/lib/recipes";
import Image from "next/image";
import SearchPanel from "@/components/SearchPanel";

interface Props {
  pins: RecipePin[];
}

interface AiCardState {
  country: string;
  recipeCount: number;
  text: string | null;
  loading: boolean;
  noToken?: boolean;
  rateLimited?: boolean;
  error?: string | null;
  /** Pixel position on the map canvas — null until the fly-to animation settles */
  position: { left: number; top: number; pointLeft: boolean } | null;
}

export default function WorldMap({ pins }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<import("leaflet").Map | null>(null);
  const leafletRef = useRef<typeof import("leaflet") | null>(null);
  const countryLayerRef = useRef<import("leaflet").GeoJSON | null>(null);
  const cityLayerRef = useRef<import("leaflet").GeoJSON | null>(null);
  const geoJsonCache = useRef<Map<string, object>>(new Map());
  const aiCacheRef = useRef<Map<string, string>>(new Map());
  const dishCacheRef = useRef<Map<string, { description: string | null; cost: string | null }>>(new Map());
  const markersRef = useRef<Map<string, import("leaflet").Marker>>(new Map());

  const [selectedPin, setSelectedPin] = useState<RecipePin | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeCountry, setActiveCountry] = useState<string | null>(null);
  const [aiCard, setAiCard] = useState<AiCardState | null>(null);
  const [dishInfo, setDishInfo] = useState<{
    loading: boolean;
    description: string | null;
    cost: string | null;
    error?: string | null;
  } | null>(null);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

  // ── Keep the clicked pin visually expanded (same as hover) ──────────────────
  useEffect(() => {
    // Remove active from all markers (getElement() called now, when DOM is ready)
    markersRef.current.forEach((m) => m.getElement()?.classList.remove("active"));
    if (selectedPin) {
      markersRef.current.get(selectedPin.id)?.getElement()?.classList.add("active");
    }
  }, [selectedPin]);

  // ── Activate country: outline + fly-to + AI card ────────────────────────────
  useEffect(() => {
    const country = activeCountry;

    // Clear previous layer
    if (countryLayerRef.current && mapInstanceRef.current) {
      mapInstanceRef.current.removeLayer(countryLayerRef.current);
      countryLayerRef.current = null;
    }

    if (!country) {
      setAiCard(null);
      return;
    }

    let active = true;
    let moveEndHandler: (() => void) | null = null;

    (async () => {
      const L = leafletRef.current;
      const map = mapInstanceRef.current;
      if (!L || !map) return;

      // Fetch GeoJSON polygon (cached)
      let geoData: object | undefined = geoJsonCache.current.get(country);
      if (!geoData) {
        try {
          const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(country)}&format=geojson&limit=1&polygon_geojson=1`;
          const res = await fetch(url, {
            headers: { "User-Agent": "WillCooksBlog/1.0" },
          });
          if (!res.ok || !active) return;
          const data = await res.json();
          if (!data.features?.length || !active) return;
          geoData = data;
          geoJsonCache.current.set(country, data);
        } catch {
          return;
        }
      }
      if (!active) return;

      // Draw white outline
      const layer = L.geoJSON(geoData as Parameters<typeof L.geoJSON>[0], {
        style: {
          color: "rgba(255,255,255,0.85)",
          weight: 1.5,
          opacity: 0.9,
          fillColor: "#ffffff",
          fillOpacity: 0.06,
        },
      });
      layer.addTo(map);
      countryLayerRef.current = layer;

      // Fly to country
      const bounds = layer.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [80, 80], maxZoom: 6 });
      }

      // Recipe count for this country — each pin is one dish
      const recipeCount = pins.filter(
        (pin) => (pin.country ?? "").toLowerCase() === country.toLowerCase()
      ).length;

      if (active) setAiCard({ country, recipeCount, text: null, loading: true, position: null });

      // Compute card pixel position after the fly-to settles
      moveEndHandler = () => {
        if (!active || !mapInstanceRef.current) return;
        const m = mapInstanceRef.current;
        const center = bounds.isValid() ? bounds.getCenter() : map.getCenter();
        const centerPt = m.latLngToContainerPoint(center);
        const mapW = m.getContainer().clientWidth;
        const cardW = 310;
        const gap = 18;
        const panelOffset = searchOpen ? 320 : 0;

        // Default: place card to the right of the country's eastern edge
        const ne = bounds.isValid() ? bounds.getNorthEast() : center;
        const nePt = m.latLngToContainerPoint(ne);
        let left = nePt.x + gap;
        let pointLeft = true; // arrow points ← toward country

        // If card would overflow right edge, place it to the left instead
        if (left + cardW > mapW - 16) {
          const sw = bounds.isValid() ? bounds.getSouthWest() : center;
          const swPt = m.latLngToContainerPoint(sw);
          left = swPt.x - cardW - gap;
          pointLeft = false; // arrow points → toward country
        }

        // Clamp so it never hides under the search panel or goes off-screen
        left = Math.max(panelOffset + 16, Math.min(left, mapW - cardW - 16));

        setAiCard((prev) =>
          prev?.country === country
            ? { ...prev, position: { left, top: centerPt.y, pointLeft } }
            : prev
        );
      };

      map.once("moveend", moveEndHandler);
      // Fallback if map was already at the right view (moveend may fire instantly or not at all)
      setTimeout(() => { if (active && moveEndHandler) moveEndHandler(); }, 900);

      // Fetch AI summary — server handles retries internally
      if (aiCacheRef.current.has(country)) {
        const cached = aiCacheRef.current.get(country)!;
        if (active)
          setAiCard((prev) =>
            prev?.country === country ? { ...prev, loading: false, text: cached } : prev
          );
        return;
      }

      try {
        const aiRes = await fetch(
          `/api/ai-country-summary?country=${encodeURIComponent(country)}`
        );
        if (!active) return;
        const data = await aiRes.json();
        const text: string | null = data.summary ?? null;
        if (text) aiCacheRef.current.set(country, text);
        if (active)
          setAiCard((prev) =>
            prev?.country === country
              ? {
                  ...prev,
                  loading: false,
                  text,
                  noToken: data.noToken,
                  rateLimited: data.rateLimited,
                  error: data.error ?? null,
                }
              : prev
          );
      } catch {
        if (active)
          setAiCard((prev) =>
            prev?.country === country
              ? { ...prev, loading: false, error: "Could not load summary." }
              : prev
          );
      }
    })();

    return () => {
      active = false;
      if (moveEndHandler && mapInstanceRef.current) {
        mapInstanceRef.current.off("moveend", moveEndHandler);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCountry]);

  // ── City highlight — draws a gold outline when a pin is clicked ──────────────
  useEffect(() => {
    const L = leafletRef.current;
    const map = mapInstanceRef.current;

    // Clear previous city layer
    if (cityLayerRef.current && map) {
      map.removeLayer(cityLayerRef.current);
      cityLayerRef.current = null;
    }

    if (!selectedPin || !L || !map) return;

    let active = true;
    const locationName = selectedPin.location_name;

    (async () => {
      // Reuse the shared GeoJSON cache
      let geoData: object | undefined = geoJsonCache.current.get(locationName);
      if (!geoData) {
        try {
          const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locationName)}&format=geojson&limit=1&polygon_geojson=1`;
          const res = await fetch(url, {
            headers: { "User-Agent": "WillCooksBlog/1.0" },
          });
          if (!res.ok || !active) return;
          const data = await res.json();
          if (!data.features?.length || !active) return;
          geoData = data;
          geoJsonCache.current.set(locationName, data);
        } catch {
          return;
        }
      }
      if (!active || !mapInstanceRef.current || !leafletRef.current) return;

      // Build a temporary layer just to get the bounds for flyToBounds
      const tmpLayer = leafletRef.current.geoJSON(
        geoData as Parameters<typeof L.geoJSON>[0]
      );
      const bounds = tmpLayer.getBounds();

      // Fly to the city bounds first, then draw the highlight once settled
      const drawAfterZoom = () => {
        if (!active || !mapInstanceRef.current || !leafletRef.current) return;
        const layer = leafletRef.current.geoJSON(
          geoData as Parameters<typeof L.geoJSON>[0],
          {
            style: {
              color: "#e8a838",
              weight: 2,
              opacity: 0.9,
              fillColor: "#e8a838",
              fillOpacity: 0.08,
            },
          }
        );
        layer.addTo(mapInstanceRef.current);
        cityLayerRef.current = layer;
      };

      if (bounds.isValid()) {
        mapInstanceRef.current.once("moveend", drawAfterZoom);
        mapInstanceRef.current.flyToBounds(bounds, {
          padding: [60, 60],
          maxZoom: 13,
          animate: true,
          duration: 1.2,
        });
      } else {
        // No valid bounds — draw immediately as fallback
        drawAfterZoom();
      }
    })();

    return () => {
      active = false;
      // If the effect is cancelled before moveend fires, remove the pending listener
      if (mapInstanceRef.current) {
        // drawAfterZoom checks `active`, so this is just defensive cleanup
        mapInstanceRef.current.off("moveend");
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPin]);

  // ── Fetch AI dish info when a pin is clicked ────────────────────────────────
  useEffect(() => {
    if (!selectedPin) {
      setDishInfo(null);
      return;
    }

    const title = selectedPin.title;

    // Serve from cache if available
    if (dishCacheRef.current.has(title)) {
      const cached = dishCacheRef.current.get(title)!;
      setDishInfo({ loading: false, ...cached });
      return;
    }

    setDishInfo({ loading: true, description: null, cost: null });
    let cancelled = false;

    fetch(`/api/ai-dish-info?dish=${encodeURIComponent(title)}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const result = {
          description: (data.description as string | null) ?? null,
          cost: (data.cost as string | null) ?? null,
        };
        dishCacheRef.current.set(title, result);
        setDishInfo({
          loading: false,
          ...result,
          error: data.error ?? null,
        });
      })
      .catch(() => {
        if (!cancelled)
          setDishInfo({ loading: false, description: null, cost: null, error: "Could not load." });
      });

    return () => { cancelled = true; };
  }, [selectedPin]);

  // ── Leaflet map initialisation ───────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined" || !mapRef.current) return;
    if (mapRef.current.dataset.leafletInit) return;
    mapRef.current.dataset.leafletInit = "1";

    let leafletMap: import("leaflet").Map | null = null;

    import("leaflet").then((L) => {
      if (!mapRef.current) return;

      leafletRef.current = L;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      leafletMap = L.map(mapRef.current, {
        center: [20, 0],
        zoom: 2,
        minZoom: 2,
        maxZoom: 10,
        zoomControl: false,
        scrollWheelZoom: true,
        worldCopyJump: true,
      });

      L.control.zoom({ position: "bottomright" }).addTo(leafletMap);
      mapInstanceRef.current = leafletMap;

      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: "abcd",
          maxZoom: 19,
        }
      ).addTo(leafletMap);

      pins.forEach((pin) => {
        const coverUrl = pin.cover_image_path
          ? getCoverImageUrl(supabaseUrl, pin.cover_image_path)
          : null;

        const coverLayer = coverUrl
          ? `<div class="will-pin-cover" style="position:absolute;inset:0;border-radius:50%;background-image:url('${coverUrl}');background-size:cover;background-position:center;opacity:0;transition:opacity 0.25s ease 0.1s"></div>`
          : "";

        const pinIcon = L.divIcon({
          className: "will-pin-container",
          html: `<div class="will-pin" style="display:flex;flex-direction:column;align-items:center;cursor:pointer;transform-origin:50% 100%;transition:transform 0.42s cubic-bezier(0.34,1.56,0.64,1),filter 0.3s ease;filter:drop-shadow(0 1px 4px rgba(0,0,0,0.45))">
            <div style="position:relative;width:22px;height:22px;border-radius:50%;border:2.5px solid #fff;background-color:#e8a838;box-shadow:0 1px 6px rgba(0,0,0,0.55);overflow:hidden">${coverLayer}</div>
            <div style="width:2px;height:6px;background:rgba(255,255,255,0.85);border-radius:0 0 2px 2px"></div>
          </div>`,
          iconSize: [26, 30],
          iconAnchor: [13, 30],
        });

        const marker = L.marker([pin.lat, pin.lng], { icon: pinIcon }).addTo(leafletMap!);
        // Keyed by recipe id so multiple dishes at the same city each get their own entry
        markersRef.current.set(pin.id, marker);

        marker.on("click", () => {
          setSelectedPin(pin);
          leafletMap!.flyTo([pin.lat, pin.lng], Math.max(leafletMap!.getZoom(), 10), {
            animate: true,
            duration: 0.8,
          });
        });
      });
    });

    return () => {
      if (leafletMap) {
        leafletMap.remove();
        leafletMap = null;
        mapInstanceRef.current = null;
        leafletRef.current = null;
      }
      if (mapRef.current) {
        delete mapRef.current.dataset.leafletInit;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Map canvas */}
      <div ref={mapRef} className="absolute inset-0 z-0" />

      {/* Search panel (left slide-in) */}
      <SearchPanel
        pins={pins}
        isOpen={searchOpen}
        onCountryChange={setActiveCountry}
      />

      {/* ── Floating AI country card (right of country, vertically centred) ── */}
      {aiCard && aiCard.position && (
        <div
          className="absolute pointer-events-none"
          style={{
            zIndex: 22,
            width: 310,
            left: aiCard.position.left,
            top: aiCard.position.top,
            transform: "translateY(-50%)",
          }}
        >
          {/* Arrow pointing toward country */}
          {aiCard.position.pointLeft && (
            <div
              style={{
                position: "absolute",
                left: -7,
                top: "50%",
                transform: "translateY(-50%)",
                width: 0,
                height: 0,
                borderRight: "7px solid rgba(232,168,56,0.22)",
                borderTop: "7px solid transparent",
                borderBottom: "7px solid transparent",
              }}
            />
          )}
          {!aiCard.position.pointLeft && (
            <div
              style={{
                position: "absolute",
                right: -7,
                top: "50%",
                transform: "translateY(-50%)",
                width: 0,
                height: 0,
                borderLeft: "7px solid rgba(232,168,56,0.22)",
                borderTop: "7px solid transparent",
                borderBottom: "7px solid transparent",
              }}
            />
          )}

          <div
            className="rounded-2xl px-4 py-3.5 pointer-events-auto"
            style={{
              background: "rgba(10,10,10,0.93)",
              backdropFilter: "blur(16px)",
              border: "1px solid rgba(232,168,56,0.22)",
              boxShadow: "0 6px 30px rgba(0,0,0,0.55)",
            }}
          >
            {/* Header row */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <p
                className="text-xs font-semibold uppercase tracking-widest leading-tight"
                style={{ color: "#e8a838" }}
              >
                {aiCard.country}
              </p>
              {aiCard.recipeCount > 0 && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap flex-shrink-0"
                  style={{
                    background: "rgba(232,168,56,0.15)",
                    color: "#e8a838",
                  }}
                >
                  {aiCard.recipeCount}{" "}
                  {aiCard.recipeCount === 1 ? "dish" : "dishes"} by Will
                </span>
              )}
            </div>

            {/* AI body */}
            {aiCard.loading ? (
              <div className="flex items-center gap-1.5">
                {[0, 0.15, 0.3].map((delay, i) => (
                  <span
                    key={i}
                    className="inline-block w-1.5 h-1.5 rounded-full animate-bounce"
                    style={{ background: "#e8a838", animationDelay: `${delay}s` }}
                  />
                ))}
                <span className="text-xs ml-1" style={{ color: "#666" }}>
                  Generating overview…
                </span>
              </div>
            ) : aiCard.noToken ? (
              <p className="text-xs leading-relaxed" style={{ color: "#666" }}>
                Add <code style={{ color: "#aaa" }}>GROQ_API_KEY</code> to{" "}
                <code style={{ color: "#aaa" }}>.env.local</code> to enable AI
                summaries.
              </p>
            ) : aiCard.rateLimited ? (
              <p className="text-xs" style={{ color: "#888" }}>
                Rate limited — wait a moment and try again.
              </p>
            ) : aiCard.text ? (
              <p className="text-sm leading-relaxed" style={{ color: "#ccc" }}>
                {aiCard.text}
              </p>
            ) : (
              <p className="text-xs" style={{ color: "#666" }}>
                {aiCard.error ?? "No summary available."}
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Magnifying glass toggle button (bottom-left) ── */}
      <button
        onClick={() => setSearchOpen((o) => !o)}
        aria-label={searchOpen ? "Close search" : "Open search"}
        className="absolute z-30 flex items-center justify-center rounded-2xl transition-all"
        style={{
          bottom: 32,
          left: searchOpen ? 328 : 16,
          width: 48,
          height: 48,
          background: searchOpen ? "rgba(232,168,56,0.15)" : "rgba(15,15,15,0.85)",
          border: `1px solid ${searchOpen ? "rgba(232,168,56,0.4)" : "#2e2e2e"}`,
          backdropFilter: "blur(10px)",
          boxShadow: "0 2px 12px rgba(0,0,0,0.4)",
          transition: "left 0.32s cubic-bezier(0.4,0,0.2,1), background 0.2s, border-color 0.2s",
        }}
      >
        {searchOpen ? (
          <span style={{ color: "#e8a838", fontSize: 20, lineHeight: 1 }}>✕</span>
        ) : (
          <img src="/magnify.png" alt="Search" width={26} height={26} style={{ opacity: 0.85 }} />
        )}
      </button>

      {/* ── Header overlay ── */}
      <div
        className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-6 py-4"
        style={{
          background: "linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 100%)",
          pointerEvents: "none",
        }}
      >
        <div className="flex items-center gap-3" style={{ pointerEvents: "auto" }}>
          {/* Logo with social icons fanning out on hover */}
          <div className="logo-group">
            {/* TikTok — update href to Will's actual profile */}
            <a
              href="https://www.tiktok.com/@will.cheffing"
              className="logo-social-icon logo-social-tiktok"
              aria-label="TikTok"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img src="/tiktok_logo.webp" alt="TikTok" width={20} height={20} style={{ borderRadius: 3 }} />
            </a>
            {/* Instagram — update href to Will's actual profile */}
            <a
              href="https://www.instagram.com/willcheffing/"
              className="logo-social-icon logo-social-instagram"
              aria-label="Instagram"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img src="/instagram_logo.png" alt="Instagram" width={20} height={20} />
            </a>
            {/* Main logo (rendered last = highest natural stacking, z-index 2 via CSS) */}
            <img
              src="/willcheffinglogo.jpeg"
              alt="Will Cheffing"
              className="logo-img"
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                objectFit: "cover",
                border: "2px solid rgba(232,168,56,0.5)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
              }}
            />
          </div>
          <div>
            <h1
              className="text-3xl font-bold tracking-tight"
              style={{ color: "#e8a838", fontFamily: "Georgia, serif" }}
            >
              Will Cheffing
            </h1>
            <p className="text-sm mt-0.5" style={{ color: "#aaa" }}>
              Click a pin to explore recipes from around the world
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3" style={{ pointerEvents: "auto" }}>
          <div
            className="text-sm px-3 py-1 rounded-full"
            style={{
              background: "rgba(232,168,56,0.15)",
              color: "#e8a838",
              border: "1px solid rgba(232,168,56,0.3)",
            }}
          >
            {pins.length} {pins.length === 1 ? "dish" : "dishes"}
          </div>
          <a
            href="/admin"
            className="text-sm px-3 py-1 rounded-full transition-opacity hover:opacity-80"
            style={{
              background: "rgba(255,255,255,0.08)",
              color: "#aaa",
              border: "1px solid rgba(255,255,255,0.12)",
            }}
          >
            Add
          </a>
        </div>
      </div>

      {/* ── Recipe sidebar (right, pin click) ── */}
      {selectedPin && (() => {
        const cover = getCoverImageUrl(supabaseUrl, selectedPin.cover_image_path);
        return (
          <div
            className="absolute top-0 right-0 bottom-0 w-80 overflow-y-auto flex flex-col"
            style={{
              zIndex: 26,
              background: "rgba(15,15,15,0.96)",
              backdropFilter: "blur(12px)",
              borderLeft: "1px solid #2e2e2e",
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-4 sticky top-0"
              style={{ background: "rgba(15,15,15,0.98)", borderBottom: "1px solid #2e2e2e" }}
            >
              <div>
                <p className="text-xs uppercase tracking-widest mb-0.5" style={{ color: "#e8a838" }}>
                  📍 {selectedPin.location_name}
                </p>
                <h2 className="font-bold text-base leading-tight" style={{ color: "#f5f0e8" }}>
                  {selectedPin.title}
                </h2>
              </div>
              <button
                onClick={() => setSelectedPin(null)}
                className="text-xl leading-none rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 ml-2"
                style={{ color: "#aaa", background: "#2e2e2e" }}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {/* Cover image */}
            {cover && (
              <div className="relative w-full" style={{ aspectRatio: "16/9", flexShrink: 0 }}>
                <Image
                  src={cover}
                  alt={selectedPin.title}
                  fill
                  className="object-cover"
                  sizes="320px"
                />
              </div>
            )}

            {/* Body */}
            <div className="flex-1 p-5 flex flex-col gap-5">
              {!cover && (
                <div
                  className="w-full rounded-xl flex items-center justify-center text-4xl"
                  style={{ height: 140, background: "#1a1a1a" }}
                >
                  🍽️
                </div>
              )}

              {/* AI dish info — plain text, no card */}
              {dishInfo && (
                <div className="flex flex-col gap-3">
                  {dishInfo.loading ? (
                    <div className="flex items-center gap-1.5">
                      {[0, 0.15, 0.3].map((delay, i) => (
                        <span
                          key={i}
                          className="inline-block w-1.5 h-1.5 rounded-full animate-bounce"
                          style={{ background: "#555", animationDelay: `${delay}s` }}
                        />
                      ))}
                    </div>
                  ) : dishInfo.description ? (
                    <>
                      <p className="text-sm leading-relaxed" style={{ color: "#bbb" }}>
                        {dishInfo.description}
                      </p>
                      {dishInfo.cost && (
                        <p className="text-sm" style={{ color: "#888" }}>
                          <span style={{ color: "#e8a838" }}>Est. cost</span> {dishInfo.cost}
                        </p>
                      )}
                    </>
                  ) : dishInfo.error ? null : null}
                </div>
              )}

              <a
                href={`/recipe/${selectedPin.slug}`}
                className="block w-full text-center py-3 rounded-xl font-semibold text-sm transition-opacity hover:opacity-80 mt-auto"
                style={{ background: "#e8a838", color: "#0a0a0a" }}
              >
                View Recipe →
              </a>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
