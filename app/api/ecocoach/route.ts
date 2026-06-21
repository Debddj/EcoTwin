import { NextRequest } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { EcoCoachRequestSchema } from "@/lib/validations/schemas";

const IN_MEMORY_REQUESTS = new Map<string, number[]>();

function rateLimit(ip: string, max = 10, windowMs = 60_000): boolean {
  const now = Date.now();
  const reqs = (IN_MEMORY_REQUESTS.get(ip) ?? []).filter(
    (t) => now - t < windowMs
  );
  if (reqs.length >= max) return false;
  IN_MEMORY_REQUESTS.set(ip, [...reqs, now]);
  return true;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  if (!rateLimit(ip)) {
    return new Response("Rate limit exceeded.", { status: 429 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return new Response("Server misconfiguration.", { status: 500 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON.", { status: 400 });
  }

  const parsed = EcoCoachRequestSchema.safeParse(body);
  if (!parsed.success) {
    return new Response("Invalid request body.", { status: 400 });
  }

  const { messages, transactionHistory } = parsed.data;

  const totalSpend = transactionHistory.reduce((s, t) => s + t.amount, 0);
  const totalCO2 = transactionHistory.reduce((s, t) => s + t.co2e, 0);
  const byCategory = transactionHistory.reduce<Record<string, number>>(
    (acc, t) => ({ ...acc, [t.category]: (acc[t.category] ?? 0) + t.amount }),
    {}
  );

  const breakdown = Object.entries(byCategory)
    .map(([cat, amt]) => `  - ${cat}: $${amt.toFixed(2)}`)
    .join("\n");

  const systemPrompt = `You are EcoCoach, an expert environmental advisor with deep knowledge of carbon accounting and behavioral economics. You're witty, encouraging, and data-driven — never preachy.

The user's REAL transaction data:
- Total spend: $${totalSpend.toFixed(2)} across ${transactionHistory.length} transactions
- Calculated footprint: ${totalCO2.toFixed(1)} kgCO₂e
- Breakdown by category:
${breakdown}

Your rules:
1. Reference SPECIFIC merchant names from their history (e.g. "Your Shell purchase on 06/19...").
2. Convert CO₂ savings into visceral comparisons ("= 12 days of breathing clean mountain air").
3. Keep responses under 150 words. Use bullet points for clarity.
4. Never repeat the same advice twice in a conversation.
5. Always end with one actionable quick win they can do TODAY.`;

  const genai = new GoogleGenerativeAI(apiKey);
  const model = genai.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: systemPrompt,
  });

  const lastMessage = messages[messages.length - 1];
  const userPrompt =
    lastMessage?.role === "user"
      ? lastMessage.content
      : "Greet me and give a quick summary of my carbon profile.";

  try {
    const result = await model.generateContentStream(userPrompt);

    // Stream the response — ChatGPT-like UX
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of result.stream) {
          const text = chunk.text();
          if (text) controller.enqueue(encoder.encode(text));
        }
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "no-cache",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "EcoCoach failed.";
    console.error("[ecocoach]", message);
    return new Response(message, { status: 500 });
  }
}
