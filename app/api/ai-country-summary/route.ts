import { NextRequest } from "next/server";

export const runtime = "nodejs";

// Groq free tier: 30 req/min, 14,400 req/day — no credit card needed.
// Get a free key at https://console.groq.com
const GROQ_MODEL = "llama-3.1-8b-instant";

export async function GET(request: NextRequest) {
  const country = request.nextUrl.searchParams.get("country")?.trim();
  if (!country) {
    return Response.json({ error: "country param required" }, { status: 400 });
  }

  const token = process.env.GROQ_API_KEY;
  if (!token) {
    return Response.json({ summary: null, noToken: true });
  }

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
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

    if (res.status === 429) {
      return Response.json({ summary: null, rateLimited: true });
    }

    if (!res.ok) {
      return Response.json({ summary: null, error: `Groq API returned ${res.status}` });
    }

    const data = await res.json();
    const text: string | null = data?.choices?.[0]?.message?.content?.trim() ?? null;
    return Response.json({ summary: text ?? null });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return Response.json({ summary: null, error: "Request timed out — try again." });
    }
    return Response.json({ summary: null, error: String(err) });
  }
}
