import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const NetworkGraphView = ({ applications }) => {
  const svgRef = useRef();

  useEffect(() => {
    if (!applications || applications.length === 0 || !svgRef.current) return;

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    // Clear previous graph
    d3.select(svgRef.current).selectAll("*").remove();

    const nodesMap = new Map();
    const links = [];

    // User node
    nodesMap.set('user', { id: 'user', group: 'user', radius: 20, label: 'You' });

    applications.forEach(app => {
      // Company nodes
      const companyId = `company_${app.company}`;
      if (!nodesMap.has(companyId)) {
        nodesMap.set(companyId, { id: companyId, group: 'company', radius: 15 + Math.random()*5, label: app.company, appCount: 1, status: app.status });
        // Link user to company
        links.push({ source: 'user', target: companyId, value: 2 });
      } else {
        nodesMap.get(companyId).appCount += 1;
      }

      // Resume nodes (mocking for now, or using app.resumeId if populated)
      if (app.resumeId) {
        const resId = `resume_${app.resumeId._id || app.resumeId}`;
        if (!nodesMap.has(resId)) {
          nodesMap.set(resId, { id: resId, group: 'resume', radius: 10, label: app.resumeId.name || 'Resume' });
          links.push({ source: 'user', target: resId, value: 1 });
        }
        links.push({ source: resId, target: companyId, value: 1, isAppLine: true });
      }
    });

    const nodes = Array.from(nodesMap.values());

    const svg = d3.select(svgRef.current)
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .call(d3.zoom().on("zoom", (event) => {
        svgGroup.attr("transform", event.transform);
      }))
      .append("g");

    const svgGroup = svg.append("g");

    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id(d => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide().radius(d => d.radius + 5).iterations(2));

    const link = svgGroup.append("g")
      .attr("stroke", "#ffffff20")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke-width", d => Math.sqrt(d.value));

    const tooltip = d3.select("body").append("div")
      .attr("class", "absolute hidden bg-[#1a1b26] border border-white/10 text-white p-3 rounded-lg shadow-xl text-xs z-50 pointer-events-none")
      .style("opacity", 0);

    const node = svgGroup.append("g")
      .attr("stroke", "#ffffff20")
      .attr("stroke-width", 1.5)
      .selectAll("circle")
      .data(nodes)
      .join("circle")
      .attr("r", d => d.radius)
      .attr("fill", d => {
        if (d.group === 'user') return '#ff6b00';
        if (d.group === 'company') {
          if (d.status === 'OFFER') return '#10b981';
          if (d.status === 'REJECTED') return '#ef4444';
          return '#3b82f6';
        }
        if (d.group === 'resume') return '#8b5cf6';
        return '#64748b';
      })
      .call(drag(simulation))
      .on("mouseover", (event, d) => {
        tooltip.transition().duration(200).style("opacity", 1);
        tooltip.html(`<strong>${d.label}</strong><br/>${d.group === 'company' ? `Apps: ${d.appCount}<br/>Status: ${d.status}` : ''}`)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 28) + "px");
        tooltip.classed("hidden", false);
      })
      .on("mouseout", () => {
        tooltip.transition().duration(500).style("opacity", 0);
        tooltip.classed("hidden", true);
      });

    const labels = svgGroup.append("g")
      .attr("class", "labels")
      .selectAll("text")
      .data(nodes)
      .join("text")
      .attr("dy", d => d.radius + 12)
      .attr("text-anchor", "middle")
      .text(d => d.label)
      .attr("fill", "#94a3b8")
      .attr("font-size", "10px");

    simulation.on("tick", () => {
      link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

      node
        .attr("cx", d => d.x = Math.max(d.radius, Math.min(width - d.radius, d.x)))
        .attr("cy", d => d.y = Math.max(d.radius, Math.min(height - d.radius, d.y)));
        
      labels
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

    return () => {
      tooltip.remove();
    };
  }, [applications]);

  return (
    <div className="w-full h-full bg-[#13141f] rounded-2xl border border-white/5 overflow-hidden">
      <div ref={svgRef} className="w-full h-[calc(100vh-250px)] min-h-[500px]"></div>
    </div>
  );
};

export default NetworkGraphView;
