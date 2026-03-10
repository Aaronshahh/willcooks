import { NextRequest } from "next/server";

export const runtime = "nodejs";

const GROQ_MODEL = "llama-3.1-8b-instant";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function GET(request: NextRequest) {
  const dish = request.nextUrl.searchParams.get("dish")?.trim();
  if (!dish) {
    return Response.json({ error: "dish param required" }, { status: 400 });
  }

  const token = process.env.GROQ_API_KEY;
  if (!token) {
    return Response.json({ description: null, cost: null, noToken: true });
  }

  const prompt = `You are a concise culinary assistant. Reply with valid JSON only — no markdown, no extra text.

Dish: "${dish}"

JSON format:
{
  "description": "2–3 sentence description of the dish: its origin, key ingredients, and flavour profile.",
  "cost": "Estimated cost to make this dish at home for 2 people (e.g. $8–$12)."
}`;

  const delays = [0, 4000, 8000];
  for (let attempt = 0; attempt < delays.length; attempt++) {
    if (delays[attempt] > 0) await sleep(delays[attempt]);

    let res: Response;
    try {
      res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://willcooks.vercel.app",
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: [{ role: "user", content: prompt }],
          max_tokens: 200,
          temperature: 0.6,
        }),
        signal: AbortSignal.timeout(15000),
      });
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        if (attempt < delays.length - 1) continue;
        return Response.json({ description: null, cost: null, error: "Request timed out." });
      }
      return Response.json({ description: null, cost: null, error: String(err) });
    }

    if (res.status === 429) {
      if (attempt < delays.length - 1) {
        const retryAfter = res.headers.get("Retry-After");
        delays[attempt + 1] = retryAfter
          ? Math.min(parseInt(retryAfter, 10) * 1000, 8000)
          : delays[attempt + 1];
        continue;
      }
      return Response.json({ description: null, cost: null, rateLimited: true });
    }

    if (!res.ok) {
      return Response.json({ description: null, cost: null, error: `Groq returned ${res.status}` });
    }

    const data = await res.json();
    const raw: string = data?.choices?.[0]?.message?.content?.trim() ?? "";

    // Strip any accidental markdown fences before parsing
    const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
    try {
      const parsed = JSON.parse(cleaned);
      return Response.json({
        description: (parsed.description as string) ?? null,
        cost: (parsed.cost as string) ?? null,
      });
    } catch {
      // Fallback: return the raw text as description if JSON parse fails
      return Response.json({ description: raw || null, cost: null });
    }
  }

  return Response.json({ description: null, cost: null, rateLimited: true });
}
