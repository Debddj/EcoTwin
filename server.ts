/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

// Load environmental variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Enable JSON bodies with higher limits for base64 images
app.use(express.json({ limit: '10mb' }));

// Helper for lazy loading Gemini API safely without crashing on startup
let geminiClientCache: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
    throw new Error('GEMINI_API_KEY is not configured. Please define it in your Secrets / Settings menu.');
  }
  if (!geminiClientCache) {
    geminiClientCache = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClientCache;
}

// 1.spend-based OCR & Text categorization endpoint using Gemini-3.5-flash
app.post('/api/classify-receipt', async (req, res) => {
  try {
    const { receiptText, imageBase64, imageMime } = req.body;
    const ai = getGeminiClient();

    let contents: any[] = [];

    if (imageBase64 && imageMime) {
      // Multimodal categorization from receipt photo
      contents.push({
        inlineData: {
          mimeType: imageMime,
          data: imageBase64,
        }
      });
      contents.push({
        text: `You are an expert carbon spending classifier. Extract transactions details from this receipt photo.
Categorize the item into exactly one of these categories:
- 'Fuel' (gasoline, shell, Exxon, chevron, car refueling)
- 'Flights' (airline tickets, jet, travel routes)
- 'Groceries' (supermarket, food ingredients, whole foods, organic)
- 'Fast Fashion' (Zara, H&M, high-street apparel chains, clothing boutiques)
- 'Utilities' (municipal electric, water bill, gas utility)
- 'Public Transit' (subway, bus, rail ticket, BART, clipper)
- 'Restaurants & Services' (burger joint, dining out, cafe, barbershop, normal utilities)
- 'Entertainment' (Netflix, cinema, streaming, recreation)
- 'Eco Goods' (thrift store, organic certified products, solar energy panel investments, recycled repairs)

Also extract the store/merchant name, transaction date, and the total spent amount. Evaluate structural confidence (0.0 to 1.0).`
      });
    } else if (receiptText) {
      // Text-based OCR parsing fallback
      contents.push({
        text: `Analyze this raw receipt text:
"""
${receiptText}
"""

Extract:
1. Store / Merchant Name
2. Total amount spent (number)
3. Date of transaction (YYYY-MM-DD format if found, otherwise defaulting to '2026-06-20')
4. Categorize precisely into one of: 'Fuel', 'Flights', 'Groceries', 'Fast Fashion', 'Utilities', 'Public Transit', 'Restaurants & Services', 'Entertainment', 'Eco Goods'
5. Confidence value between 0.0 and 1.0 based on clarity.`
      });
    } else {
       res.status(400).json({ error: 'Please select or capture a receipt image, or type text transcript.' });
       return;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: contents,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            merchant: { type: Type.STRING, description: 'Merchant or brand name' },
            amount: { type: Type.NUMBER, description: 'Total price or amount paid as numeric value' },
            date: { type: Type.STRING, description: 'Date of transaction formatted as YYYY-MM-DD' },
            category: { 
              type: Type.STRING, 
              description: 'Transaction category', 
              enum: ['Fuel', 'Flights', 'Groceries', 'Fast Fashion', 'Utilities', 'Public Transit', 'Restaurants & Services', 'Entertainment', 'Eco Goods']
            },
            confidence: { type: Type.NUMBER, description: 'Confidence probability from 0.0 to 1.0' }
          },
          required: ['merchant', 'amount', 'category', 'confidence']
        }
      }
    });

    const textOutput = response.text;
    if (!textOutput) {
      throw new Error('Gemini output payload was empty');
    }

    const parsed = JSON.parse(textOutput.trim());
    res.json({ success: true, result: parsed });

  } catch (error: any) {
    console.error('OCR classification failed:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'An error occurred while calling the Gemini API' 
    });
  }
});

// 2. EcoCoach AI-powered carbon coach chat endpoint
app.post('/api/ecocoach', async (req, res) => {
  try {
    const { messages, transactionHistory } = req.body;
    const ai = getGeminiClient();

    // Compile spending statistics to feed the EcoCoach Context
    const totalsByCategory: Record<string, number> = {};
    let totalSpent = 0;
    let totalCO2 = 0;
    
    transactionHistory.forEach((t: any) => {
      totalsByCategory[t.category] = (totalsByCategory[t.category] || 0) + (t.amount || 0);
      totalSpent += t.amount || 0;
      totalCO2 += t.co2e || 0;
    });

    const categoryBreakdownText = Object.entries(totalsByCategory)
      .map(([cat, amt]) => `- ${cat}: $${amt.toFixed(2)}`)
      .join('\n');

    const systemPrompt = `You are EcoCoach, a witty, brilliant environmental advisor. You speak directly to the user's spending behavior with real, actionable, and non-judgmental advice.
The user has connected their accounts & uploaded transactions. 
Here is their actual direct emission profile:
- Total Transactions: ${transactionHistory.length}
- Total Spend: $${totalSpent.toFixed(2)}
- Calculated CO2e Footprint: ${totalCO2.toFixed(1)} kgCO2e
Breakdown:
${categoryBreakdownText}

Guidelines:
1. Always base your suggestions on their ACTUAL transactions list. Give highly practical examples (e.g. mention specific retailers from their history like Whole Foods, Zara, or Shell if present!).
2. Be supportive, humorous, and educational. Avoid making them feel guilty, instead motivate them with viscerally real rewards (e.g. "Skipping one Zara polyester haul will save 45 kgCO2, which is equivalent to letting your neighborhood tree grow peacefully for 2 years!").
3. Make references to their current "EcoTwin Status" based on overall spend factors. Keep comments short, bulleted, and very readable. Do not produce long academic essays.`;

    // Format previous messages for GenAI chats.
    const chat = ai.chats.create({
      model: 'gemini-3.5-flash',
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.8
      }
    });

    // Send chat messages sequentially
    let lastResponseContent = "";
    if (messages && messages.length > 0) {
      // Re-hydrate conversation by looping through, sending last message as active trigger
      // To keep it clean, we take the last user message and trigger sendMessage
      const lastUserMsg = messages[messages.length - 1];
      
      // Provide conversational history context as a single prompt block to let Gemini read it, or use historical context
      const chatContext = messages.map((m: any) => `${m.role === 'user' ? 'User' : 'Coach'}: ${m.content}`).join('\n');
      const activePrompt = `Conversation History:\n${chatContext}\n\nRespond to the latest prompt: "${lastUserMsg.content}" contextually. Keep your reply concise (around 100-150 words).`;

      const gResponse = await chat.sendMessage({ message: activePrompt });
      lastResponseContent = gResponse.text || "I was unable to analyze this. Re-prompt me!";
    } else {
      // Welcome message
      const gResponse = await chat.sendMessage({ message: "Hello! Give me a quick greeting and introduction summary of my carbon spend profile!" });
      lastResponseContent = gResponse.text || "Hello! Ready to coach you on your footprint profile.";
    }

    res.json({ success: true, answer: lastResponseContent });

  } catch (error: any) {
    console.error('EcoCoach chat failed:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'EcoCoach was temporarily unavailable. Check your Gemini API Key.' 
    });
  }
});

// Serve assets in development vs production
async function setupViteMiddleware() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`EcoTwin Server booting on http://0.0.0.0:${PORT}`);
  });
}

setupViteMiddleware();
