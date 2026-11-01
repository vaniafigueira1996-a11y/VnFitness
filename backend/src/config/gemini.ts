import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY || '';

if (!apiKey) {
  console.warn('⚠️ AVISO: GEMINI_API_KEY não configurada no arquivo .env');
}

export const genAI = new GoogleGenerativeAI(apiKey);
