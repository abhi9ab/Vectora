import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import Exa from "exa-js"
import { ImageAnnotatorClient } from '@google-cloud/vision';

export const exa = new Exa(process.env.EXA_SEARCH_API_KEY || "");

export const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY
});

export const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

export const visionClient = new ImageAnnotatorClient({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});