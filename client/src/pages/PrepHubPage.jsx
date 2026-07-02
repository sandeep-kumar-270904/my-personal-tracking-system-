import { motion } from 'framer-motion';
import { ExternalLink, Code2, Database, Users, Building, Laptop, Video } from 'lucide-react';

const resources = [
  {
    category: "Coding & Algorithms",
    icon: Code2,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    links: [
      { name: "LeetCode", url: "https://leetcode.com", desc: "The gold standard for coding interviews." },
      { name: "NeetCode", url: "https://neetcode.io", desc: "Curated blind 75 & 150 roadmaps." },
      { name: "HackerRank", url: "https://hackerrank.com", desc: "Great for OA practice." }
    ]
  },
  {
    category: "System Design",
    icon: Database,
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
    links: [
      { name: "System Design Primer", url: "https://github.com/donnemartin/system-design-primer", desc: "Comprehensive open-source guide." },
      { name: "ByteByteGo", url: "https://bytebytego.com", desc: "Visual and easy to understand design prep." },
      { name: "Exponent", url: "https://tryexponent.com", desc: "Mock interviews and courses." }
    ]
  },
  {
    category: "Mock Interviews",
    icon: Users,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    links: [
      { name: "Pramp", url: "https://pramp.com", desc: "Free peer-to-peer mock interviews." },
      { name: "Interviewing.io", url: "https://interviewing.io", desc: "Anonymous technical interviews with seniors." },
      { name: "MeetAPeer", url: "https://meetapeer.com", desc: "Connect with peers for practice." }
    ]
  },
  {
    category: "Company Insights",
    icon: Building,
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
    links: [
      { name: "levels.fyi", url: "https://levels.fyi", desc: "Accurate salary data and leveling." },
      { name: "Glassdoor", url: "https://glassdoor.com", desc: "Company reviews and interview questions." },
      { name: "Blind", url: "https://teamblind.com", desc: "Anonymous professional network for real insights." }
    ]
  },
  {
    category: "Behavioral & Resume",
    icon: FileText,
    color: "text-pink-400",
    bg: "bg-pink-500/10",
    border: "border-pink-500/20",
    links: [
      { name: "STAR Method Guide", url: "https://www.themuse.com/advice/star-interview-method", desc: "How to ace behavioral questions." },
      { name: "Resume Worded", url: "https://resumeworded.com", desc: "AI resume scanner and optimizer." },
      { name: "FlowCV", url: "https://flowcv.com", desc: "Free, beautiful resume templates." }
    ]
  },
  {
    category: "CS Fundamentals",
    icon: Laptop,
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/20",
    links: [
      { name: "OS & Networking", url: "https://teachyourselfcs.com", desc: "Guide for self-taught software engineers." },
      { name: "GeeksforGeeks", url: "https://geeksforgeeks.org", desc: "Vast repository of CS concepts." },
      { name: "MIT OpenCourseWare", url: "https://ocw.mit.edu", desc: "Free courses from MIT." }
    ]
  }
];

const PrepHubPage = () => {
  return (
    <div className="relative min-h-screen bg-[#050508] p-4 md:p-8 overflow-hidden">
      {/* Ambient background */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] bg-rose-500/5 rounded-full blur-[150px] pointer-events-none" />
      
      <div className="relative z-10 max-w-7xl mx-auto">
        <header className="mb-10 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
            The Ultimate <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Prep Hub</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            A curated collection of the best real-world resources to help you ace your interviews. No fluff, just what works.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
          {resources.map((section, idx) => (
            <motion.div
              key={section.category}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-[#13141f] border border-white/5 rounded-2xl overflow-hidden hover:border-white/10 transition-colors shadow-xl"
            >
              <div className={`p-5 ${section.bg} border-b ${section.border} flex items-center gap-3`}>
                <section.icon className={`w-6 h-6 ${section.color}`} />
                <h2 className="text-lg font-bold text-white">{section.category}</h2>
              </div>
              <div className="p-3">
                {section.links.map((link, lIdx) => (
                  <a
                    key={lIdx}
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block p-4 rounded-xl hover:bg-white/5 transition-colors group relative"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors">{link.name}</h3>
                      <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed pr-6">{link.desc}</p>
                  </a>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PrepHubPage;
