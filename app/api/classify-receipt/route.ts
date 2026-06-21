import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { ClassifyReceiptSchema } from "@/lib/validations/schemas";

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
    const parseResult = ClassifyReceiptSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: parseResult.error.issues[0]?.message || "Invalid request body." },
        { status: 400 }
      );
    }
    const { receiptText, imageBase64, imageMime } = parseResult.data;

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Using gemini-1.5-flash which is widely compatible and fast
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            merchant: { type: SchemaType.STRING, description: "Merchant or brand name (e.g. Whole Foods, Shell, Zara)" },
            amount: { type: SchemaType.NUMBER, description: "Total price or amount paid as numeric value" },
            date: { type: SchemaType.STRING, description: "Date of transaction formatted as YYYY-MM-DD" },
            category: { 
              type: SchemaType.STRING, 
              description: "Transaction category mapping exactly to one of: Fuel, Flights, Groceries, Fast Fashion, Utilities, Public Transit, Restaurants & Services, Entertainment, Eco Goods" 
            },
            confidence: { type: SchemaType.NUMBER, description: "Confidence probability from 0.0 to 1.0 based on extraction clarity" }
          },
          required: ["merchant", "amount", "date", "category", "confidence"]
        }
      }
    });

    const contents: (string | { inlineData: { data: string; mimeType: string } })[] = [];

    if (imageBase64 && imageMime) {
      let cleanBase64 = imageBase64;
      if (cleanBase64.includes(",")) {
        cleanBase64 = cleanBase64.split(",")[1] ?? "";
      }

      contents.push({
        inlineData: {
          data: cleanBase64 || "",
          mimeType: imageMime as string
        }
      });
      contents.push(
        "You are an expert carbon spending classifier. Extract transaction details from this receipt photo. " +
        "Categorize the item into exactly one of the supported categories: " +
        "Fuel, Flights, Groceries, Fast Fashion, Utilities, Public Transit, Restaurants & Services, Entertainment, Eco Goods. " +
        "Extract store/merchant name, date, and total spent. Evaluate structural confidence (0.0 to 1.0)."
      );
    } else if (receiptText) {
      contents.push(
        `Analyze this raw receipt text:\n"""\n${receiptText}\n"""\n\n` +
        "Extract:\n" +
        "1. Store / Merchant Name\n" +
        "2. Total amount spent (number)\n" +
        "3. Date of transaction (YYYY-MM-DD format if found, otherwise defaulting to today's date)\n" +
        "4. Categorize precisely into one of the categories: Fuel, Flights, Groceries, Fast Fashion, Utilities, Public Transit, Restaurants & Services, Entertainment, Eco Goods.\n" +
        "5. Confidence value between 0.0 and 1.0 based on clarity."
      );
    } else {
      return NextResponse.json(
        { success: false, error: "Please provide either 'receiptText' or base64 image data." },
        { status: 400 }
      );
    }

    const response = await model.generateContent(contents);
    const textResponse = response.response.text();

    if (!textResponse) {
      throw new Error("Gemini output payload was empty");
    }

    const result = JSON.parse(textResponse.trim());
    return NextResponse.json({ success: true, result });
  } catch (err) {
    console.error("Receipt OCR classification failed:", err);
    const errMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: errMsg || "An error occurred during OCR classification." }, { status: 500 });
  }
}
