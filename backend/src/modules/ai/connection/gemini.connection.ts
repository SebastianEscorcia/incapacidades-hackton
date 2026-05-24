import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY || '';

if (!apiKey) {
  console.warn('Advertencia: GEMINI_API_KEY no está definida en las variables de entorno.');
}

export const genAI = new GoogleGenerativeAI(apiKey);