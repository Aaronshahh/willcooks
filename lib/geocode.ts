export interface GeocodeResult {
  lat: number;
  lng: number;
  displayName: string;
  country: string | null;
}

/**
 * Geocodes a location string to lat/lng + country using OpenStreetMap Nominatim.
 * Free, no API key. addressdetails=1 gives us the clean country name.
 */
export async function geocodeLocation(
  locationName: string
): Promise<GeocodeResult | null> {
  const encoded = encodeURIComponent(locationName);
  const url = `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=1&addressdetails=1`;

  const res = await fetch(url, {
    headers: {
      "User-Agent": "WillCooksBlog/1.0 (willcooks.vercel.app)",
    },
  });

  if (!res.ok) return null;

  const data = await res.json();
  if (!data || data.length === 0) return null;

  const item = data[0];

  // Nominatim addressdetails gives a nested address object with country key
  const country: string | null = item.address?.country ?? null;

  return {
    lat: parseFloat(item.lat),
    lng: parseFloat(item.lon),
    displayName: item.display_name,
    country,
  };
}
