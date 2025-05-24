/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useDeepResearchStore } from "@/store/global-state";
import React, { useEffect } from "react";
import QuestionForm from "./QuestionForm";
import { useChat } from "@ai-sdk/react";

const QnA = () => {
  const {
    questions,
    isCompleted,
    topic,
    answers,
    setIsLoading,
    setActivities,
    setSources,
    setReport,
    uploadedImageData,
    selectedProvider,
    selectedEmbeddingProvider,
    useRAG,
    setRetrievedDocuments,
    visualizationOptions
  } = useDeepResearchStore();

  const { append, data, isLoading } = useChat({
    api: "/api/agentic-ai-workflow",
  });

  useEffect(() => {
    if (!data) return;

    // extract activities and sources
    const messages = data as unknown[];
    const activities = messages
      .filter(
        (msg) => typeof msg === "object" && (msg as any).type === "activity"
      )
      .map((msg) => (msg as any).content);

    setActivities(activities);

    const sources = activities
      .filter(
        (activity) =>
          activity.type === "extract" && activity.status === "complete"
      )
      .map((activity) => {
        const url = activity.message.split("from ")[1];
        return {
          url,
          title: url?.split("/")[2] || url,
        };
      });
    setSources(sources);

    const reportData = messages.find(
      (msg) => typeof msg === "object" && (msg as any).type === "report"
    );
    const report =
      typeof (reportData as any)?.content === "string"
        ? (reportData as any).content
        : "";
    setReport(report);

    // Extract RAG documents if present
    const ragDocumentsData = messages.find(
      (msg) => typeof msg === "object" && (msg as any).type === "rag-documents"
    );

    if (ragDocumentsData && (ragDocumentsData as any).content) {
      setRetrievedDocuments((ragDocumentsData as any).content);
    }

    setIsLoading(isLoading);
  }, [data, setActivities, setSources, setReport, setIsLoading, setRetrievedDocuments, isLoading]);

  useEffect(() => {
    if (isCompleted && questions.length > 0) {
      const clarifications = questions.map((question, index) => ({
        question: question,
        answer: answers[index],
      }));

      console.log(`Using selected provider: ${selectedProvider}`);
      console.log(`Using embedding provider: ${selectedEmbeddingProvider}`);
      console.log(`RAG enabled: ${useRAG}`);
      console.log(`Visualizations enabled: ${visualizationOptions.enabled} (type: ${visualizationOptions.type})`);

      append({
        role: "user",
        content: JSON.stringify({
          topic: topic,
          clarifications: clarifications,
          provider: selectedProvider,
          embeddingProvider: selectedEmbeddingProvider,
          useRAG: useRAG,
          visualizations: visualizationOptions,
          images: uploadedImageData.length > 0 ? uploadedImageData : undefined
        }),
      });
    }
  }, [isCompleted, questions, answers, topic, append, uploadedImageData,
    selectedProvider, selectedEmbeddingProvider, useRAG, visualizationOptions]);

  if (questions.length === 0) return null;

  return (
    <div className="flex gap-4 w-full flex-col items-center mb-16">
      <QuestionForm />
    </div>
  );
};

export default QnA;