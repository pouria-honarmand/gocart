import authSeller from "@/middlewares/authSeller";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
});

async function main(base64Image, mimeType) {
  // Gemini doesn't support 'type: image_url', so we send image in content
  const messages = [
    {
      role: "system",
      content: `You are a product listing assistant for an e-commerce store.

Analyze an image of a product (provided as base64) and return structured JSON ONLY:

{
  "name": "string - short product name",
  "description": "string - marketing-friendly description of the product"
}`,
    },
    {
      role: "user",
      content: `Analyze this product image: data:${mimeType};base64,${base64Image}`,
    },
  ];

  const response = await openai.chat.completions.create({
    model: "gemini-2.0-flash",
    messages,
  });

  const raw = response.choices[0].message?.content;

  if (!raw) throw new Error("No content returned from AI");

  const cleaned = raw.replace(/```json|```/g, "").trim();

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    throw new Error("AI did not return valid JSON");
  }
}

export async function POST(request) {
  try {
    const { userId } = getAuth(request);
    if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const isSeller = await authSeller(userId);
    if (!isSeller) return NextResponse.json({ error: "Not authorized" }, { status: 401 });

    const { base64Image, mimeType } = await request.json();
    const result = await main(base64Image, mimeType);

    return NextResponse.json(result);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.message || error }, { status: 400 });
  }
}
