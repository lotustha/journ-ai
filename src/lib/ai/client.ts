import { GoogleGenAI } from "@google/genai";

// Access the key securely from the server environment
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("Missing GEMINI_API_KEY in .env file");
}

export const aiClient = new GoogleGenAI({ apiKey });
