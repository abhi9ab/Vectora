/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextResponse } from "next/server";
import { generateObject } from 'ai';
import { z } from "zod";
import { groq, google, openai } from '@/services/model-services';
import { GROQ_MODELS, GOOGLE_MODELS, HYBRID_MODELS, OPENAI_MODELS } from '@/services/constants';

const clarifyResearchGoals = async (
  topic: string,
  modelProvider: string,
  useRAG: boolean,
  hasImages: boolean
) => {
  let model;
  let provider;

  console.log(`Generating questions with provider: ${modelProvider}`);
  console.log(`RAG enabled: ${useRAG}, Has images: ${hasImages}`);

  if (modelProvider === 'google') {
    model = google(GOOGLE_MODELS.PLANNING);
    provider = 'google';
  } else if (modelProvider === 'groq') {
    // Specify a more capable model for OpenRouter
    model = groq(GROQ_MODELS.PLANNING);
    provider = 'groq';
    console.log(`Selected Groq model: ${GROQ_MODELS.PLANNING}`);
  } else if (modelProvider === 'openai') {
    model = openai(OPENAI_MODELS.PLANNING);
    provider = 'openai';
  } else { // hybrid
    model = google(HYBRID_MODELS.PLANNING); // Use Google for planning in hybrid mode
    provider = 'google';
  }

  let prompt = `
    Given the research topic: "${topic}"
    `;

  if (useRAG) {
    prompt += `
      Note: This research will be enhanced with a knowledge base (RAG) of previously stored information.
      `;
  }

  if (hasImages) {
    prompt += `
      Note: Images have been provided with this topic and will be analyzed as part of the research.
      `;
  }

  prompt += `
    Generate 2-4 clarifying questions to help narrow down the research scope. Focus on identifying:
    - Specific aspects of interest
    - Required depth/complexity level
    - Any particular perspective or approach
    - Potential limitations or boundaries for the research
    
    DO NOT echo back the original topic. Generate new, insightful questions.
    `;

  try {
    const { object } = await generateObject({
      model: model,
      prompt,
      schema: z.object({
        questions: z.array(z.string())
      })
    });

    return object.questions;
  } catch (error) {
    console.log("Error while generating questions: ", error);
    throw error;
  }
}

export async function POST(req: Request) {
  const {
    topic,
    modelProvider = "hybrid",
    embeddingProvider = "openai",
    useRAG = true,
    hasImages = false
  } = await req.json();

  console.log("Topic: ", topic);
  console.log("Using model provider: ", modelProvider);
  console.log("Using embedding provider: ", embeddingProvider);
  console.log("RAG enabled: ", useRAG);
  console.log("Has images: ", hasImages);

  try {
    const questions = await clarifyResearchGoals(topic, modelProvider, useRAG, hasImages);
    console.log("Questions: ", questions);

    return NextResponse.json(questions);
  } catch (error) {
    console.error("Error while generating questions: ", error);
    return NextResponse.json({
      success: false, error: "Failed to generate questions"
    }, { status: 500 });
  }
}