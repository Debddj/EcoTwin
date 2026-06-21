import os
import base64
from typing import List, Optional, Literal
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from google import genai
from google.genai import types

# Load environmental variables from .env.local or .env
load_dotenv(dotenv_path=os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env.local'))
load_dotenv()

app = FastAPI(title="EcoTwin Backend", version="1.0.0")

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Lazy client initialization helper
def get_gemini_client() -> genai.Client:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key or api_key == "YOUR_GEMINI_API_KEY" or api_key.strip() == "":
        raise HTTPException(
            status_code=500,
            detail="GEMINI_API_KEY is not configured in backend environment variables."
        )
    # The new google-genai SDK uses genai.Client()
    return genai.Client(api_key=api_key)

# --------------------------------------------------------
# 1. Spend-Based OCR / Receipt Classification Models
# --------------------------------------------------------
TransactionCategory = Literal[
    'Fuel', 'Flights', 'Groceries', 'Fast Fashion', 'Utilities', 
    'Public Transit', 'Restaurants & Services', 'Entertainment', 'Eco Goods'
]

class ReceiptClassifyRequest(BaseModel):
    receiptText: Optional[str] = None
    imageBase64: Optional[str] = None
    imageMime: Optional[str] = None

class ReceiptClassificationResult(BaseModel):
    merchant: str = Field(description="Merchant or brand name (e.g. Whole Foods, Shell, Zara)")
    amount: float = Field(description="Total price or amount paid as numeric value")
    date: str = Field(description="Date of transaction formatted as YYYY-MM-DD")
    category: TransactionCategory = Field(description="Transaction category mapping exactly to one of the enum values")
    confidence: float = Field(description="Confidence probability from 0.0 to 1.0 based on extraction clarity")

@app.post("/api/classify-receipt")
async def classify_receipt(req: ReceiptClassifyRequest):
    try:
        client = get_gemini_client()
        contents = []

        # Handing multimodal image data
        if req.imageBase64 and req.imageMime:
            img_b64 = req.imageBase64
            if "," in img_b64:
                img_b64 = img_b64.split(",")[1]
            try:
                img_bytes = base64.b64decode(img_b64)
            except Exception as e:
                raise HTTPException(status_code=400, detail="Invalid base64 encoding for receipt photo.")
            
            contents.append(
                types.Part.from_bytes(
                    data=img_bytes,
                    mime_type=req.imageMime
                )
            )
            
            prompt = (
                "You are an expert carbon spending classifier. Extract transaction details from this receipt photo. "
                "Categorize the item into exactly one of the supported categories: "
                "Fuel, Flights, Groceries, Fast Fashion, Utilities, Public Transit, Restaurants & Services, Entertainment, Eco Goods. "
                "Extract store/merchant name, date, and total spent. Evaluate structural confidence (0.0 to 1.0)."
            )
            contents.append(prompt)

        # Handling textual fallback
        elif req.receiptText:
            prompt = (
                f"Analyze this raw receipt text:\n\"\"\"\n{req.receiptText}\n\"\"\"\n\n"
                "Extract:\n"
                "1. Store / Merchant Name\n"
                "2. Total amount spent (number)\n"
                "3. Date of transaction (YYYY-MM-DD format if found, otherwise defaulting to '2026-06-20')\n"
                "4. Categorize precisely into one of the categories: Fuel, Flights, Groceries, Fast Fashion, Utilities, Public Transit, Restaurants & Services, Entertainment, Eco Goods.\n"
                "5. Confidence value between 0.0 and 1.0 based on clarity."
            )
            contents.append(prompt)
        
        else:
            raise HTTPException(
                status_code=400,
                detail="Please provide either 'receiptText' or base64 image data."
            )

        # Generate content with structured JSON output targeting the Pydantic schema
        response = client.models.generate_content(
            model='gemini-3.5-flash',
            contents=contents,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=ReceiptClassificationResult,
                temperature=0.1 # Low temperature for consistent classification
            )
        )

        if not response.text:
            raise HTTPException(status_code=500, detail="Gemini output payload was empty")

        # Parse response into dictionary
        import json
        result = json.loads(response.text.strip())
        return {"success": True, "result": result}

    except HTTPException as he:
        raise he
    except Exception as e:
        print("Receipt OCR classification failed:", e)
        return {"success": False, "error": str(e)}

# --------------------------------------------------------
# 2. EcoCoach AI Carbon Chat Advisor Models
# --------------------------------------------------------
class ChatMessage(BaseModel):
    role: Literal['user', 'assistant']
    content: str

class TransactionItem(BaseModel):
    merchant: str
    amount: float
    category: str
    co2e: float

class EcoCoachRequest(BaseModel):
    messages: List[ChatMessage]
    transactionHistory: List[TransactionItem]

@app.post("/api/ecocoach")
async def eco_coach(req: EcoCoachRequest):
    try:
        client = get_gemini_client()

        # Compile spend statistics to feed into the Coach System context
        totals_by_category = {}
        total_spend = 0.0
        total_co2 = 0.0

        for tx in req.transactionHistory:
            totals_by_category[tx.category] = totals_by_category.get(tx.category, 0.0) + tx.amount
            total_spend += tx.amount
            total_co2 += tx.co2e

        category_breakdown_text = "\n".join(
            [f"- {cat}: ${amt:.2f}" for cat, amt in totals_by_category.items()]
        )

        system_prompt = (
            "You are EcoCoach, a witty, brilliant environmental advisor. You speak directly to the user's spending behavior with real, actionable, and non-judgmental advice.\n"
            "The user has connected their accounts & uploaded transactions.\n"
            "Here is their actual direct emission profile:\n"
            f"- Total Transactions: {len(req.transactionHistory)}\n"
            f"- Total Spend: ${total_spend:.2f}\n"
            f"- Calculated CO2e Footprint: {total_co2:.1f} kgCO2e\n"
            "Breakdown:\n"
            f"{category_breakdown_text}\n\n"
            "Guidelines:\n"
            "1. Always base your suggestions on their ACTUAL transactions list. Give highly practical examples (e.g. mention specific retailers from their history like Whole Foods, Zara, or Shell if present!).\n"
            "2. Be supportive, humorous, and educational. Avoid making them feel guilty, instead motivate them with viscerally real rewards (e.g. \"Skipping one Zara polyester haul will save 45 kgCO2, which is equivalent to letting your neighborhood tree grow peacefully for 2 years!\").\n"
            "3. Make references to their current \"EcoTwin Status\" based on overall spend factors. Keep comments short, bulleted, and very readable. Do not produce long academic essays."
        )

        # Single conversational instruction response hydrate
        if req.messages:
            last_msg = req.messages[-1]
            chat_context = "\n".join(
                [f"{'User' if m.role == 'user' else 'Coach'}: {m.content}" for m in req.messages]
            )
            active_prompt = (
                f"Conversation History:\n{chat_context}\n\n"
                f"Respond to the latest prompt: \"{last_msg.content}\" contextually. Keep your reply concise (around 100-150 words)."
            )
        else:
            active_prompt = "Hello! Give me a quick greeting and introduction summary of my carbon spend profile!"

        response = client.models.generate_content(
            model='gemini-3.5-flash',
            contents=active_prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_prompt,
                temperature=0.8
            )
        )

        answer = response.text or "I was unable to analyze this. Re-prompt me!"
        return {"success": True, "answer": answer}

    except Exception as e:
        print("EcoCoach chat failed:", e)
        return {"success": False, "error": str(e)}

if __name__ == "__main__":
    import uvicorn
    # Read port from env, defaulting to 8000
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
