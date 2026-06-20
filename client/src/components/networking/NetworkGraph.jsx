import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { Search, Filter, Maximize } from 'lucide-react';
import { motion } from 'framer-motion';

const NetworkGraph = ({ contacts = [], onNodeClick }) => {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [onlyStrong, setOnlyStrong] = useState(false);
  const [tooltip, setTooltip] = useState(null);

  // Colors based on contact type
  const colorMap = {
    ALUMNI: '#6366f1', // indigo
    RECRUITER: '#f59e0b', // amber
    ENGINEER: '#0ea5e9', // sky blue
    MENTOR: '#8b5cf6', // violet
    FOUNDER: '#f43f5e', // rose
    PEER: '#64748b', // gray
    SENIOR_STUDENT: '#10b981', // emerald
  };

  const sizeMap = {
    CLOSE: 24,
    STRONG: 18,
    MODERATE: 12,
    WEAK: 8
  };

  const calculateDiversityScore = () => {
    if (!contacts.length) return null;
    const typeCount = {};
    const companyCount = {};
    contacts.forEach(c => {
      typeCount[c.contactType] = (typeCount[c.contactType] || 0) + 1;
      if (c.company) companyCount[c.company] = (companyCount[c.company] || 0) + 1;
    });

    const total = contacts.length;
    const maxType = Math.max(...Object.values(typeCount)) || 0;
    const maxCompany = Math.max(...Object.values(companyCount)) || 0;

    const maxTypePct = Math.round((maxType / total) * 100);
    const maxCompanyPct = Math.round((maxCompany / total) * 100);
    const topType = Object.keys(typeCount).find(k => typeCount[k] === maxType);

    return { maxTypePct, maxCompanyPct, topType };
  };

  const diversity = useMemo(() => calculateDiversityScore(), [contacts]);

  useEffect(() => {
    if (!contacts || contacts.length === 0) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight || 600;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous render

    const filteredContacts = contacts.filter(c => {
      if (onlyStrong && !['STRONG', 'CLOSE'].includes(c.connectionStrength)) return false;
      return true;
    });

    // Create nodes
    const userNode = { id: 'user', isUser: true, name: 'You', radius: 32 };
    
    // Group by company to create clustering forces
    const companyGroups = {};
    let companyIndex = 0;
    filteredContacts.forEach(c => {
      if (c.company && !companyGroups[c.company]) {
        companyGroups[c.company] = companyIndex++;
      }
    });

    const nodes = [
      userNode,
      ...filteredContacts.map(c => ({
        ...c,
        id: c._id,
        radius: sizeMap[c.connectionStrength] || 12,
        companyGroupId: companyGroups[c.company] !== undefined ? companyGroups[c.company] : -1,
        matchSearch: searchTerm ? (c.name?.toLowerCase().includes(searchTerm.toLowerCase()) || c.company?.toLowerCase().includes(searchTerm.toLowerCase())) : true
      }))
    ];

    // Create links (everyone links to user)
    const links = filteredContacts.map(c => ({
      source: 'user',
      target: c._id,
      health: c.relationshipHealthScore || 0,
      daysSinceInteraction: c.lastInteractionAt ? Math.floor((new Date() - new Date(c.lastInteractionAt)) / (1000 * 60 * 60 * 24)) : 999
    }));

    const zoom = d3.zoom()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    const g = svg.append('g');

    // Link styling
    const link = g.append('g')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', d => {
        if (d.health >= 80) return '#34d399'; // green
        if (d.health >= 40 && d.daysSinceInteraction <= 30) return '#94a3b8'; // gray
        return '#ef4444'; // red
      })
      .attr('stroke-width', d => d.health >= 80 ? 3 : d.health >= 40 ? 1.5 : 1)
      .attr('stroke-dasharray', d => (d.health < 40 || d.daysSinceInteraction > 30) ? '4,4' : 'none')
      .attr('stroke-opacity', 0.6);

    // Node styling
    const node = g.append('g')
      .selectAll('circle')
      .data(nodes)
      .join('circle')
      .attr('r', d => d.radius)
      .attr('fill', d => d.isUser ? '#0ea5e9' : (colorMap[d.contactType] || '#94a3b8'))
      .attr('stroke', d => d.isUser ? '#fff' : '#000')
      .attr('stroke-width', 2)
      .attr('opacity', d => {
        if (d.isUser) return 1;
        if (searchTerm && !d.matchSearch) return 0.1;
        return 1;
      })
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended)
      )
      .on('mouseover', (event, d) => {
        if (d.isUser) return;
        setTooltip({
          x: event.pageX,
          y: event.pageY,
          data: d
        });
      })
      .on('mouseout', () => setTooltip(null))
      .on('click', (event, d) => {
        if (!d.isUser && onNodeClick) onNodeClick(d);
      });

    // Label styling
    const labels = g.append('g')
      .selectAll('text')
      .data(nodes)
      .join('text')
      .text(d => d.isUser ? 'YOU' : '')
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .attr('fill', '#fff')
      .attr('text-anchor', 'middle')
      .attr('dy', '.3em')
      .style('pointer-events', 'none');

    // Simulation
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id).distance(d => d.health >= 80 ? 80 : d.health >= 40 ? 150 : 250))
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collide', d3.forceCollide().radius(d => d.radius + 10).iterations(2))
      .force('cluster', forceCluster(nodes, d => d.companyGroupId)); // custom company cluster force

    function forceCluster(nodes, idAccessor) {
      let strength = 0.5;
      let nodesMap = new Map();

      function force(alpha) {
        const clusters = {};
        nodes.forEach(n => {
          const id = idAccessor(n);
          if (id === -1 || n.isUser) return;
          if (!clusters[id] || n.radius > clusters[id].radius) {
            clusters[id] = n;
          }
        });

        nodes.forEach(n => {
          const id = idAccessor(n);
          if (id === -1 || n.isUser) return;
          const cluster = clusters[id];
          if (cluster === n) return;
          const x = n.x - cluster.x;
          const y = n.y - cluster.y;
          let l = Math.sqrt(x * x + y * y);
          const r = n.radius + cluster.radius + 10;
          if (l !== r) {
            l = (l - r) / l * alpha * strength;
            n.x -= x * l;
            n.y -= y * l;
            cluster.x += x * l;
            cluster.y += y * l;
          }
        });
      }
      return force;
    }

    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

      node
        .attr('cx', d => d.x)
        .attr('cy', d => d.y);

      labels
        .attr('x', d => d.x)
        .attr('y', d => d.y);
    });

    // Drag functions
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

    // Reset view function
    window.resetGraphZoom = () => {
      svg.transition().duration(750).call(zoom.transform, d3.zoomIdentity);
    };

    return () => {
      simulation.stop();
      delete window.resetGraphZoom;
    };
  }, [contacts, searchTerm, onlyStrong]);

  return (
    <div className="relative w-full h-[600px] bg-[#0a0a0f] border border-white/5 rounded-xl overflow-hidden flex flex-col" ref={containerRef}>
      
      {/* Graph Toolbar */}
      <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-start pointer-events-none">
        <div className="flex flex-col gap-2 pointer-events-auto">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text"
              placeholder="Search graph nodes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#13141f]/80 backdrop-blur border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500 shadow-lg"
            />
          </div>
          <button 
            onClick={() => setOnlyStrong(!onlyStrong)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border shadow-lg transition-colors w-max ${onlyStrong ? 'bg-blue-500/20 text-blue-400 border-blue-500/50' : 'bg-[#13141f]/80 text-slate-300 border-white/10 hover:bg-white/10'}`}
          >
            <Filter size={14} />
            {onlyStrong ? 'Showing Strong+' : 'Show Strong+'}
          </button>
        </div>
        
        <div className="flex gap-2 pointer-events-auto">
          <button 
            onClick={() => window.resetGraphZoom && window.resetGraphZoom()}
            className="p-2 bg-[#13141f]/80 backdrop-blur border border-white/10 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 shadow-lg"
            title="Reset View"
          >
            <Maximize size={16} />
          </button>
        </div>
      </div>

      {/* Diversity Score overlay */}
      {diversity && (
        <div className="absolute bottom-4 left-4 z-10 bg-[#13141f]/80 backdrop-blur border border-white/10 p-4 rounded-xl max-w-sm pointer-events-auto shadow-lg">
          <h4 className="text-sm font-bold text-white mb-1">Network Diversity</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Your network is {diversity.maxTypePct}% {diversity.topType?.toLowerCase()}s and {diversity.maxCompanyPct}% from one top company. 
            {diversity.maxTypePct > 50 || diversity.maxCompanyPct > 50 ? ' Consider connecting with more recruiters and alumni at diverse companies.' : ' Excellent diversity!'}
          </p>
        </div>
      )}

      {/* SVG Canvas */}
      <svg ref={svgRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Tooltip */}
      <AnimatePresence>
        {tooltip && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed z-50 bg-[#13141f] border border-white/10 rounded-lg p-3 shadow-2xl pointer-events-none"
            style={{ left: tooltip.x + 15, top: tooltip.y + 15 }}
          >
            <p className="text-sm font-bold text-white">{tooltip.data.name}</p>
            <p className="text-xs text-slate-400">{tooltip.data.role} @ {tooltip.data.company}</p>
            <div className="mt-2 pt-2 border-t border-white/5 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-500 block">Health</span>
                <span className={tooltip.data.relationshipHealthScore >= 80 ? 'text-emerald-400' : tooltip.data.relationshipHealthScore >= 40 ? 'text-blue-400' : 'text-red-400'}>
                  {tooltip.data.relationshipHealthScore}/100
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Last Active</span>
                <span className="text-slate-300">
                  {tooltip.data.lastInteractionAt ? new Date(tooltip.data.lastInteractionAt).toLocaleDateString() : 'Never'}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NetworkGraph;
