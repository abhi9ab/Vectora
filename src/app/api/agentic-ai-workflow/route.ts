import { createDataStreamResponse } from "ai";
import { EmbeddingProvider, ModelProvider, ResearchState, VisualizationOptions } from "@/types/types";
import { deepResearch } from "@/services/main";

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const lastMessageContent = messages[messages.length - 1].content;
    const parsed = JSON.parse(lastMessageContent);

    const topic = parsed.topic;
    const clerifications = parsed.clarifications;
    const provider = parsed.provider || "hybrid";
    const embeddingProvider = parsed.embeddingProvider || "openai";
    const useRAG = parsed.useRAG !== undefined ? parsed.useRAG : true;
    const images = parsed.images || [];
    const visualizations = parsed.visualizations || { enabled: false, type: 'mermaid' };

    console.log("Received request with provider:", provider);
    console.log("Embedding provider:", embeddingProvider);
    console.log("Using RAG:", useRAG);
    console.log("Visualizations:", visualizations.enabled ? `Enabled (${visualizations.type})` : "Disabled");
    console.log("Received request with images:", images.length > 0 ? `${images.length} images` : "no images");

    return createDataStreamResponse({
      execute: async (dataStream) => {
        const researchState: ResearchState = {
          topic: topic,
          completedSteps: 0,
          tokenUsed: 0,
          findings: [],
          processedUrl: new Set(),
          clerificationsText: JSON.stringify(clerifications),
          provider: provider as ModelProvider,
          embeddingProvider: embeddingProvider as EmbeddingProvider,
          useRAG: useRAG,
          images: images.length > 0 ? images : undefined,
          visualizations: visualizations as VisualizationOptions
        }

        console.log("Starting research with provider:", researchState.provider);

        await deepResearch(researchState, dataStream)
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Invalid message format!"
      }),
      { status: 200 }
    );
  }
}