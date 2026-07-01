import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const NetworkGraph = ({ data }) => {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!data || !data.nodes || !data.edges || data.nodes.length === 0) return;

    const width = 800;
    const height = 500;

    const svg = d3.select(svgRef.current)
      .attr("width", "100%")
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height]);

    svg.selectAll("*").remove();

    const simulation = d3.forceSimulation(data.nodes)
      .force("link", d3.forceLink(data.edges).id(d => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2));

    const link = svg.append("g")
      .attr("stroke", "#ffffff")
      .attr("stroke-opacity", 0.2)
      .selectAll("line")
      .data(data.edges)
      .join("line")
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", d => d.dashes ? "5,5" : "none");

    const node = svg.append("g")
      .selectAll("circle")
      .data(data.nodes)
      .join("circle")
      .attr("r", 15)
      .attr("fill", d => {
        if (d.group === 'company') return '#ff6b00';
        if (d.group === 'application') return '#00f0ff';
        return '#8b5cf6'; // contact
      })
      .call(drag(simulation));

    const text = svg.append("g")
      .selectAll("text")
      .data(data.nodes)
      .join("text")
      .text(d => d.label)
      .attr("font-size", 10)
      .attr("fill", "#ffffff")
      .attr("dx", 18)
      .attr("dy", 4);

    node.append("title")
      .text(d => d.title || d.label);

    simulation.on("tick", () => {
      link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

      node
        .attr("cx", d => d.x)
        .attr("cy", d => d.y);

      text
        .attr("x", d => d.x)
        .attr("y", d => d.y);
    });

    function drag(simulation) {
      function dragstarted(event) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      }
      
      function dragged(event) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      }
      
      function dragended(event) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
      }
      
      return d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
    }

  }, [data]);

  return (
    <div className="w-full bg-[#13141f] border border-white/5 rounded-2xl p-6 overflow-hidden relative">
      <div className="absolute top-4 left-4 flex gap-4">
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#ff6b00]"></div><span className="text-xs text-white">Company</span></div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#8b5cf6]"></div><span className="text-xs text-white">Contact</span></div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#00f0ff]"></div><span className="text-xs text-white">Application</span></div>
      </div>
      {(!data || !data.nodes || data.nodes.length === 0) ? (
        <div className="h-[500px] flex items-center justify-center text-slate-400">No relationships to show.</div>
      ) : (
        <svg ref={svgRef} className="w-full h-[500px] cursor-grab active:cursor-grabbing"></svg>
      )}
    </div>
  );
};

export default NetworkGraph;
