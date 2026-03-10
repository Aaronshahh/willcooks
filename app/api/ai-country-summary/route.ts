import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const GROQ_MODEL = "llama-3.1-8b-instant";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function GET(request: NextRequest) {
  const country = request.nextUrl.searchParams.get("country")?.trim();
  if (!country) {
    return Response.json({ error: "country param required" }, { status: 400 });
  }

  // Check if Will has written a manual description for this country first.
  // Case-insensitive match via ilike.
  const supabase = await createClient();
  const { data: manual } = await supabase
    .from("countries")
    .select("description")
    .ilike("name", country)
    .maybeSingle();

  if (manual?.description?.trim()) {
    return Response.json({ summary: manual.description.trim(), manual: true });
  }

  // Fall back to Groq AI generation.
  const token = process.env.GROQ_API_KEY;
  if (!token) {
    return Response.json({ summary: null, noToken: true });
  }

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
          messages: [
            {
              role: "user",
              content: `In 2-3 sentences, describe the cuisine and most famous dishes of ${country}. Focus on flavours, ingredients, and iconic meals. Be concise.`,
            },
          ],
          max_tokens: 150,
          temperature: 0.7,
        }),
        signal: AbortSignal.timeout(15000),
      });
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        if (attempt < delays.length - 1) continue;
        return Response.json({ summary: null, error: "Request timed out — try again." });
      }
      return Response.json({ summary: null, error: String(err) });
    }

    if (res.status === 429) {
      if (attempt < delays.length - 1) {
        const retryAfter = res.headers.get("Retry-After");
        delays[attempt + 1] = retryAfter
          ? Math.min(parseInt(retryAfter, 10) * 1000, 8000)
          : delays[attempt + 1];
        continue;
      }
      return Response.json({ summary: null, rateLimited: true });
    }

    if (!res.ok) {
      return Response.json({ summary: null, error: `Groq API returned ${res.status}` });
    }

    const data = await res.json();
    const text: string | null = data?.choices?.[0]?.message?.content?.trim() ?? null;
    return Response.json({ summary: text ?? null });
  }

  return Response.json({ summary: null, rateLimited: true });
}
