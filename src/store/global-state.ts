import { ImageData, Activity, EmbeddingProvider, ModelProvider, RagDocument, Source } from "@/types/types";
import { create } from "zustand";

interface VisualizationOptions {
  enabled: boolean;
  type: 'mermaid' | 'chartjs' | 'd3' | 'all';
}

interface DeepResearchState {
  topic: string;
  questions: string[];
  answers: string[];
  currentQuestion: number;
  isCompleted: boolean;
  isLoading: boolean;
  activities: Activity[];
  sources: Source[];
  report: string;
  selectedProvider: ModelProvider;
  selectedEmbeddingProvider: EmbeddingProvider;
  useRAG: boolean;
  uploadedImageData: ImageData[];
  retrievedDocuments: RagDocument[];
  visualizationOptions: VisualizationOptions;
}

interface DeepResearchActions {
  setTopic: (topic: string) => void;
  setQuestions: (questions: string[]) => void;
  setAnswers: (answers: string[]) => void;
  setCurrentQuestion: (index: number) => void;
  setIsCompleted: (isCompleted: boolean) => void;
  setIsLoading: (isLoading: boolean) => void;
  setActivities: (activities: Activity[]) => void,
  setSources: (sources: Source[]) => void,
  setReport: (report: string) => void,
  setSelectedProvider: (provider: ModelProvider) => void;
  setSelectedEmbeddingProvider: (provider: EmbeddingProvider) => void;
  setUseRAG: (useRAG: boolean) => void;
  setUploadedImageData: (imageData: ImageData[]) => void;
  setRetrievedDocuments: (documents: RagDocument[]) => void;
  setVisualizationOptions: (options: Partial<VisualizationOptions>) => void;
}

const initialState: DeepResearchState = {
  topic: "",
  questions: [],
  answers: [],
  currentQuestion: 0,
  isCompleted: false,
  isLoading: false,
  activities: [],
  sources: [],
  report: "",
  selectedProvider: 'hybrid',
  selectedEmbeddingProvider: 'openai',
  useRAG: true,
  uploadedImageData: [],
  retrievedDocuments: [],
  visualizationOptions: {
    enabled: false,
    type: 'mermaid'
  },
};

export const useDeepResearchStore = create<
  DeepResearchState & DeepResearchActions
>((set) => ({
  ...initialState,
  setTopic: (topic: string) => set({ topic }),
  setQuestions: (questions: string[]) => set({ questions }),
  setAnswers: (answers: string[]) => set({ answers }),
  setCurrentQuestion: (currentQuestion: number) => set({ currentQuestion }),
  setIsCompleted: (isCompleted: boolean) => set({ isCompleted }),
  setIsLoading: (isLoading: boolean) => set({ isLoading }),
  setActivities: (activities: Activity[]) => set({ activities }),
  setSources: (sources: Source[]) => set({ sources }),
  setReport: (report: string) => set({ report }),
  setSelectedProvider: (selectedProvider: ModelProvider) => set({ selectedProvider }),
  setSelectedEmbeddingProvider: (selectedEmbeddingProvider: EmbeddingProvider) => set({ selectedEmbeddingProvider }),
  setUseRAG: (useRAG: boolean) => set({ useRAG }),
  setUploadedImageData: (uploadedImageData: ImageData[]) => set({ uploadedImageData }),
  setRetrievedDocuments: (retrievedDocuments: RagDocument[]) => set({ retrievedDocuments }),
  setVisualizationOptions: (options: Partial<VisualizationOptions>) =>
    set((state) => ({
      visualizationOptions: {
        ...state.visualizationOptions,
        ...options
      }
    })),
}));