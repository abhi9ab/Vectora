/* eslint-disable @typescript-eslint/no-unused-vars */
import { generateObject, generateText } from "ai";
import { openrouter, google, openai, visionClient } from "./model-services";
import { ActivityTracker, ImageData, ModelCallOptions, ResearchState } from "@/types/types";
import { GOOGLE_MODELS, HYBRID_MODELS, MAX_RETRY_ATTEMPTS, RETRY_DELAY_MS, OPENAI_MODELS, OPENROUTER_MODELS } from "./constants";
import { delay } from "./utils";

export async function callModel<T>({
  model,
  prompt,
  system,
  schema,
  activityType = "generate",
  provider = "hybrid",
  structuredOutput = true,
  images = []
}: ModelCallOptions<T>,
  researchState: ResearchState, activityTracker: ActivityTracker): Promise<T | string> {

  let attempts = 0;
  let lastError: Error | null = null;

  const providerToUse = researchState.provider || provider;

  console.log(`Model call initiated with provider: ${providerToUse}`);

  let actualProvider = providerToUse;
  if (providerToUse === "hybrid") {
    if (model === HYBRID_MODELS.EXTRACTION || model === HYBRID_MODELS.ANALYSIS) {
      actualProvider = "openai";
    } else {
      actualProvider = "google";
    }
  }

  console.log(`Model call: Using ${actualProvider} provider with model: ${model}`);

  let modelToUse = model;
  if (actualProvider === "google" && (model.includes("gpt-") || model.includes("openai/"))) {
    console.error("Error: Attempted to use OpenAI model name with Google provider");
    console.log("Switching to appropriate Google model instead");

    if (model.includes("gpt-4o-mini") || model === "gpt-4o-mini") {
      modelToUse = GOOGLE_MODELS.EXTRACTION;
    } else if (model.includes("gpt-4o") || model === "gpt-4o") {
      modelToUse = GOOGLE_MODELS.PLANNING;
    } else {
      modelToUse = GOOGLE_MODELS.REPORT;
    }
  } else if (actualProvider === "openai" && model.includes("openai/")) {
    modelToUse = model.replace("openai/", "");
  }

  while (attempts < MAX_RETRY_ATTEMPTS) {
    try {
      if (images && images.length > 0) {
        try {
          console.log("Processing images using Google Cloud Vision API");
          activityTracker.add("image-analysis", "pending", `Analyzing ${images.length} images with Cloud Vision API`);

          const visionResults = [];

          for (const image of images) {
            const imageName = image.name || 'unnamed-image';
            activityTracker.add("image-analysis", "pending", `Processing image: ${imageName}`);

            const [result] = await visionClient.annotateImage({
              image: {
                content: image.base64
              },
              features: [
                { type: 'TEXT_DETECTION' },
                { type: 'LABEL_DETECTION' },
                { type: 'OBJECT_LOCALIZATION' },
                { type: 'IMAGE_PROPERTIES' },
                { type: 'SAFE_SEARCH_DETECTION' },
                { type: 'FACE_DETECTION' }
              ]
            });

            visionResults.push({
              imageName: imageName,
              text: result.fullTextAnnotation?.text || '',
              labels: result.labelAnnotations?.map(label => ({
                description: label.description,
                score: label.score
              })) || [],
              objects: result.localizedObjectAnnotations?.map(obj => ({
                name: obj.name,
                score: obj.score
              })) || [],
              properties: result.imagePropertiesAnnotation?.dominantColors?.colors || [],
              safeSearch: result.safeSearchAnnotation || {},
              faces: result.faceAnnotations?.length || 0
            });

            activityTracker.add("image-analysis", "complete", `Processed image: ${imageName}`);
          }

          activityTracker.add("image-analysis", "pending", "Interpreting Vision API results");
          const visionAnalysisPrompt = `
          I've analyzed ${images.length} image(s) with Google Cloud Vision API and need to interpret the results for research on: "${researchState.topic}"
          
          Here are the detailed vision analysis results:
          ${JSON.stringify(visionResults, null, 2)}
          
          Please provide a comprehensive analysis of these images in the context of the research topic.
          Focus on the text detected, objects identified, and any other relevant visual information.
          Explain how these images relate to or inform the research topic.
          `;

          let analysisModel;
          let result;

          console.log(`Selecting model for image analysis with provider: ${actualProvider}`);

          if (actualProvider === "google") {
            analysisModel = GOOGLE_MODELS.ANALYSIS;
            result = await generateText({
              model: google(analysisModel),
              prompt: visionAnalysisPrompt,
              system: "You are an expert image analyst interpreting Google Cloud Vision API results."
            });
          }
          else if (actualProvider === "openai") {
            analysisModel = OPENAI_MODELS.ANALYSIS;
            result = await generateText({
              model: openai(analysisModel),
              prompt: visionAnalysisPrompt,
              system: "You are an expert image analyst interpreting Google Cloud Vision API results."
            });
          }
          else if (actualProvider === "openrouter") {
            analysisModel = OPENROUTER_MODELS.ANALYSIS;
            result = await generateText({
              model: openrouter(analysisModel),
              prompt: visionAnalysisPrompt,
              system: "You are an expert image analyst interpreting Google Cloud Vision API results."
            });
          }
          else {
            analysisModel = GOOGLE_MODELS.ANALYSIS;
            result = await generateText({
              model: google(analysisModel),
              prompt: visionAnalysisPrompt,
              system: "You are an expert image analyst interpreting Google Cloud Vision API results."
            });
          }

          const { text, usage } = result;
          researchState.tokenUsed += usage?.totalTokens || 2000;
          researchState.completedSteps++;

          activityTracker.add("image-analysis", "complete", "Completed image analysis");

          return schema ? { summary: text } as unknown as T : text;
        } catch (error: unknown) {
          const imageError = error as Error;
          console.error("Error in Cloud Vision processing:", imageError);
          activityTracker.add("image-analysis", "error", `Failed to process images: ${imageError.message}`);

          activityTracker.add("image-analysis", "warning", "Continuing research without image analysis");
          return schema ?
            { summary: "Image analysis failed. Continuing research based on text only." } as unknown as T :
            "Image analysis failed. Continuing research based on text only.";
        }
      }

      if (schema) {
        console.log(`Calling model with provider: ${actualProvider}, model: ${modelToUse}`);

        let result;
        if (actualProvider === "google") {
          result = await generateObject({
            model: google(modelToUse),
            prompt,
            system,
            schema: schema,
            ...(providerToUse === "google" ? { structuredOutput } : {})
          });
        } else if (actualProvider === "openrouter") {
          result = await generateObject({
            model: openrouter(modelToUse),
            prompt,
            system,
            schema
          });
        } else if (actualProvider === "openai") {
          result = await generateObject({
            model: openai(modelToUse),
            prompt,
            system,
            schema
          });
        } else {
          throw new Error(`Unknown provider: ${actualProvider}`);
        }

        const { object, usage } = result;
        researchState.tokenUsed += usage?.totalTokens || 0;
        researchState.completedSteps++;

        return object;
      } else {
        let result;
        if (actualProvider === "google") {
          result = await generateText({
            model: google(modelToUse),
            prompt,
            system
          });
        } else if (actualProvider === "openrouter") {
          result = await generateText({
            model: openrouter(modelToUse),
            prompt,
            system
          });
        } else if (actualProvider === "openai") {
          result = await generateText({
            model: openai(modelToUse),
            prompt,
            system
          });
        } else {
          throw new Error(`Unknown provider: ${actualProvider}`);
        }

        const { text, usage } = result;
        researchState.tokenUsed += usage?.totalTokens || 0;
        researchState.completedSteps++;

        return text;
      }
    } catch (error) {
      console.error("Model call error:", {
        provider: actualProvider,
        model: modelToUse,
        error: error instanceof Error ? error.message : String(error)
      });

      attempts++;
      lastError = error instanceof Error ? error : new Error('Unknown error');

      if (attempts < MAX_RETRY_ATTEMPTS) {
        activityTracker.add(activityType, 'warning', `Model call failed, attempt ${attempts}/${MAX_RETRY_ATTEMPTS}. Retrying...`);
      }
      await delay(RETRY_DELAY_MS * attempts);
    }
  }

  throw lastError || new Error(`Failed after ${MAX_RETRY_ATTEMPTS} attempts!`);
}