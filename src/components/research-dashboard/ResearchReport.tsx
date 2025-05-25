/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import { useDeepResearchStore } from "@/store/global-state";
import React, { ComponentPropsWithRef, useEffect, useMemo, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Download, Edit, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import VisualizationRenderer from "./VisualizationRenderer";

// MDX Editor imports
import {
  MDXEditor,
  headingsPlugin,
  listsPlugin,
  quotePlugin,
  thematicBreakPlugin,
  markdownShortcutPlugin,
  tablePlugin,
  codeBlockPlugin,
  codeMirrorPlugin,
  sandpackPlugin,
  frontmatterPlugin,
  linkPlugin,
  linkDialogPlugin,
  imagePlugin,
  toolbarPlugin,
  UndoRedo,
  BoldItalicUnderlineToggles,
  CodeToggle,
  CreateLink,
  InsertImage,
  InsertTable,
  InsertThematicBreak,
  ListsToggle,
  BlockTypeSelect,
  Separator,
  InsertCodeBlock,
  type MDXEditorMethods
} from '@mdxeditor/editor';
import '@mdxeditor/editor/style.css';

type CodeProps = ComponentPropsWithRef<"code"> & {
  inline?: boolean;
};

// Custom code block component for visualizations
const VisualizationCodeBlock: React.FC<{
  code: string;
  language: string;
  meta?: string;
}> = ({ code, language, meta }) => {
  const isVisualization = ['mermaid', 'chartjs', 'd3', 'html'].includes(language);
  
  if (isVisualization) {
    const visualizationType = 
      language === 'html' ? 'd3' :
      language === 'chartjs' ? 'chartjs' :
      language === 'mermaid' ? 'mermaid' : language;

    return (
      <div className="my-6 bg-white/80 rounded-lg border border-gray-200 shadow-sm p-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-medium text-gray-600">
            {visualizationType === 'mermaid' ? 'Diagram' :
             visualizationType === 'chartjs' ? 'Chart' : 'Data Visualization'}
          </h3>
          <span className="text-xs text-gray-400 uppercase">{language}</span>
        </div>
        <VisualizationRenderer
          type={visualizationType}
          content={code}
          id={`${visualizationType}-${Math.random().toString(36).substring(2, 9)}`}
        />
        <details className="mt-2">
          <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
            View Code
          </summary>
          <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
            <code>{code}</code>
          </pre>
        </details>
      </div>
    );
  }

  return (
    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-auto">
      <code className={`language-${language}`}>{code}</code>
    </pre>
  );
};

const ResearchReport = () => {
  const { report, isCompleted, isLoading, topic, visualizationOptions, updateReport } = useDeepResearchStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editableContent, setEditableContent] = useState("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const mdxEditorRef = React.useRef<MDXEditorMethods>(null);

  const cleanReport = useMemo(() => {
    if (!report) return "";
    const parts = report.split("<report>");
    return parts.length > 1 ? parts[1].split("</report>")[0] : report;
  }, [report]);

  // Initialize editable content when report changes
  useEffect(() => {
    if (cleanReport && !isEditing) {
      setEditableContent(cleanReport);
      setHasUnsavedChanges(false);
    }
  }, [cleanReport, isEditing]);

  const handleStartEditing = useCallback(() => {
    setIsEditing(true);
    setEditableContent(cleanReport);
  }, [cleanReport]);

  const handleSaveChanges = useCallback(() => {
    // Update the store with the edited content
    updateReport(editableContent);
    setIsEditing(false);
    setHasUnsavedChanges(false);
  }, [editableContent, updateReport]);

  const handleCancelEditing = useCallback(() => {
    setIsEditing(false);
    setEditableContent(cleanReport);
    setHasUnsavedChanges(false);
  }, [cleanReport]);

  const handleContentChange = useCallback((markdown: string) => {
    setEditableContent(markdown);
    setHasUnsavedChanges(true);
  }, []);

  const handleMarkdownDownload = useCallback(() => {
    const content = isEditing ? editableContent : cleanReport;
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${topic}-research-report.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [editableContent, cleanReport, isEditing, topic]);

  // Add this new function
  const saveReportToDatabase = async () => {
    try {
      const response = await fetch('/api/reports/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic,
          content: cleanReport,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save report');
      }

      const data = await response.json();
      console.log('Report saved successfully:', data.id);
    } catch (error) {
      console.error('Error saving report:', error);
    }
  };

  // Add useEffect to save report when it's completed
  useEffect(() => {
    if (isCompleted && cleanReport) {
      saveReportToDatabase();
    }
  }, [isCompleted, cleanReport]);

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
    <Card className="max-w-[90vw] xl:max-w-[60vw] relative px-4 py-6 rounded-xl border-black/10 border-solid shadow-none bg-white/60 backdrop-blur-xl border antialiased">
      {/* Action Buttons */}
      <div className="flex justify-end gap-2 mb-4 absolute top-2 right-2 z-10">
        {isEditing ? (
          <>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCancelEditing}
              className="flex items-center gap-2 rounded"
            >
              <X className="w-4 h-4" />
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSaveChanges}
              className="flex items-center gap-2 rounded"
              disabled={!hasUnsavedChanges}
            >
              <Save className="w-4 h-4" />
              Save
            </Button>
          </>
        ) : (
          <>
            <Button
              size="sm"
              variant="outline"
              onClick={handleStartEditing}
              className="flex items-center gap-2 rounded"
            >
              <Edit className="w-4 h-4" />
              Edit
            </Button>
            <Button
              size="sm"
              onClick={handleMarkdownDownload}
              className="flex items-center gap-2 rounded"
            >
              <Download className="w-4 h-4" />
              Download
            </Button>
          </>
        )}
      </div>

      {/* Content Area */}
      <div className="mt-8">
        {isEditing ? (
          <div className="border rounded-lg overflow-hidden">
            <MDXEditor
              ref={mdxEditorRef}
              markdown={editableContent}
              onChange={handleContentChange}
              plugins={[
                // Core plugins
                headingsPlugin(),
                listsPlugin(),
                quotePlugin(),
                thematicBreakPlugin(),
                markdownShortcutPlugin(),
                
                // Table support
                tablePlugin(),
                
                // Code highlighting with custom visualization support
                codeBlockPlugin({
                  defaultCodeBlockLanguage: 'txt'
                }),
                
                // Code mirror for syntax highlighting
                codeMirrorPlugin({
                  codeBlockLanguages: {
                    mermaid: 'Mermaid',
                    chartjs: 'Chart.js',
                    d3: 'D3.js',
                    html: 'HTML',
                    javascript: 'JavaScript',
                    typescript: 'TypeScript',
                    python: 'Python',
                    json: 'JSON',
                    css: 'CSS'
                  }
                }),
                
                // Links and images
                linkPlugin(),
                linkDialogPlugin(),
                imagePlugin(),
                
                // Toolbar
                toolbarPlugin({
                  toolbarContents: () => (
                    <>
                      <UndoRedo />
                      <Separator />
                      <BoldItalicUnderlineToggles />
                      <CodeToggle />
                      <Separator />
                      <BlockTypeSelect />
                      <Separator />
                      <CreateLink />
                      <InsertImage />
                      <Separator />
                      <ListsToggle />
                      <InsertTable />
                      <InsertThematicBreak />
                      <Separator />
                      <InsertCodeBlock />
                    </>
                  )
                })
              ]}
              className="min-h-[500px]"
            />
          </div>
        ) : (
          // Read-only view with visualization rendering
          <div className="prose prose-sm md:prose-base max-w-none prose-pre:p-2 overflow-x-auto">
            <MarkdownRenderer content={cleanReport} visualizationOptions={visualizationOptions} />
          </div>
        )}
      </div>

      {hasUnsavedChanges && (
        <div className="fixed bottom-4 right-4 bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-2 rounded-lg shadow-lg">
          You have unsaved changes
        </div>
      )}
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

// Helper function to render markdown with visualizations
function renderMarkdownWithVisualizations(
  markdown: string, 
  visualizationOptions: any
): string {
  if (!visualizationOptions.enabled) {
    return markdown;
  }

  let processedContent = markdown;
  const visualizationTypes = visualizationOptions.type === 'all'
    ? ['mermaid', 'chartjs', 'd3']
    : [visualizationOptions.type];

  visualizationTypes.forEach(type => {
    const regex = new RegExp(`\`\`\`${type}([\\s\\S]*?)\`\`\``, 'g');
    let index = 0;

    processedContent = processedContent.replace(regex, (match, codeContent) => {
      const id = `${type}-${index++}`;
      return `<div class="visualization-container" data-type="${type}" data-content="${encodeURIComponent(codeContent.trim())}" data-id="${id}"></div>`;
    });
  });

  return processedContent;
}

export default ResearchReport;