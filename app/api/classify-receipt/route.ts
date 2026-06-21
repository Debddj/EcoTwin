import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ClassifyReceiptSchema, ClassifyResultSchema } from "@/lib/validations/schemas";
import type { ClassifyReceiptResult } from "@/types";

const IN_MEMORY_REQUESTS = new Map<string, number[]>();

function rateLimit(ip: string, max = 20, windowMs = 60_000): boolean {
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
    return NextResponse.json(
      { success: false, error: "Rate limit exceeded. Try again in a minute." },
      { status: 429 }
    );
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { success: false, error: "Server misconfiguration: API key missing." },
      { status: 500 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body." },
      { status: 400 }
    );
  }

  const parsed = ClassifyReceiptSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.flatten().formErrors[0] },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const genai = new GoogleGenerativeAI(apiKey);
  const model = genai.getGenerativeModel({ model: "gemini-1.5-flash" });

  const today = new Date().toISOString().split("T")[0]!;

  const SYSTEM_PROMPT = `You are an expert carbon-footprint classifier. Extract transaction details from the provided receipt and return ONLY a JSON object — no markdown, no explanation.

JSON format:
{
  "merchant": "string (store or brand name)",
  "amount": number (total paid, positive),
  "date": "YYYY-MM-DD (default to ${today} if unclear)",
  "category": "one of: Fuel | Flights | Groceries | Fast Fashion | Utilities | Public Transit | Restaurants & Services | Entertainment | Eco Goods",
  "confidence": number (0.0-1.0)
}`;

  try {
    const prompt =
      data.imageBase64 && data.imageMime
        ? [
            { inlineData: { data: data.imageBase64.split(",").pop()!, mimeType: data.imageMime } },
            SYSTEM_PROMPT,
          ]
        : `${SYSTEM_PROMPT}\n\nReceipt text:\n"""\n${data.receiptText}\n"""`;

    const result = await model.generateContent(prompt as Parameters<typeof model.generateContent>[0]);
    const text = result.response.text().trim().replace(/```json|```/g, "");
    const json: unknown = JSON.parse(text);
    const validated = ClassifyResultSchema.safeParse(json);

    if (!validated.success) {
      throw new Error("Gemini returned malformed data.");
    }

    const classifyResult: ClassifyReceiptResult = validated.data;
    return NextResponse.json({ success: true, result: classifyResult });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Classification failed.";
    console.error("[classify-receipt]", message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
