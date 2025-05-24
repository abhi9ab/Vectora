/* eslint-disable @typescript-eslint/no-explicit-any */
import { createActivityTracker } from "./activity-tracker";
import { MAX_ITERATIONS } from "./constants";
import {
  analyzeFindings,
  analyzeImages,
  generateReport,
  generateSearchQueries,
  processSearchResults,
  search
} from "./research-functions";
import { ResearchState } from "@/types/types";
import { retrieveContextForTopic, storeResearchFindings } from "@/lib/rag/rag-service";

export async function deepResearch(researchState: ResearchState, dataStream: any) {
  let iteration = 0;

  const activityTracker = createActivityTracker(dataStream, researchState);

  console.log("Starting research with provider:", researchState.provider);
  console.log("Using RAG:", researchState.useRAG);
  console.log("Embedding provider:", researchState.embeddingProvider || "default");

  if (researchState.useRAG) {
    const ragResult = await retrieveContextForTopic(researchState.topic, researchState, activityTracker);

    if (ragResult.documents.length > 0) {
      const ragFindings = ragResult.documents.map(doc => ({
        summary: doc.content,
        source: doc.metadata.source || "Knowledge base"
      }));

      researchState.findings = [...researchState.findings, ...ragFindings];
      console.log(`Added ${ragFindings.length} documents from RAG as initial findings`);

      dataStream.writeData({
        type: "rag-documents",
        content: ragResult.documents
      });
    }
  }

  if (researchState.images && researchState.images.length > 0) {
    console.log(`Processing ${researchState.images.length} images`);
    const imageFindings = await analyzeImages(
      researchState.images,
      researchState,
      activityTracker
    );

    if (imageFindings.length > 0) {
      researchState.findings = [...researchState.findings, ...imageFindings];
      console.log(`Added ${imageFindings.length} findings from image analysis`);
    }
  }

  const initialQueries = await generateSearchQueries(researchState, activityTracker)
  let currentQueries = (initialQueries as any).searchQueries
  while (currentQueries && currentQueries.length > 0 && iteration <= MAX_ITERATIONS) {
    iteration++;

    console.log("We are running on the iteration number: ", iteration);

    const searchResults = currentQueries.map((query: string) => search(query, researchState, activityTracker));
    const searchResultsResponses = await Promise.allSettled(searchResults)

    const allSearchResults = searchResultsResponses.filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled' && result.value.length > 0).map(result => result.value).flat()

    console.log(`We got ${allSearchResults.length} search results!`)

    const newFindings = await processSearchResults(
      allSearchResults, researchState, activityTracker
    )

    console.log("Results are processed!")

    researchState.findings = [...researchState.findings, ...newFindings]

    const analysis = await analyzeFindings(
      researchState,
      currentQueries,
      iteration,
      activityTracker
    )

    console.log("Analysis: ", analysis)

    if ((analysis as any).sufficient) {
      break;
    }

    currentQueries = ((analysis as any).queries || []).filter((query: string) => !currentQueries.includes(query));
  }

  console.log("We are outside of the loop with total iterations: ", iteration)

  if (researchState.useRAG) {
    await storeResearchFindings(researchState, activityTracker);
  }

  const report = await generateReport(researchState, activityTracker);

  dataStream.writeData({
    type: "report",
    content: report
  })

  return initialQueries;
}