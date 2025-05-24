"use client";
import { RagDocument } from "@/types/types";
import { useDeepResearchStore } from "@/store/global-state";
import { ScrollText } from "lucide-react";
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";

const RetrievedDocuments = () => {
  const { retrievedDocuments, isLoading, useRAG } = useDeepResearchStore();

  if (!useRAG || retrievedDocuments.length === 0) return null;

  return (
    <div className="w-full max-w-[90vw] xl:max-w-[60vw]">
      <Collapsible className="w-full">
        <CollapsibleTrigger asChild>
          <Button
            variant="outline"
            className="flex items-center gap-2 mb-2 w-full rounded-xl border-black/10 border-solid shadow-none p-3
             bg-white/60 backdrop-blur-md border antialiased"
          >
            <ScrollText className="w-4 h-4" />
            <span>Knowledge Base Documents ({retrievedDocuments.length})</span>
            {isLoading && (
              <Badge variant="secondary" className="ml-2 animate-pulse">
                Loading...
              </Badge>
            )}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="space-y-2 mt-2">
            {retrievedDocuments.map((doc: RagDocument, index: number) => (
              <DocumentCard key={index} document={doc} />
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

const DocumentCard = ({ document }: { document: RagDocument }) => {
  const similarityText = document.similarity
    ? `${(document.similarity * 100).toFixed(1)}% relevant`
    : "Relevant document";

  return (
    <Card className="p-4 border-black/10 border-solid shadow-none rounded-xl bg-white/70 backdrop-blur-sm">
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-start">
          <div className="font-medium line-clamp-1 flex-1">
            {document.metadata.title || "Document from knowledge base"}
          </div>
          <Badge variant="outline" className="ml-2">
            {similarityText}
          </Badge>
        </div>
        <p className="text-sm line-clamp-3 text-white">
          {document.content}
        </p>
        <div className="text-xs text-muted-foreground flex items-center gap-1">
          <span className="text-white">Source:</span>
          <span className="max-w-[200px] truncate text-blue-500">
            {document.metadata.source || "Knowledge base"}
          </span>
        </div>
      </div>
    </Card>
  );
};

export default RetrievedDocuments;