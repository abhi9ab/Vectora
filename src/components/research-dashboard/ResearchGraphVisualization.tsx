import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { Author, PaperNode, PaperLink, GraphData, D3Node, D3Link, SemanticScholarPaper, SemanticScholarSearchResponse, GraphConfig } from "@/types/types";
import { useDeepResearchStore } from "@/store/global-state";
import PaperDetails from './PaperDetails';

const ResearchGraphVisualization: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedNode, setSelectedNode] = useState<PaperNode | null>(null);
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [highlightedNodes, setHighlightedNodes] = useState<Set<string>>(new Set());
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });

  const { topic } = useDeepResearchStore();

  // Update dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setDimensions({ width, height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const config: GraphConfig = {
    width: dimensions.width,
    height: dimensions.height,
    nodeSize: {
      min: 6,
      max: 20
    },
    linkDistance: 70,
    chargeStrength: -300,
    colors: {
      nodeBase: '#6C7086',
      nodeHover: '#A6ADC8',
      citation: '#585B70',
      similarity: '#89B4FA',
      coAuthorship: '#CBA6F7',
      background: '#1E1E2E',
      surface: '#313244',
      text: '#CDD6F4',
      textMuted: '#9399B2'
    }
  };

  const categorizeByVenue = (venue?: string): string => {
    if (!venue) return 'Other';

    const aiVenues = ['NIPS', 'ICML', 'ICLR', 'AAAI', 'IJCAI', 'NeurIPS'];
    const cvVenues = ['CVPR', 'ICCV', 'ECCV'];
    const nlpVenues = ['ACL', 'EMNLP', 'NAACL'];

    const venueUpper = venue.toUpperCase();

    if (aiVenues.some(v => venueUpper.includes(v))) return 'AI/ML';
    if (cvVenues.some(v => venueUpper.includes(v))) return 'Computer Vision';
    if (nlpVenues.some(v => venueUpper.includes(v))) return 'NLP';

    return 'Other';
  };

  const findCommonAuthors = (authors1: Author[], authors2: Author[]): Author[] => {
    return authors1.filter(a1 =>
      authors2.some(a2 =>
        a1.name.toLowerCase() === a2.name.toLowerCase() ||
        (a1.authorId && a2.authorId && a1.authorId === a2.authorId)
      )
    );
  };

  const buildCitationGraph = (papers: SemanticScholarPaper[]): GraphData => {
    const paperMap = new Map(papers.map(p => [p.paperId, p]));

    const nodes: PaperNode[] = papers.map(paper => ({
      id: paper.paperId,
      title: paper.title,
      authors: paper.authors,
      year: paper.year || 0,
      citationCount: paper.citationCount,
      category: categorizeByVenue(paper.venue),
      abstract: paper.abstract,
      venue: paper.venue,
      url: `https://www.semanticscholar.org/paper/${paper.paperId}`
    }));

    const links: PaperLink[] = [];

    papers.forEach(paper => {
      paper.references?.forEach(ref => {
        if (paperMap.has(ref.paperId)) {
          links.push({
            source: paper.paperId,
            target: ref.paperId,
            type: 'citation',
            weight: 1.0
          });
        }
      });

      papers.forEach(otherPaper => {
        if (paper.paperId !== otherPaper.paperId) {
          const commonAuthors = findCommonAuthors(paper.authors, otherPaper.authors);
          if (commonAuthors.length > 0) {
            links.push({
              source: paper.paperId,
              target: otherPaper.paperId,
              type: 'co-authorship',
              weight: commonAuthors.length / Math.max(paper.authors.length, otherPaper.authors.length)
            });
          }
        }
      });

      papers.forEach(otherPaper => {
        if (paper.paperId !== otherPaper.paperId) {
          const similarity = calculateSimilarity(paper.title, otherPaper.title);
          if (similarity > 0.3) {
            links.push({
              source: paper.paperId,
              target: otherPaper.paperId,
              type: 'similarity',
              weight: similarity
            });
          }
        }
      });
    });

    return { nodes, links };
  };

  const calculateSimilarity = (title1: string, title2: string): number => {
    const words1 = new Set(title1.toLowerCase().split(/\W+/));
    const words2 = new Set(title2.toLowerCase().split(/\W+/));

    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
  };

  // API service functions
  const searchPapers = async (
    query: string,
    limit: number = 20,
    fields: string[] = ['title', 'authors', 'year', 'citationCount', 'venue', 'abstract']
  ): Promise<SemanticScholarPaper[]> => {
    try {
      const fieldsParam = fields.join(',');
      const response = await fetch(
        `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(query)}&limit=${limit}&fields=${fieldsParam}`
      );

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data: SemanticScholarSearchResponse = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching papers:', error);
      throw error;
    }
  };

  const MAX_RETRIES = 3;
  const RETRY_DELAY = 1000;

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  useEffect(() => {
    const fetchPapers = async (retryCount = 0) => {
      if (!topic) return;

      setLoading(true);
      setError(null);

      try {
        const papers = await searchPapers(topic, 25);
        const graph = buildCitationGraph(papers);
        setGraphData(graph);
      } catch (err) {
        const isNetworkError = err instanceof Error &&
          (err.message.includes('NetworkError') || err.message.includes('Failed to fetch'));

        if (isNetworkError && retryCount < MAX_RETRIES) {
          setError(`Network error occurred. Retrying... (${retryCount + 1}/${MAX_RETRIES})`);
          await sleep(RETRY_DELAY);
          return fetchPapers(retryCount + 1);
        }

        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchPapers();
  }, [topic]);

  const handleNodeClick = useCallback((node: PaperNode) => {
    setSelectedNode(node);

    if (graphData) {
      const connectedNodeIds = new Set<string>();
      graphData.links.forEach(link => {
        const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
        const targetId = typeof link.target === 'string' ? link.target : link.target.id;

        if (sourceId === node.id) connectedNodeIds.add(targetId);
        if (targetId === node.id) connectedNodeIds.add(sourceId);
      });

      setHighlightedNodes(connectedNodeIds);
    }
  }, [graphData]);

  // Sample data for initial display
  const sampleData: GraphData = {
    nodes: [
      {
        id: "paper1",
        title: "Deep Learning in Computer Vision",
        authors: [{ name: "Smith, J." }, { name: "Doe, A." }],
        year: 2023,
        citationCount: 45,
        category: "AI/ML"
      },
      {
        id: "paper2",
        title: "Neural Networks for Image Recognition",
        authors: [{ name: "Johnson, M." }],
        year: 2022,
        citationCount: 123,
        category: "Computer Vision"
      },
      {
        id: "paper3",
        title: "Convolutional Neural Networks",
        authors: [{ name: "Brown, K." }],
        year: 2021,
        citationCount: 89,
        category: "Computer Vision"
      },
      {
        id: "paper4",
        title: "Machine Learning Fundamentals",
        authors: [{ name: "Davis, L." }],
        year: 2020,
        citationCount: 234,
        category: "AI/ML"
      },
      {
        id: "paper5",
        title: "Natural Language Processing with Transformers",
        authors: [{ name: "Wilson, R." }],
        year: 2019,
        citationCount: 156,
        category: "NLP"
      },
    ],
    links: [
      { source: "paper1", target: "paper2", type: "citation", weight: 0.8 },
      { source: "paper1", target: "paper3", type: "citation", weight: 0.6 },
      { source: "paper2", target: "paper3", type: "similarity", weight: 0.9 },
      { source: "paper2", target: "paper4", type: "citation", weight: 0.4 },
      { source: "paper4", target: "paper5", type: "co-authorship", weight: 0.7 },
    ]
  };

  useEffect(() => {
    const currentData = graphData || sampleData;
    if (!svgRef.current || !currentData.nodes.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const { width, height, nodeSize, linkDistance, chargeStrength, colors } = config;

    svg.attr("width", width).attr("height", height);

    // Create scales
    const sizeScale = d3.scaleLinear()
      .domain(d3.extent(currentData.nodes, (d: PaperNode) => d.citationCount) as [number, number])
      .range([nodeSize.min, nodeSize.max]);

    // Create zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on("zoom", (event) => {
        container.attr("transform", event.transform);
      });

    svg.call(zoom);

    // Create main container
    const container = svg.append("g");

    // Convert data to D3 format
    const nodes: D3Node[] = currentData.nodes.map(node => ({ ...node }));
    const links: D3Link[] = currentData.links.map(link => ({ ...link }));

    // Create force simulation
    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink<D3Node, D3Link>(links).id((d: D3Node) => d.id).distance(linkDistance))
      .force("charge", d3.forceManyBody<D3Node>().strength(chargeStrength))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide<D3Node>().radius((d: D3Node) => sizeScale(d.citationCount) + 10).strength(0.8))
      .force("x", d3.forceX(width / 2).strength(0.1))
      .force("y", d3.forceY(height / 2).strength(0.1));

    // Create links with Obsidian colors
    const linkElements = container.append("g")
      .selectAll("line")
      .data(links)
      .enter().append("line")
      .attr("stroke", (d: D3Link) => {
        switch (d.type) {
          case "citation": return colors.citation;
          case "similarity": return colors.similarity;
          case "co-authorship": return colors.coAuthorship;
          default: return colors.citation;
        }
      })
      .attr("stroke-opacity", 0.7)
      .attr("stroke-width", (d: D3Link) => Math.sqrt(d.weight * 3))
      .attr("stroke-dasharray", (d: D3Link) => d.type === "similarity" ? "5,5" : "none");

    // Create nodes with Obsidian styling
    const nodeElements = container.append("g")
      .selectAll("circle")
      .data(nodes)
      .enter().append("circle")
      .attr("r", (d: D3Node) => sizeScale(d.citationCount))
      .attr("fill", (d: D3Node) => {
        // Create gradient for all nodes using the same base color
        const gradientId = `gradient-${d.id}`;
        const gradient = svg.append("defs")
          .append("radialGradient")
          .attr("id", gradientId)
          .attr("gradientUnits", "userSpaceOnUse")
          .attr("cx", "50%")
          .attr("cy", "50%")
          .attr("r", "50%");

        const baseColor = colors.nodeBase;
        const darkerColor = d3.color(baseColor);
        const endColor = darkerColor ? darkerColor.darker(0.8).toString() : baseColor;

        gradient.append("stop")
          .attr("offset", "0%")
          .attr("stop-color", baseColor);

        gradient.append("stop")
          .attr("offset", "100%")
          .attr("stop-color", endColor);

        return `url(#${gradientId})`;
      })
      .attr("stroke", colors.surface)
      .attr("stroke-width", 1.5)
      .style("cursor", "pointer")
      .style("filter", "drop-shadow(2px 2px 4px rgba(0,0,0,0.3))")
      .call(d3.drag<SVGCircleElement, D3Node>()
        .on("start", (event: d3.D3DragEvent<SVGCircleElement, D3Node, D3Node>, d: D3Node) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on("drag", (event: d3.D3DragEvent<SVGCircleElement, D3Node, D3Node>, d: D3Node) => {
          d.fx = Math.max(20, Math.min(width - 20, event.x));
          d.fy = Math.max(20, Math.min(height - 20, event.y));
        })
        .on("end", (event: d3.D3DragEvent<SVGCircleElement, D3Node, D3Node>, d: D3Node) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        }));

    // Add labels with Obsidian styling
    const labelElements = container.append("g")
      .selectAll("text")
      .data(nodes)
      .enter().append("text")
      .text((d: D3Node) => d.title.length > 25 ? d.title.substring(0, 25) + "..." : d.title)
      .attr("font-size", "9px")
      .attr("font-family", "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif")
      .attr("text-anchor", "middle")
      .attr("dy", (d: D3Node) => -sizeScale(d.citationCount) - 5)
      .style("pointer-events", "none")
      .style("fill", colors.text)
      .style("font-weight", "400");

    // Add hover and click interactions
    nodeElements
      .on("mouseover", function (event: d3.D3DragEvent<SVGCircleElement, D3Node, D3Node>, d: D3Node) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("r", sizeScale(d.citationCount) + 5)
          .attr("fill", colors.nodeHover)
          .style("filter", "drop-shadow(4px 4px 8px rgba(0,0,0,0.5))");

        // Show tooltip
        const tooltip = container.append("g")
          .attr("class", "tooltip")
          .attr("transform", `translate(${d.x! + 10},${d.y! - 10})`);

        tooltip.append("rect")
          .attr("rx", 8)
          .attr("ry", 8)
          .attr("fill", colors.surface)
          .attr("opacity", 0.95)
          .attr("stroke", colors.nodeBase)
          .attr("stroke-width", 1);

        const tooltipText = tooltip.append("text")
          .attr("x", 12)
          .attr("y", 20)
          .attr("font-size", "12px")
          .attr("font-family", "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif")
          .attr("fill", colors.text);

        tooltipText.append("tspan")
          .text(`${d.title}`)
          .attr("x", 12)
          .attr("dy", 0)
          .style("font-weight", "500");

        tooltipText.append("tspan")
          .text(`Year: ${d.year} | Citations: ${d.citationCount}`)
          .attr("x", 12)
          .attr("dy", 18)
          .attr("fill", colors.textMuted);

        const bbox = (tooltip.node() as SVGGElement).getBBox();
        tooltip.select("rect")
          .attr("width", bbox.width + 24)
          .attr("height", bbox.height + 20);

        linkElements
          .style("opacity", (link: D3Link) => {
            const sourceId = typeof link.source === 'string' ? link.source :
              (typeof link.source === 'object' && link.source !== null ? link.source.id : '');
            const targetId = typeof link.target === 'string' ? link.target :
              (typeof link.target === 'object' && link.target !== null ? link.target.id : '');
            return (sourceId === d.id || targetId === d.id) ? 1 : 0.2;
          });
      })
      .on("mouseout", function (event: d3.D3DragEvent<SVGCircleElement, D3Node, D3Node>, d: D3Node) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("r", sizeScale(d.citationCount))
          .attr("fill", function (this: SVGCircleElement, datum: unknown) {
            const node = datum as D3Node;
            return `url(#gradient-${node.id})`;
          })
          .style("filter", "drop-shadow(2px 2px 4px rgba(0,0,0,0.3))");

        container.selectAll(".tooltip").remove();
        linkElements.style("opacity", 0.7);
      })
      .on("click", function (event: MouseEvent, d: D3Node) {
        handleNodeClick(d as PaperNode);
      });

    // Update positions on simulation tick
    simulation.on("tick", () => {
      nodes.forEach(d => {
        const radius = sizeScale(d.citationCount);
        d.x = Math.max(radius, Math.min(width - radius, d.x || 0));
        d.y = Math.max(radius, Math.min(height - radius, d.y || 0));
      });

      linkElements
        .attr("x1", (d: D3Link) => (d.source as D3Node).x || 0)
        .attr("y1", (d: D3Link) => (d.source as D3Node).y || 0)
        .attr("x2", (d: D3Link) => (d.target as D3Node).x || 0)
        .attr("y2", (d: D3Link) => (d.target as D3Node).y || 0);

      nodeElements
        .attr("cx", (d: D3Node) => d.x || 0)
        .attr("cy", (d: D3Node) => d.y || 0);

      labelElements
        .attr("x", (d: D3Node) => d.x || 0)
        .attr("y", (d: D3Node) => d.y || 0);
    });

    return () => {
      simulation.stop();
    };

  }, [graphData, handleNodeClick, dimensions]);

  const handleCloseDetails = (): void => {
    setSelectedNode(null);
    setHighlightedNodes(new Set());
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-full p-4"
      style={{ backgroundColor: config.colors.background }}
    >
      <div className="mb-3">
        <h3 className="text-lg font-semibold" style={{ color: config.colors.text }}>
          Research Paper Network
        </h3>
        <div className="flex flex-wrap gap-4 text-xs mt-1">
          <div className="flex items-center gap-2">
            <div className="w-4 h-1" style={{ backgroundColor: config.colors.citation }}></div>
            <span style={{ color: config.colors.text }}>Citations</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-1" style={{ backgroundColor: config.colors.similarity, borderTop: '1px dashed' }}></div>
            <span style={{ color: config.colors.text }}>Similarity</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-1" style={{ backgroundColor: config.colors.coAuthorship }}></div>
            <span style={{ color: config.colors.text }}>Co-authorship</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-3 p-3 rounded text-sm" style={{ backgroundColor: '#F38BA8', color: '#1E1E2E' }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      <div className="relative">
        {selectedNode && <PaperDetails paper={selectedNode} onClose={handleCloseDetails} />}

        {loading ? (
          <div className="flex justify-center items-center h-[600px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 mx-auto mb-3" style={{
                borderColor: config.colors.nodeBase
              }}></div>
              <p style={{ color: config.colors.textMuted }} className="text-sm">Loading research papers...</p>
            </div>
          </div>
        ) : (
          <svg
            ref={svgRef}
            className="w-full h-[calc(80vh-100px)]"
          ></svg>
        )}
      </div>
    </div>
  );
};

export default ResearchGraphVisualization;