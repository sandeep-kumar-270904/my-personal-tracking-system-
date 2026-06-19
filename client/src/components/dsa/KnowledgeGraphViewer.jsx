import React, { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import * as d3 from 'd3';
import { Network, ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import api from '../../services/api';

const KnowledgeGraphViewer = () => {
  const containerRef = useRef(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const zoomBehavior = useRef(null);
  const svgSelection = useRef(null);

  const { data, isLoading } = useQuery({
    queryKey: ['dsa', 'knowledge-graph'],
    queryFn: async () => {
      const res = await api.get('/dsa/knowledge-graph');
      return res.data; // { nodes: [{id, mastery}], links: [{source, target, importance}] }
    }
  });

  useEffect(() => {
    if (!data || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = 400; // fixed height

    // Clear previous
    d3.select(containerRef.current).selectAll('*').remove();

    const svg = d3.select(containerRef.current)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .style('cursor', 'grab');

    const g = svg.append('g');

    // Zoom setup
    zoomBehavior.current = d3.zoom()
      .scaleExtent([0.5, 4])
      .on('zoom', (e) => {
        g.attr('transform', e.transform);
        setZoomLevel(e.transform.k);
      });

    svg.call(zoomBehavior.current);
    svgSelection.current = svg;

    // Simulation
    const simulation = d3.forceSimulation(data.nodes)
      .force('link', d3.forceLink(data.links).id(d => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-400))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(40));

    // Arrows
    svg.append('defs').append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '-0 -5 10 10')
      .attr('refX', 20) // distance from node center
      .attr('refY', 0)
      .attr('orient', 'auto')
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('xoverflow', 'visible')
      .append('svg:path')
      .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
      .attr('fill', '#4b5563');

    // Links
    const link = g.append('g')
      .selectAll('line')
      .data(data.links)
      .join('line')
      .attr('stroke', d => {
        // Highlight bottlenecks: Source is mastered (high), Target is unmastered (low)
        const sourceMastery = d.source.mastery || 0;
        const targetMastery = d.target.mastery || 0;
        if (sourceMastery > 50 && targetMastery < 20) return '#f59e0b'; // Amber glow
        return '#374151'; // default gray
      })
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', d => d.importance === 'REQUIRED' ? 2 : 1)
      .attr('stroke-dasharray', d => d.importance === 'HELPFUL' ? '4,4' : 'none')
      .attr('marker-end', 'url(#arrowhead)');

    // Nodes
    const node = g.append('g')
      .selectAll('g')
      .data(data.nodes)
      .join('g')
      .call(d3.drag()
        .on('start', (e, d) => {
          if (!e.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x; d.fy = d.y;
          svg.style('cursor', 'grabbing');
        })
        .on('drag', (e, d) => {
          d.fx = e.x; d.fy = e.y;
        })
        .on('end', (e, d) => {
          if (!e.active) simulation.alphaTarget(0);
          d.fx = null; d.fy = null;
          svg.style('cursor', 'grab');
        }));

    // Node circles colored by mastery
    node.append('circle')
      .attr('r', 12)
      .attr('fill', d => {
        if (d.mastery >= 80) return '#10b981'; // Green (Mastered)
        if (d.mastery >= 50) return '#3b82f6'; // Blue (Solid)
        if (d.mastery > 0) return '#eab308'; // Yellow (Started)
        return '#374151'; // Gray (Not started)
      })
      .attr('stroke', d => (d.decay > 20 ? '#ef4444' : '#1f2937')) // Red stroke if decaying
      .attr('stroke-width', d => (d.decay > 20 ? 3 : 2));

    // Optional decay pulse ring
    node.filter(d => d.decay > 20)
      .append('circle')
      .attr('r', 16)
      .attr('fill', 'none')
      .attr('stroke', '#ef4444')
      .attr('stroke-width', 1)
      .attr('opacity', 0.5)
      .attr('stroke-dasharray', '2,2');

    // Node labels
    node.append('text')
      .text(d => d.id)
      .attr('x', 16)
      .attr('y', 4)
      .attr('font-size', '10px')
      .attr('fill', '#9ca3af')
      .attr('font-family', 'ui-sans-serif, system-ui, sans-serif');

    // Tick
    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

      node
        .attr('transform', d => `translate(${d.x},${d.y})`);
    });

  }, [data]);

  const handleZoomIn = () => svgSelection.current?.transition().call(zoomBehavior.current.scaleBy, 1.2);
  const handleZoomOut = () => svgSelection.current?.transition().call(zoomBehavior.current.scaleBy, 0.8);
  const handleReset = () => svgSelection.current?.transition().call(zoomBehavior.current.transform, d3.zoomIdentity);

  if (isLoading) return <div className="h-[400px] bg-gray-900 rounded-2xl animate-pulse"></div>;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden relative">
      <div className="absolute top-4 left-4 z-10 bg-gray-900/80 backdrop-blur px-3 py-1.5 rounded-lg border border-gray-700 flex items-center gap-2">
        <Network className="w-4 h-4 text-indigo-400" />
        <span className="text-sm font-bold text-white">Prerequisite Knowledge Graph</span>
      </div>
      
      <div className="absolute bottom-4 right-4 z-10 flex bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
        <button onClick={handleZoomOut} className="p-2 hover:bg-gray-700 text-gray-400"><ZoomOut className="w-4 h-4" /></button>
        <div className="w-px bg-gray-700"></div>
        <button onClick={handleReset} className="p-2 hover:bg-gray-700 text-gray-400"><Maximize className="w-4 h-4" /></button>
        <div className="w-px bg-gray-700"></div>
        <button onClick={handleZoomIn} className="p-2 hover:bg-gray-700 text-gray-400"><ZoomIn className="w-4 h-4" /></button>
      </div>

      <div className="absolute top-4 right-4 z-10 text-xs text-gray-400 bg-gray-900/80 backdrop-blur p-3 rounded-lg border border-gray-800 space-y-2">
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#10b981]"></div> Mastered</div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#3b82f6]"></div> Solid</div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#374151]"></div> Not Started</div>
        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-700"><div className="w-4 h-0.5 bg-[#f59e0b]"></div> Bottleneck Path</div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full border-2 border-red-500 bg-transparent"></div> Knowledge Decay</div>
      </div>

      <div ref={containerRef} className="w-full h-[400px]" />
    </div>
  );
};

export default KnowledgeGraphViewer;
