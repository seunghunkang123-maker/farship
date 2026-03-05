import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Character, CharacterRelation } from '../../types';
import { getOptimizedImageUrl } from '../../utils/imageUtils';

interface RelationshipGraphProps {
  characters: Character[];
  relations: CharacterRelation[];
  activeCharacterId?: string;
  isGlobalReveal?: boolean;
  onNodeClick?: (characterId: string) => void;
  width?: number;
  height?: number;
  groupByCampaign?: boolean;
  campaigns?: { id: string, name: string, theme?: string }[];
}

const RelationshipGraph: React.FC<RelationshipGraphProps> = ({ 
  characters, 
  relations, 
  activeCharacterId,
  isGlobalReveal = false,
  onNodeClick,
  width = 800, 
  height = 600,
  groupByCampaign = false,
  campaigns = []
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [transform, setTransform] = useState<d3.ZoomTransform>(d3.zoomIdentity);

  useEffect(() => {
    if (!svgRef.current || characters.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous render

    // --- Data Preparation ---
    // 1. Filter Links
    const links = relations
      .filter(r => !r.isSecret || isGlobalReveal)
      .map(r => ({
        source: r.sourceCharacterId,
        target: r.targetCharacterId,
        type: r.relationType,
        strength: r.strength || 1,
        isSecret: r.isSecret,
        id: r.id
      }));

    // 2. Filter Nodes
    // If activeCharacterId is provided, we might want to show only connected nodes?
    // The user said "Relationship Graph Overall View" (implied by "scattered"), so usually we want to show everything unless filtered.
    // However, the previous code filtered if activeCharacterId was present.
    // Let's keep the filtering logic if activeCharacterId is passed, but maybe the user wants to see the whole graph?
    // The prompt says "Relationship Graph Overall View" (implied). 
    // If activeCharacterId is NOT provided, it shows all.
    // If it IS provided, it shows neighbors.
    // Let's stick to the existing logic: if activeCharacterId is set, show neighborhood. If not, show all.
    
    let filteredNodes = characters.map(c => ({ ...c }));
    let filteredLinks = [...links];

    if (activeCharacterId) {
      const connectedIds = new Set<string>();
      connectedIds.add(activeCharacterId);
      links.forEach(l => {
        if (l.source === activeCharacterId) connectedIds.add(l.target as string);
        if (l.target === activeCharacterId) connectedIds.add(l.source as string);
      });
      
      filteredNodes = filteredNodes.filter(n => connectedIds.has(n.id));
      filteredLinks = filteredLinks.filter(l => connectedIds.has(l.source as string) && connectedIds.has(l.target as string));
    }

    // --- Simulation Setup ---
    const simulation = d3.forceSimulation(filteredNodes as any)
      .force("link", d3.forceLink(filteredLinks).id((d: any) => d.id).distance(150)) // Increased distance for portraits
      .force("charge", d3.forceManyBody().strength(-800)) // Stronger repulsion to prevent overlap
      .force("collide", d3.forceCollide().radius(60)); // Larger collision radius for portraits

    if (groupByCampaign && campaigns.length > 0) {
      // Group by campaign logic
      const campaignIds = Array.from(new Set(filteredNodes.map(n => n.campaignId)));
      const numCampaigns = campaignIds.length;
      
      // Arrange campaign centers in a circle
      const radius = Math.max(300, numCampaigns * 150); // Dynamic radius based on number of campaigns
      const centers: Record<string, {x: number, y: number}> = {};
      
      campaignIds.forEach((id, i) => {
        const angle = (i / numCampaigns) * 2 * Math.PI;
        centers[id] = {
          x: width / 2 + radius * Math.cos(angle),
          y: height / 2 + radius * Math.sin(angle)
        };
      });

      // Add forces to pull nodes to their campaign center
      simulation
        .force("x", d3.forceX((d: any) => centers[d.campaignId]?.x || width / 2).strength(0.1))
        .force("y", d3.forceY((d: any) => centers[d.campaignId]?.y || height / 2).strength(0.1))
        .force("center", d3.forceCenter(width / 2, height / 2).strength(0.01)); // Weak center to keep everything somewhat centered
      
    } else {
      // Default center force
      simulation.force("center", d3.forceCenter(width / 2, height / 2));
    }

    // --- Zoom Behavior ---
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        container.attr("transform", event.transform);
        setTransform(event.transform);
      });

    svg.call(zoom);

    // --- Rendering ---
    
    // Container for zoomable content
    const container = svg.append("g");

    // Draw Campaign Backgrounds (Giant Spheres) - Render FIRST to be in background
    if (groupByCampaign && campaigns.length > 0) {
      const campaignIds = Array.from(new Set(filteredNodes.map(n => n.campaignId)));
      const numCampaigns = campaignIds.length;
      const radius = Math.max(300, numCampaigns * 150);
      const centers: Record<string, {x: number, y: number}> = {};
      
      campaignIds.forEach((id, i) => {
        const angle = (i / numCampaigns) * 2 * Math.PI;
        centers[id] = {
          x: width / 2 + radius * Math.cos(angle),
          y: height / 2 + radius * Math.sin(angle)
        };
      });

      const campaignGroups = container.append("g").attr("class", "campaign-backgrounds");
      
      campaignIds.forEach(id => {
        const center = centers[id];
        const campaign = campaigns.find(c => c.id === id);
        if (center && campaign) {
          // Draw a large faint circle for the campaign
          campaignGroups.append("circle")
            .attr("cx", center.x)
            .attr("cy", center.y)
            .attr("r", 250) // Giant sphere
            .attr("fill", "rgba(245, 158, 11, 0.03)") // Faint amber
            .attr("stroke", "rgba(245, 158, 11, 0.1)")
            .attr("stroke-width", 2)
            .attr("stroke-dasharray", "10, 10");
            
          // Add campaign name label
          campaignGroups.append("text")
            .attr("x", center.x)
            .attr("y", center.y - 260)
            .attr("text-anchor", "middle")
            .text(campaign.name)
            .attr("fill", "rgba(245, 158, 11, 0.5)")
            .attr("font-size", "24px")
            .attr("font-weight", "bold")
            .attr("font-family", "serif")
            .style("pointer-events", "none");
        }
      });
    }

    // Defs for Images
    const defs = svg.append("defs");
    
    filteredNodes.forEach(node => {
      if (node.imageUrl) {
        defs.append("pattern")
          .attr("id", `img-${node.id}`)
          .attr("patternUnits", "objectBoundingBox")
          .attr("width", 1)
          .attr("height", 1)
          .append("image")
          .attr("xlink:href", getOptimizedImageUrl(node.imageUrl, 200))
          .attr("width", 80) // Match node diameter * 2 for safety
          .attr("height", 80)
          .attr("x", 0)
          .attr("y", 0)
          .attr("preserveAspectRatio", "xMidYMid slice");
      }
    });

    // Arrow Marker
    defs.append("marker")
      .attr("id", "arrow")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 42) // Adjusted for node radius (40) + buffer
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#78716c"); // Stone-500

    // Links
    const link = container.append("g")
      .attr("stroke", "#78716c") // Stone-500
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(filteredLinks)
      .join("line")
      .attr("stroke-width", d => Math.sqrt(d.strength || 1) * 2)
      .attr("marker-end", "url(#arrow)");

    // Link Labels (Background)
    const linkLabelBg = container.append("g")
      .selectAll("rect")
      .data(filteredLinks)
      .join("rect")
      .attr("rx", 4)
      .attr("ry", 4)
      .attr("fill", "#1c1917") // Stone-900
      .attr("opacity", 0.8);

    // Link Labels (Text)
    const linkLabel = container.append("g")
      .selectAll("text")
      .data(filteredLinks)
      .join("text")
      .attr("dy", 4)
      .attr("text-anchor", "middle")
      .text(d => d.type)
      .attr("fill", "#a8a29e") // Stone-400
      .attr("font-size", "10px")
      .style("pointer-events", "none");

    // Nodes (Groups)
    const node = container.append("g")
      .selectAll("g")
      .data(filteredNodes)
      .join("g")
      .call(drag(simulation) as any)
      .on("click", (event, d) => {
        if (onNodeClick) {
          event.stopPropagation(); // Prevent zoom click
          onNodeClick(d.id);
        }
      });

    // Node Circles (Background/Border)
    node.append("circle")
      .attr("r", 40)
      .attr("fill", "#292524") // Stone-800
      .attr("stroke", d => d.id === activeCharacterId ? "#f59e0b" : "#57534e") // Amber-500 or Stone-600
      .attr("stroke-width", d => d.id === activeCharacterId ? 4 : 2);

    // Node Images (Overlay)
    node.append("circle")
      .attr("r", 38)
      .attr("fill", d => d.imageUrl ? `url(#img-${d.id})` : "none");

    // Node Icons (Fallback if no image)
    node.filter(d => !d.imageUrl)
      .append("text")
      .attr("dy", 5)
      .attr("text-anchor", "middle")
      .attr("font-family", "sans-serif")
      .attr("font-size", "24px")
      .attr("fill", "#78716c") // Stone-500
      .text(d => d.name.slice(0, 1).toUpperCase());

    // Node Labels (Name)
    node.append("text")
      .attr("dy", 55)
      .attr("text-anchor", "middle")
      .text(d => d.name)
      .attr("fill", "#e7e5e4") // Stone-200
      .attr("font-size", "12px")
      .attr("font-weight", "bold")
      .style("pointer-events", "none")
      .style("text-shadow", "0 2px 4px rgba(0,0,0,0.8)");

    // Simulation Tick
    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node
        .attr("transform", (d: any) => `translate(${d.x},${d.y})`);

      // Update Link Labels
      linkLabel
        .attr("x", (d: any) => (d.source.x + d.target.x) / 2)
        .attr("y", (d: any) => (d.source.y + d.target.y) / 2);

      // Update Link Label Backgrounds
      linkLabelBg.each(function(d: any) {
        const textNode = linkLabel.nodes()[filteredLinks.indexOf(d)] as SVGGraphicsElement;
        if (textNode && textNode.getBBox) {
          const bbox = textNode.getBBox();
          d3.select(this)
            .attr("x", bbox.x - 4)
            .attr("y", bbox.y - 2)
            .attr("width", bbox.width + 8)
            .attr("height", bbox.height + 4);
        }
      });
    });

    // Drag Behavior
    function drag(simulation: any) {
      function dragstarted(event: any) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      }

      function dragged(event: any) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      }

      function dragended(event: any) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
      }

      return d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
    }

    return () => {
      simulation.stop();
    };
  }, [characters, relations, activeCharacterId, width, height, isGlobalReveal]);

  return (
    <div className="border border-stone-700 rounded-lg overflow-hidden bg-stone-950 relative group">
      <svg ref={svgRef} width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} className="cursor-grab active:cursor-grabbing" />
      
      {/* Zoom Controls Overlay */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          onClick={() => {
            if (svgRef.current) {
              d3.select(svgRef.current).transition().duration(750).call(
                d3.zoom<SVGSVGElement, unknown>().transform as any, 
                d3.zoomIdentity
              );
            }
          }}
          className="p-2 bg-stone-800 text-stone-300 rounded-lg hover:bg-stone-700 shadow-lg border border-stone-700"
          title="Reset View"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
        </button>
      </div>
      
      <div className="absolute top-4 left-4 pointer-events-none">
        <div className="bg-black/50 backdrop-blur px-3 py-1.5 rounded-full border border-white/10 text-xs text-stone-400">
          {activeCharacterId ? 'Neighborhood View' : 'Overall View'} • Scroll to Zoom • Drag to Pan
        </div>
      </div>
    </div>
  );
};

export default RelationshipGraph;
