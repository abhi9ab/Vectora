"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { useDeepResearchStore } from "@/store/global-state";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import VisualizationRenderer from "./VisualizationRenderer";
import { ComponentPropsWithRef } from "react";

type CodeProps = ComponentPropsWithRef<"code"> & {
  inline?: boolean;
};

const HistoricalReport = () => {
  const { report, topic, visualizationOptions } = useDeepResearchStore();

  const handleMarkdownDownload = () => {
    const blob = new Blob([report], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${topic}-research-report.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!report) return null;

  return (
    <Card className="max-w-[90vw] xl:max-w-[60vw] relative px-4 py-6 rounded-xl border-black/10 border-solid shadow-none bg-white/60 backdrop-blur-xl border antialiased">
      {/* Action Buttons */}
      <div className="flex justify-end gap-2 mb-4 absolute top-2 right-2 z-10">
        <Button
          size="sm"
          onClick={handleMarkdownDownload}
          className="flex items-center gap-2 rounded"
        >
          <Download className="w-4 h-4" />
          Download
        </Button>
      </div>

      {/* Content Area */}
      <div className="mt-8">
        <div className="prose prose-sm md:prose-base max-w-none prose-pre:p-2 overflow-x-auto">
          <h1 className="text-2xl font-bold mb-4">{topic}</h1>
          <MarkdownRenderer content={report} visualizationOptions={visualizationOptions} />
        </div>
      </div>
    </Card>
  );
};

// Markdown renderer component for read-only view
const MarkdownRenderer: React.FC<{
  content: string;
  visualizationOptions: any;
}> = ({ content, visualizationOptions }) => {
  const components = {
    code({ className, children, inline, ...props }: CodeProps) {
      const match = /language-(\w+)/.exec(className || "");
      const language = match ? match[1] : "";

      if (!inline && visualizationOptions.enabled) {
        const visualizationType =
          language === 'html' ? 'd3' :
          language === 'chartjs' ? 'chartjs' :
          language === 'mermaid' ? 'mermaid' : null;

        if (visualizationType &&
          (visualizationOptions.type === visualizationType ||
           visualizationOptions.type === 'all')) {
          const code = String(children).replace(/\n$/, "");
          const id = `${visualizationType}-${Math.random().toString(36).substring(2, 9)}`;

          return (
            <div className="my-6 bg-white/80 rounded-lg border border-gray-200 shadow-sm p-4">
              <h3 className="text-sm font-medium text-gray-600 mb-2">
                {visualizationType === 'mermaid' ? 'Diagram' :
                 visualizationType === 'chartjs' ? 'Chart' : 'Data Visualization'}
              </h3>
              <VisualizationRenderer
                type={visualizationType}
                content={code}
                id={id}
              />
            </div>
          );
        }
      }

      if (!inline && language) {
        return (
          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-auto">
            <code className={`language-${language}`}>{children}</code>
          </pre>
        );
      }

      return (
        <code className={className} {...props}>
          {children}
        </code>
      );
    },
  };

  return (
    <Markdown remarkPlugins={[remarkGfm]} components={components}>
      {content}
    </Markdown>
  );
};

export default HistoricalReport;