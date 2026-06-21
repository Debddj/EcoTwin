import { z } from "zod";

const VALID_CATEGORIES = [
  "Fuel",
  "Flights",
  "Groceries",
  "Fast Fashion",
  "Utilities",
  "Public Transit",
  "Restaurants & Services",
  "Entertainment",
  "Eco Goods",
] as const;

export const ClassifyReceiptSchema = z
  .object({
    receiptText: z.string().min(1).max(4000).optional(),
    imageBase64: z.string().optional(),
    imageMime: z
      .enum(["image/jpeg", "image/png", "image/webp", "image/gif"])
      .optional(),
  })
  .refine(
    (d) => d.receiptText || (d.imageBase64 && d.imageMime),
    "Must provide either receiptText or imageBase64 + imageMime"
  );

export const ClassifyResultSchema = z.object({
  merchant: z.string(),
  amount: z.number().positive(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  category: z.enum(VALID_CATEGORIES),
  confidence: z.number().min(0).max(1),
});

export const CoachMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(2000),
});

export const TransactionItemSchema = z.object({
  merchant: z.string(),
  amount: z.number().positive(),
  category: z.string(),
  co2e: z.number().min(0),
});

export const EcoCoachRequestSchema = z.object({
  messages: z.array(CoachMessageSchema).max(50),
  transactionHistory: z.array(TransactionItemSchema).max(500),
});
