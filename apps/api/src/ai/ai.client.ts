import { GoogleGenAI } from '@google/genai';

let client: GoogleGenAI | null = null;

export const getAi = (): GoogleGenAI => {
  if (client) return client;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not defined');
  }

  client = new GoogleGenAI({ apiKey });
  return client;
};
