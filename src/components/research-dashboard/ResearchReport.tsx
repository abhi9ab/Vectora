/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import { useDeepResearchStore } from "@/store/global-state";
import React, { ComponentPropsWithRef, useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Prism as SyntaxHighlighter,
  SyntaxHighlighterProps,
} from "react-syntax-highlighter";
import { nightOwl } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import VisualizationRenderer from "./VisualizationRenderer";
import ResearchGraphVisualization from './ResearchGraphVisualization';

type CodeProps = ComponentPropsWithRef<"code"> & {
  inline?: boolean;
};

const ResearchReport = () => {
  const { report, isCompleted, isLoading, topic, visualizationOptions } = useDeepResearchStore();
  const [processedReport, setProcessedReport] = useState("");

  const extractCodeBlocks = (markdown: string, language: string) => {
    if (!markdown) return [];
    const regex = new RegExp(`\`\`\`${language}([\\s\\S]*?)\`\`\``, 'g');
    const blocks: { content: string, id: string }[] = [];

    let match;
    while ((match = regex.exec(markdown)) !== null) {
      blocks.push({
        content: match[1].trim(),
        id: `${language}-${blocks.length}`
      });
    }

    return blocks;
  };

  const cleanReport = useMemo(() => {
    if (!report) return "";
    const parts = report.split("<report>");
    return parts.length > 1 ? parts[1].split("</report>")[0] : report;
  }, [report]);

  useEffect(() => {
    if (!cleanReport || !visualizationOptions.enabled) {
      setProcessedReport(cleanReport);
      return;
    }

    let processedContent = cleanReport;
    const visualizationTypes = visualizationOptions.type === 'all'
      ? ['mermaid', 'chartjs', 'd3']
      : [visualizationOptions.type];

    visualizationTypes.forEach(type => {
      if (visualizationOptions.type === type || visualizationOptions.type === 'all') {
        const regex = new RegExp(`\`\`\`${type}([\\s\\S]*?)\`\`\``, 'g');
        let index = 0;

        processedContent = processedContent.replace(regex, (match, codeContent) => {
          const placeholderId = `${type}-placeholder-${index++}`;
          return `<div id="${placeholderId}" data-type="${type}" data-content="${encodeURIComponent(codeContent.trim())}"></div>`;
        });
      }
    });

    setProcessedReport(processedContent);
  }, [cleanReport, visualizationOptions]);

  useEffect(() => {
    if (!visualizationOptions.enabled || !processedReport) return;

    document.querySelectorAll('div[id^="mermaid-placeholder-"], div[id^="chartjs-placeholder-"], div[id^="d3-placeholder-"]').forEach(placeholder => {
      const type = placeholder.getAttribute('data-type');
      const content = decodeURIComponent(placeholder.getAttribute('data-content') || '');
      const id = placeholder.id;

      if (type && content) {
        const container = document.createElement('div');
        container.className = "my-6 bg-white/80 rounded-lg border border-gray-200 shadow-sm";

        const visualization = document.createElement('div');
        visualization.id = `visualization-${id}`;
        container.appendChild(visualization);

        placeholder.parentNode?.replaceChild(container, placeholder);

        const visualizationElement = document.getElementById(`visualization-${id}`);
        if (visualizationElement) {
          const root = document.createElement('div');
          visualizationElement.appendChild(root);

          const visualRenderer = document.createElement('div');
          visualRenderer.className = "w-full";
          root.appendChild(visualRenderer);

          visualRenderer.setAttribute('data-render-visualization', 'true');
          visualRenderer.setAttribute('data-type', type);
          visualRenderer.setAttribute('data-content', content);
          visualRenderer.setAttribute('data-id', id);
        }
      }
    });
  }, [processedReport, visualizationOptions]);

  const handleMarkdownDownload = () => {
    const content = cleanReport;
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${topic}-research-report.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isCompleted) return null;

  if (report.length <= 0 && isLoading) {
    return (
      <Card className="p-4 max-w-[50vw] bg-white/60 border px-4 py-2 rounded-xl">
        <div className="flex flex-col items-center justify-center space-y-4 p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">
            Researching your topic...
          </p>
        </div>
      </Card>
    );
  }

  if (report.length <= 0) return null;

  return (
    <Card
      className="max-w-[90vw] xl:max-w-[60vw] relative px-4 py-6 rounded-xl border-black/10 border-solid shadow-none p-6
     bg-white/60 backdrop-blur-xl border antialiased
    "
    >
      <div className="flex justify-end gap-2 mb-4 absolute top-2 right-2">
        <Button
          size="sm"
          className="flex items-center gap-2 rounded"
          onClick={handleMarkdownDownload}
        >
          <Download className="w-4 h-4" />
        </Button>
      </div>

      <div className="prose prose-sm md:prose-base max-w-none prose-pre:p-2 overflow-x-scroll">
        <Markdown
          remarkPlugins={[remarkGfm]}
          components={{
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
                  const content = String(children).replace(/\n$/, "");
                  const id = `${visualizationType}-${Math.random().toString(36).substring(2, 9)}`;

                  return (
                    <div className="my-6 bg-white/80 rounded-lg border border-gray-200 shadow-sm p-4">
                      <h3 className="text-sm font-medium text-gray-600 mb-2">
                        {visualizationType === 'mermaid' ? 'Diagram' :
                          visualizationType === 'chartjs' ? 'Chart' : 'Data Visualization'}
                      </h3>
                      <VisualizationRenderer
                        type={visualizationType}
                        content={content}
                        id={id}
                      />
                    </div>
                  );
                }
              }

              if (!inline && language) {
                const SyntaxHighlighterProps: SyntaxHighlighterProps = {
                  style: nightOwl,
                  language,
                  PreTag: "div",
                  children: String(children).replace(/\n$/, ""),
                };

                return <SyntaxHighlighter {...SyntaxHighlighterProps} />;
              }

              return (
                <code className={className} {...props}>
                  {children}
                </code>
              );
            },
          }}
        >
          {cleanReport}
        </Markdown>
      </div>
    </Card>
  );
};

export default ResearchReport;