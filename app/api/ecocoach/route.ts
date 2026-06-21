import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "GEMINI_API_KEY is not configured in local environment variables." },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { messages, transactionHistory } = body;

    // Calculate aggregated statistics
    let totalSpend = 0;
    let totalCo2 = 0;
    const categoryTotals: Record<string, number> = {};

    if (transactionHistory && Array.isArray(transactionHistory)) {
      transactionHistory.forEach((tx: { merchant: string; amount: number; category: string; co2e: number }) => {
        const amount = Number(tx.amount || 0);
        const co2e = Number(tx.co2e || 0);
        const category = tx.category || "Eco Goods";

        totalSpend += amount;
        totalCo2 += co2e;
        categoryTotals[category] = (categoryTotals[category] || 0) + amount;
      });
    }

    const categoryBreakdownText = Object.entries(categoryTotals)
      .map(([cat, amt]) => `- ${cat}: $${amt.toFixed(2)}`)
      .join("\n");

    const systemPrompt = 
      "You are EcoCoach, a witty, brilliant environmental advisor. You speak directly to the user's spending behavior with real, actionable, and non-judgmental advice.\n" +
      "The user has connected their accounts & uploaded transactions.\n" +
      "Here is their actual direct emission profile:\n" +
      `- Total Transactions: ${transactionHistory?.length || 0}\n` +
      `- Total Spend: $${totalSpend.toFixed(2)}\n` +
      `- Calculated CO2e Footprint: ${totalCo2.toFixed(1)} kgCO2e\n` +
      "Breakdown:\n" +
      `${categoryBreakdownText || "- None yet"}\n\n` +
      "Guidelines:\n" +
      "1. Always base your suggestions on their ACTUAL transactions list. Give highly practical examples (e.g. mention specific retailers from their history if present!).\n" +
      "2. Be supportive, humorous, and educational. Avoid making them feel guilty, instead motivate them with viscerally real rewards (e.g. \"Skipping one fast fashion polyester haul will save 45 kgCO2, which is equivalent to letting your neighborhood tree grow peacefully for 2 years!\").\n" +
      "3. Make references to overall spend factors. Keep comments short, bulleted, and very readable. Do not produce long academic essays.";

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: systemPrompt,
    });

    let activePrompt = "";
    if (messages && messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      const chatContext = messages
        .map((m: { role: string; content: string }) => `${m.role === "user" ? "User" : "Coach"}: ${m.content}`)
        .join("\n");

      activePrompt = 
        `Conversation History:\n${chatContext}\n\n` +
        `Respond to the latest prompt: "${lastMsg.content}" contextually. Keep your reply concise (around 100-150 words).`;
    } else {
      activePrompt = "Hello! Give me a quick greeting and introduction summary of my carbon spend profile!";
    }

    const response = await model.generateContent(activePrompt);
    const answer = response.response.text() || "I was unable to analyze this. Re-prompt me!";

    return NextResponse.json({ success: true, answer });
  } catch (err) {
    console.error("EcoCoach chat failed:", err);
    const errMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: errMsg || "An error occurred with EcoCoach chatbot." }, { status: 500 });
  }
}
