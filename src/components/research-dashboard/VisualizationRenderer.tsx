"use client";
import React, { useEffect, useRef } from 'react';
import mermaid from 'mermaid';
import Chart from 'chart.js/auto';
import * as d3 from 'd3';

interface VisualizationRendererProps {
  type: string;
  content: string;
  id: string;
}

const VisualizationRenderer: React.FC<VisualizationRendererProps> = ({ type, content, id }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'neutral',
      securityLevel: 'loose',
      fontFamily: 'inherit',
    });
  }, []);

  useEffect(() => {
    const renderVisualization = async () => {
      if (!containerRef.current) return;

      try {
        containerRef.current.innerHTML = '';

        if (type === 'mermaid') {
          const sanitizedContent = content
            .replace(/([\[{\(])([^\]]*?\([^\)]*?\)[^\]]*?)([\]}\)])/g, '$1"$2"$3')
            .replace(/(-->|\|)([^"\n|]*?\([^)]*?\))(\|?)/g, '$1"$2"$3')
            .replace(/(graph\s+[a-zA-Z]+)\s*$/gm, '$1;')
            .replace(/\b(\w+)\b(?=\s*[\[{\(])/g, '$1_' + id)
            .replace(/;(\s*[}\]\)])/g, '$1');

          const element = document.createElement('div');
          element.className = 'mermaid';
          element.id = `mermaid-${id}`;
          element.style.minWidth = '300px';
          element.textContent = sanitizedContent.trim();
          containerRef.current.appendChild(element);

          try {
            requestAnimationFrame(async () => {
              await mermaid.run({
                querySelector: `#mermaid-${id}`,
                suppressErrors: false,
              });
              window.dispatchEvent(new Event('resize'));
            });
          } catch (mermaidError) {
            console.error('Mermaid render error:', mermaidError);
            element.innerHTML = `<div class="text-red-500">${(mermaidError as Error).message}</div>`;
          }
        }
        else if (type === 'chartjs') {
          try {
            const chartConfig = JSON.parse(content);

            const canvas = document.createElement('canvas');
            canvas.id = `chart-${id}`;
            containerRef.current.appendChild(canvas);

            new Chart(canvas, chartConfig);
          } catch (parseError) {
            console.error('Failed to parse Chart.js config:', parseError);
            containerRef.current.innerHTML = `<div class="text-red-500">Error rendering chart: ${(parseError as Error).message}</div>`;
          }
        }
        else if (type === 'd3') {
          try {
            const d3Container = document.createElement('div');
            d3Container.id = `d3-${id}`;
            containerRef.current.appendChild(d3Container);

            let jsCode = content;
            jsCode = jsCode.replace(/'#chart'|"#chart"|#chart/g, `#d3-${id}`);

            if (content.includes('<script')) {
              const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/g;
              let matches;
              jsCode = '';
              while ((matches = scriptRegex.exec(content)) !== null) {
                if (matches[1]) jsCode += matches[1] + '\n';
              }
            }

            const d3Function = new Function('d3', 'containerId', `
              try {
                const container = d3.select(containerId);
                if (container.empty()) throw new Error('Container not found');
                ${jsCode
                .replace(/d3\.select\(["']#chart["']\)/g, 'container')
                .replace(/d3\.select\(["']#\w+["']\)/g, 'container')}
              } catch(error) {
                console.error('D3 Error:', error);
                throw error;
              }
            `);

            d3Function(d3, `#d3-${id}`);
          } catch (d3Error: unknown) {
            console.error('D3 render error:', d3Error);
            containerRef.current.innerHTML = `<div class="text-red-500">Error rendering D3: ${d3Error instanceof Error ? d3Error.message : 'Unknown error'}</div>`;
          }
        }
      } catch (error: unknown) {
        console.error('Visualization render error:', error);
        if (containerRef.current) {
          containerRef.current.innerHTML = `<div class="text-red-500">Failed to render visualization: ${error instanceof Error ? error.message : 'Unknown error'}</div>`;
        }
      }
    };

    renderVisualization();
  }, [type, content, id]);

  // Add cleanup effect
  useEffect(() => {
    const container = containerRef.current;

    return () => {
      if (container) {
        const charts = container.querySelectorAll('canvas');
        charts.forEach(chart => {
          const chartInstance = Chart.getChart(chart);
          if (chartInstance) chartInstance.destroy();
        });
      }
    };
  }, []);

  return (
    <div className="visualization-container my-4 bg-white/50 rounded-lg border border-gray-200">
      <div ref={containerRef} className="overflow-hidden w-full"></div>
    </div>
  );
};

export default VisualizationRenderer;