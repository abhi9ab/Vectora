/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  ActivityTracker,
  ImageData,
  ResearchFindings,
  ResearchState,
  SearchResult,
} from "@/types/types";
import { z } from "zod";
import {
  ANALYSIS_SYSTEM_PROMPT,
  EXTRACTION_SYSTEM_PROMPT,
  getAnalysisPrompt,
  getExtractionPrompt,
  getPlanningPrompt,
  getReportPrompt,
  PLANNING_SYSTEM_PROMPT,
  REPORT_SYSTEM_PROMPT,
} from "./prompts";
import { callModel } from "./model-caller";
import { exa } from "./model-services";
import { combineFindings, handleError } from "./utils";
import {
  MAX_CONTENT_CHARS,
  MAX_ITERATIONS,
  MAX_SEARCH_RESULTS,
  GROQ_MODELS,
  GOOGLE_MODELS,
  HYBRID_MODELS,
  OPENAI_MODELS
} from "./constants";

export async function generateSearchQueries(
  researchState: ResearchState,
  activityTracker: ActivityTracker
) {
  try {
    activityTracker.add("planning", "pending", "Planning the research");

    const provider = researchState.provider;
    console.log(`Provider in generateSearchQueries: ${provider}`);

    let modelConfig;
    if (provider === 'google') {
      modelConfig = GOOGLE_MODELS.PLANNING;
    } else if (provider === 'groq') {
      modelConfig = GROQ_MODELS.PLANNING;
    } else if (provider === 'openai') {
      modelConfig = OPENAI_MODELS.PLANNING;
    } else { // hybrid
      modelConfig = HYBRID_MODELS.PLANNING;
    }

    console.log(`Planning with ${provider} provider using model: ${modelConfig}`);

    const result = await callModel(
      {
        model: modelConfig,
        prompt: getPlanningPrompt(
          researchState.topic,
          researchState.clerificationsText
        ),
        system: PLANNING_SYSTEM_PROMPT,
        schema: z.object({
          searchQueries: z
            .array(z.string())
            .describe(
              "The search queries that can be used to find the most relevant content which can be used to write the comprehensive report on the given topic. (max 3 queries)"
            ),
        }),
        activityType: "planning",
        provider: provider
      },
      researchState, activityTracker
    );

    activityTracker.add("planning", "complete", "Crafted the research plan");
    console.log("Planning content result: ", result)
    return result;
  } catch (error) {
    return handleError(error, `Research planning`, activityTracker, "planning", {
      searchQueries: [`${researchState.topic} best practices`, `${researchState.topic} guidelines`, `${researchState.topic} examples`]
    })

  }
}

export async function search(
  query: string,
  researchState: ResearchState,
  activityTracker: ActivityTracker
): Promise<SearchResult[]> {

  activityTracker.add("search", "pending", `Searching for ${query}`);

  try {
    const searchResult = await exa.searchAndContents(query, {
      type: "keyword",
      numResults: MAX_SEARCH_RESULTS,
      startPublishedDate: new Date(
        Date.now() - 365 * 24 * 60 * 60 * 1000
      ).toISOString(),
      endPublishedDate: new Date().toISOString(),
      startCrawlDate: new Date(
        Date.now() - 365 * 24 * 60 * 60 * 1000
      ).toISOString(),
      endCrawlDate: new Date().toISOString(),
      excludeDomains: ["https://youtube.com"],
      text: {
        maxCharacters: MAX_CONTENT_CHARS,
      },
    });

    const filteredResults = searchResult.results
      .filter((r) => r.title && r.text !== undefined)
      .map((r) => ({
        title: r.title || "",
        url: r.url,
        content: r.text || "",
      }));

    researchState.completedSteps++;

    activityTracker.add("search", "complete", `Found ${filteredResults.length} results for ${query}`);


    return filteredResults;
  } catch (error) {
    console.log("error: ", error);
    return handleError(error, `Searching for ${query}`, activityTracker, "search", []) || []
  }
}

export async function extractContent(
  content: string,
  url: string,
  researchState: ResearchState,
  activityTracker: ActivityTracker
) {

  try {
    activityTracker.add("extract", "pending", `Extracting content from ${url}`);

    const provider = researchState.provider || "google";
    console.log(`Provider in extractContent: ${provider}`);

    let modelConfig;
    if (provider === 'google') {
      modelConfig = GOOGLE_MODELS.EXTRACTION;
    } else if (provider === 'groq') {
      modelConfig = GROQ_MODELS.EXTRACTION;
    } else if (provider === 'openai') {
      modelConfig = OPENAI_MODELS.EXTRACTION;
    } else { // hybrid
      modelConfig = HYBRID_MODELS.EXTRACTION;
    }

    console.log(`Extracting with ${provider} provider using model: ${modelConfig}`);

    const result = await callModel(
      {
        model: modelConfig,
        prompt: getExtractionPrompt(
          content,
          researchState.topic,
          researchState.clerificationsText
        ),
        system: EXTRACTION_SYSTEM_PROMPT,
        schema: z.object({
          summary: z.string().describe("A comprehensive summary of the content"),
        }),
        activityType: "extract",
        provider: researchState.provider
      },
      researchState, activityTracker
    );

    activityTracker.add("extract", "complete", `Extracted content from ${url}`);

    return {
      url,
      summary: (result as any).summary,
    };
  } catch (error) {
    return handleError(error, `Content extraction from ${url}`, activityTracker, "extract", null) || null
  }
}

export async function processSearchResults(
  searchResults: SearchResult[],
  researchState: ResearchState,
  activityTracker: ActivityTracker
): Promise<ResearchFindings[]> {
  const extractionPromises = searchResults.map((result) =>
    extractContent(result.content, result.url, researchState, activityTracker)
  );
  const extractionResults = await Promise.allSettled(extractionPromises);

  type ExtractionResult = { url: string; summary: string };

  const newFindings = extractionResults
    .filter(
      (result): result is PromiseFulfilledResult<ExtractionResult> =>
        result.status === "fulfilled" &&
        result.value !== null &&
        result.value !== undefined
    )
    .map((result) => {
      const { summary, url } = result.value;
      return {
        summary,
        source: url,
      };
    });

  return newFindings;
}

export async function analyzeFindings(
  researchState: ResearchState,
  currentQueries: string[],
  currentIteration: number,
  activityTracker: ActivityTracker
) {
  try {
    activityTracker.add("analyze", "pending", `Analyzing research findings (iteration ${currentIteration}) of ${MAX_ITERATIONS}`);
    const contentText = combineFindings(researchState.findings);

    const provider = researchState.provider || "google";
    console.log(`Provider in analyzeFindings: ${provider}`);

    let modelConfig;
    if (provider === 'google') {
      modelConfig = GOOGLE_MODELS.ANALYSIS;
    } else if (provider === 'groq') {
      modelConfig = GROQ_MODELS.ANALYSIS;
    } else if (provider === 'openai') {
      modelConfig = OPENAI_MODELS.ANALYSIS;
    } else { // hybrid
      modelConfig = HYBRID_MODELS.ANALYSIS;
    }

    console.log(`Analyzing with ${provider} provider using model: ${modelConfig}`);

    const result = await callModel(
      {
        model: modelConfig,
        prompt: getAnalysisPrompt(
          contentText,
          researchState.topic,
          researchState.clerificationsText,
          currentQueries,
          currentIteration,
          MAX_ITERATIONS,
          contentText.length
        ),
        system: ANALYSIS_SYSTEM_PROMPT,
        schema: z.object({
          sufficient: z
            .boolean()
            .describe(
              "Whether the collected content is sufficient for a useful report"
            ),
          gaps: z.array(z.string()).describe("Identified gaps in the content"),
          queries: z
            .array(z.string())
            .describe(
              "Search queries for missing informationo. Max 3 queries."
            ),
        }),
        activityType: "analyze",
        provider: researchState.provider
      },
      researchState, activityTracker
    );

    const isContentSufficient = typeof result !== 'string' && result.sufficient;

    activityTracker.add("analyze", "complete", `Analyzed collected research findings: ${isContentSufficient ? 'Content is sufficient' : 'More research is needed!'}`);
    console.log("Analyze content result: ", result)
    return result;
  } catch (error) {
    return handleError(error, `Content analysis`, activityTracker, "analyze", {
      sufficient: false,
      gaps: ["Unable to analyze content"],
      queries: ["Please try a different search query"]
    })
  }
}

export async function analyzeImages(
  images: ImageData[],
  researchState: ResearchState,
  activityTracker: ActivityTracker
): Promise<ResearchFindings[]> {
  const findings: ResearchFindings[] = [];

  if (!images || images.length === 0) return findings;

  try {
    activityTracker.add("image-analysis", "pending", `Analyzing ${images.length} uploaded images`);

    try {
      const provider = researchState.provider || "google";
      console.log(`Using provider ${provider} for image analysis`);

      let modelToUse;
      if (provider === "google") {
        modelToUse = GOOGLE_MODELS.ANALYSIS;
      } else if (provider === "openai") {
        modelToUse = OPENAI_MODELS.ANALYSIS;
      } else if (provider === "groq") {
        modelToUse = GROQ_MODELS.ANALYSIS;
      } else {
        modelToUse = GOOGLE_MODELS.ANALYSIS;
      }

      const result = await callModel(
        {
          model: modelToUse,
          prompt: `Analyze these ${images.length} images in the context of the research topic: ${researchState.topic}`,
          system: "You are an expert image analyst. Your task is to extract as much relevant information as possible from the image provided and relate it to the research topic.",
          images: images,
          activityType: "image-analysis",
          provider: provider
        },
        researchState, activityTracker
      );

      findings.push({
        summary: typeof result === "string" ? result : JSON.stringify(result),
        source: `Image analysis of ${images.length} images`
      });

      activityTracker.add("image-analysis", "complete", `Successfully analyzed ${images.length} images`);
    } catch (error) {
      console.error("Error in batch image analysis:", error);
      activityTracker.add("image-analysis", "warning", "Batch image analysis failed, trying individual images");

      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        const imageName = image.name || `Image ${i + 1}`;

        try {
          activityTracker.add("image-analysis", "pending", `Processing image: ${imageName}`);

          const result = await callModel(
            {
              model: GOOGLE_MODELS.ANALYSIS,
              prompt: `Analyze this image in the context of the research topic: ${researchState.topic}`,
              system: "You are an expert image analyst. Extract as much information as possible from this image.",
              images: [image],
              activityType: "image-analysis",
              provider: "google"
            },
            researchState, activityTracker
          );

          findings.push({
            summary: typeof result === "string" ? result : JSON.stringify(result),
            source: `Image: ${imageName}`
          });

          activityTracker.add("image-analysis", "complete", `Analyzed image: ${imageName}`);
        } catch (imageError) {
          activityTracker.add("image-analysis", "error", `Failed to analyze image: ${imageName}`);
          console.error(`Error analyzing image ${imageName}:`, imageError);
        }
      }
    }

    return findings;
  } catch (error) {
    activityTracker.add("image-analysis", "error", "Failed to analyze images");
    console.error("Error in image analysis:", error);
    return findings;
  }
}

export async function generateReport(researchState: ResearchState, activityTracker: ActivityTracker) {
  try {
    activityTracker.add("generate", "pending", `Geneating comprehensive report!`);

    const contentText = combineFindings(researchState.findings);

    const provider = researchState.provider || "google";
    console.log(`Provider in generateReport: ${provider}`);

    let modelConfig;
    if (provider === 'google') {
      modelConfig = GOOGLE_MODELS.REPORT;
    } else if (provider === 'groq') {
      modelConfig = GROQ_MODELS.REPORT;
    } else if (provider === 'openai') {
      modelConfig = OPENAI_MODELS.REPORT;
    } else { // hybrid
      modelConfig = HYBRID_MODELS.REPORT;
    }

    console.log(`Generating report with ${provider} provider using model: ${modelConfig}`);

    if (researchState.visualizations?.enabled) {
      console.log(`Including visualizations in report: ${researchState.visualizations.type}`);
      activityTracker.add("generate", "info", `Adding ${researchState.visualizations.type} visualizations to the report`);
    }

    const report = await callModel(
      {
        model: modelConfig,
        prompt: getReportPrompt(
          contentText,
          researchState.topic,
          researchState.clerificationsText,
          researchState.visualizations
        ),
        system: REPORT_SYSTEM_PROMPT,
        activityType: "generate",
        structuredOutput: false,
        provider: researchState.provider,
      },
      researchState, activityTracker
    );

    activityTracker.add("generate", "complete", `Generated comprehensive report, Total tokens used: ${researchState.tokenUsed}. Research completed in ${researchState.completedSteps} steps.`);
    console.log("Report: ", report)
    return report;
  } catch (error) {
    console.log(error);
    return handleError(error, `Report Generation`, activityTracker, "generate", "Error generating report. Please try again. ")
  }
}