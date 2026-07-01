import { motion, AnimatePresence } from 'framer-motion';
import { Link, Navigate } from 'react-router-dom';
import { 
  ArrowRight, CheckCircle2, TrendingUp, Users, Target, Rocket, Shield, 
  Code2, Play, ChevronRight, Briefcase, MapPin, IndianRupee, Trophy, 
  Star, MessageSquare, Plus, Minus
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';

const DashboardMockup = () => {
  return (
    <div className="relative rounded-2xl overflow-hidden border border-[#2A2F3E] bg-[#0D1117] shadow-2xl transform rotate-x-12 hover:rotate-x-0 transition-transform duration-700 ease-out w-full max-w-[540px] aspect-[4/3] flex flex-col mx-auto">
      {/* Browser Chrome */}
      <div className="h-8 bg-[#161B22] border-b border-[#2A2F3E] flex items-center px-4 gap-2 z-20">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F56]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#27C93F]" />
        </div>
        <div className="ml-4 flex-1 flex justify-center">
          <div className="bg-[#0D1117] rounded text-[10px] text-slate-500 font-mono px-3 py-0.5 border border-[#2A2F3E]">studenttracker.app/dashboard</div>
        </div>
      </div>
      {/* Mockup Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-1/4 bg-[#0A0D12] border-r border-[#1E2330] p-3 flex flex-col gap-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-5 h-5 rounded bg-[#F97316] flex items-center justify-center text-[10px] font-bold text-white">S</div>
            <div className="h-3 w-16 bg-white/20 rounded"></div>
          </div>
          <div className="flex flex-col gap-2">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className={`h-6 rounded flex items-center gap-2 px-2 ${i===1 ? 'bg-[#1A1F2E] border-l-2 border-[#F97316]' : ''}`}>
                <div className={`w-3 h-3 rounded ${i===1 ? 'bg-[#F97316]' : 'bg-slate-600'}`}></div>
                <div className="h-2 w-12 bg-slate-700 rounded"></div>
              </div>
            ))}
          </div>
        </div>
        {/* Main Content */}
        <div className="flex-1 p-4 bg-[#0D1117] flex flex-col gap-4">
          <div className="h-4 w-24 bg-white/20 rounded"></div>
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            {[ {v: '24', l: 'Applications'}, {v: '3', l: 'Interviews'}, {v: '147', l: 'DSA Problems'}, {v: '2', l: 'Offers'} ].map((stat, i) => (
              <div key={i} className="bg-[#1A1F2E] border border-[#2A2F3E] rounded-lg p-3">
                <div className="text-lg font-bold text-white leading-none mb-1">{stat.v}</div>
                <div className="text-[9px] text-slate-400">{stat.l}</div>
              </div>
            ))}
          </div>
          {/* Chart Placeholder */}
          <div className="bg-[#1A1F2E] border border-[#2A2F3E] rounded-lg p-3 flex-1 flex flex-col justify-end gap-1">
            <div className="text-[10px] text-slate-400 mb-2">Application Status</div>
            <div className="flex gap-1 h-2/3 items-end">
              <div className="w-1/4 bg-[#3B82F6] rounded-t" style={{height: '80%'}}></div>
              <div className="w-1/4 bg-[#F59E0B] rounded-t" style={{height: '40%'}}></div>
              <div className="w-1/4 bg-[#10B981] rounded-t" style={{height: '20%'}}></div>
              <div className="w-1/4 bg-[#EF4444] rounded-t" style={{height: '60%'}}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const FAQItem = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border border-[#1E2330] rounded-xl bg-[#0A0D12] overflow-hidden mb-4">
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="w-full flex items-center justify-between p-6 text-left"
      >
        <span className="font-bold text-white text-lg">{question}</span>
        {isOpen ? <Minus className="w-5 h-5 text-[#F97316]" /> : <Plus className="w-5 h-5 text-slate-400" />}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-6 pb-6 text-slate-400 leading-relaxed"
          >
            {answer}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const LandingPage = () => {
  const { user, loading } = useContext(AuthContext);

  if (!loading && user) {
    return <Navigate to="/dashboard" />;
  }

  const typingTexts = ["Dominate Your", "Supercharge Your", "Accelerate Your"];
  const [displayText, setDisplayText] = useState("");
  const [textIndex, setTextIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  
  useEffect(() => {
    let timer;
    const currentText = typingTexts[textIndex];
    
    if (isDeleting) {
      timer = setTimeout(() => {
        setDisplayText(currentText.substring(0, displayText.length - 1));
        if (displayText.length === 0) {
          setIsDeleting(false);
          setTextIndex((prev) => (prev + 1) % typingTexts.length);
        }
      }, 50);
    } else {
      timer = setTimeout(() => {
        setDisplayText(currentText.substring(0, displayText.length + 1));
        if (displayText.length === currentText.length) {
          setTimeout(() => setIsDeleting(true), 2000);
        }
      }, 100);
    }
    return () => clearTimeout(timer);
  }, [displayText, isDeleting, textIndex]);

  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.6 }
  };

  return (
    <div className="min-h-screen bg-[#050508] font-['Plus_Jakarta_Sans'] text-slate-200">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="absolute top-0 right-0 -z-10 translate-x-1/3 -translate-y-1/4">
          <div className="w-[500px] h-[500px] bg-[#F97316]/10 blur-[120px] rounded-full mix-blend-screen" />
        </div>

        <div className="text-center max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: "easeOut" }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#1A1F2E] border border-[#2A2F3E] mb-8 text-sm font-medium hover:bg-[#2A2F3E] transition-colors cursor-pointer">
              <span className="flex h-2 w-2 rounded-full bg-[#F97316] animate-pulse"></span>
              StudentTracker 2.0 is live for the 2026 Batch
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>
            
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight mb-8 leading-[1.1] text-white">
              {displayText} <span className="animate-pulse font-light opacity-50 text-[#F97316]">|</span> <br className="hidden md:block"/>
              <span className="text-[#F97316]">
                {textIndex === 0 ? "Placement Season" : textIndex === 1 ? "Tech Career" : "Job Hunt"}
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-400 max-w-3xl mx-auto mb-12 leading-relaxed font-medium">
              The ultimate mission-control for Indian college students. Track applications, crush DSA goals, and analyze offers in one platform.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
              <Link to="/signup" className="w-full sm:w-auto">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full bg-[#F97316] hover:bg-[#EA6C0A] px-8 py-4 text-lg font-bold text-white rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(249,115,22,0.3)] hover:shadow-[0_0_30px_rgba(249,115,22,0.5)]"
                >
                  Start Tracking Free <ArrowRight className="w-5 h-5" />
                </motion.button>
              </Link>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => document.getElementById('video-showcase').scrollIntoView({ behavior: 'smooth' })}
                className="w-full sm:w-auto bg-transparent border border-[#2A2F3E] hover:bg-[#1A1F2E] px-8 py-4 text-lg font-bold rounded-xl flex items-center justify-center gap-2 transition-colors text-white"
              >
                <Play className="w-5 h-5" fill="currentColor" /> Watch Demo
              </motion.button>
            </div>
          </motion.div>

          <motion.div 
            id="video-showcase"
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
            className="mt-24 relative mx-auto max-w-5xl perspective-1000 scroll-mt-24"
          >
            <DashboardMockup />
            <div className="absolute -inset-4 bg-gradient-to-r from-[#F97316]/20 via-[#F97316]/10 to-transparent blur-3xl -z-10 opacity-50 pointer-events-none" />
          </motion.div>
        </div>
      </section>

      {/* Stats Row */}
      <section className="py-12 border-y border-[#1E2330] bg-[#0D1117] overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-center items-center gap-8 md:gap-16">
          <div className="text-center">
            <p className="text-4xl font-black text-white mb-1">3,200+</p>
            <p className="text-slate-400 font-medium">Students Placed</p>
          </div>
          <div className="hidden md:block w-px h-12 bg-[#1E2330]"></div>
          <div className="text-center">
            <p className="text-4xl font-black text-white mb-1">180+</p>
            <p className="text-slate-400 font-medium">Colleges Reached</p>
          </div>
          <div className="hidden md:block w-px h-12 bg-[#1E2330]"></div>
          <div className="text-center">
            <p className="text-4xl font-black text-white mb-1">₹40L+</p>
            <p className="text-slate-400 font-medium">Average Top CTC</p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="features" className="py-24 relative z-10 bg-[#050508]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeIn} className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">Your Placement Journey, <span className="text-[#F97316]">Streamlined</span></h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">From building your resume to signing your offer letter, we guide you through every single step.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            <div className="hidden md:block absolute top-8 left-0 w-full h-0.5 bg-[#1E2330] z-0" />
            
            {[
              { num: '1', title: 'Build Profile', desc: 'Add your target companies and placement season.' },
              { num: '2', title: 'Track & Prep', desc: 'Log applications and track daily DSA progress.' },
              { num: '3', title: 'Ace Interviews', desc: 'Record mock interview notes and feedback.' },
              { num: '4', title: 'Compare Offers', desc: 'Analyze CTC breakdowns side-by-side.' }
            ].map((step, i) => (
              <motion.div key={i} {...fadeIn} transition={{ delay: 0.1 * (i+1) }} className="relative z-10 text-center group">
                <div className="w-16 h-16 mx-auto rounded-full bg-[#0D1117] border-2 border-[#F97316] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <span className="text-2xl font-bold text-[#F97316]">{step.num}</span>
                </div>
                <h3 className="text-xl font-bold mb-3 text-white">{step.title}</h3>
                <p className="text-slate-400 text-sm">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid - 6 Cards */}
      <section className="py-32 relative z-10 bg-[#0D1117] border-y border-[#1E2330]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeIn} className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">Everything you need to <span className="text-[#F97316]">succeed</span></h2>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Target, title: 'Application Tracker', desc: 'Visualize your job hunt with a Kanban board. Move applications from Applied to Offer seamlessly.' },
              { icon: Code2, title: 'DSA Progress Heatmap', desc: 'Keep track of problems solved across LeetCode and Codeforces with a GitHub-style heatmap.' },
              { icon: MessageSquare, title: 'Interview Experience', desc: 'Log your interview rounds, behavioral questions, and technical challenges for future reference.' },
              { icon: Trophy, title: 'Contest Alerts', desc: 'Never miss an upcoming coding contest. Get unified alerts for all major platforms.' },
              { icon: Briefcase, title: 'Resume Vault', desc: 'Store tailored resumes for different roles and easily attach them to specific job applications.' },
              { icon: TrendingUp, title: 'Offer Analytics', desc: 'Compare CTCs, base pay, and stock options side-by-side to negotiate the best possible compensation.' }
            ].map((feature, i) => (
              <motion.div key={i} {...fadeIn} transition={{ delay: i * 0.1 }} className="bg-[#0A0D12] p-8 border border-[#1E2330] rounded-2xl hover:border-[#F97316]/50 transition-colors group">
                <div className="w-12 h-12 rounded-xl bg-[#F97316]/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-6 h-6 text-[#F97316]" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-slate-400 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* India First Section */}
      <section className="py-24 bg-[#050508] relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div {...fadeIn}>
            <div className="inline-block px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-sm mb-6">
              🇮🇳 Built for Indian Placements
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-8">Not just another tracker.</h2>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto mb-12">We understand the chaos of Indian college placements. That's why we built features specifically for the desis.</p>
            
            <div className="flex flex-wrap justify-center gap-4">
              {[
                { i: IndianRupee, t: 'CTC breakdowns (In-hand vs ESOPs)' },
                { i: Trophy, t: 'On-campus vs Off-campus tags' },
                { i: MapPin, t: 'Bangalore / Pune / Gurgaon filters' },
                { i: Code2, t: 'OA (Online Assessment) tracking' }
              ].map((pill, i) => (
                <div key={i} className="flex items-center gap-3 bg-[#1A1F2E] border border-[#2A2F3E] rounded-full px-6 py-3">
                  <pill.i className="w-5 h-5 text-[#F97316]" />
                  <span className="text-white font-medium">{pill.t}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* College Leaderboard Preview */}
      <section id="leaderboard" className="py-24 bg-[#0D1117] border-y border-[#1E2330]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <motion.div {...fadeIn} className="lg:w-1/2">
              <h2 className="text-4xl font-bold text-white mb-6">College Leaderboard</h2>
              <p className="text-xl text-slate-400 mb-8">See how your college ranks against the rest of India. Track collective placement stats and get inspired by top performers from your own campus.</p>
              <ul className="space-y-4 mb-8">
                {['Highest packages grabbed', 'Most active DSA solvers', 'Top placement rates'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-300">
                    <CheckCircle2 className="w-5 h-5 text-[#F97316]" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
            
            <motion.div {...fadeIn} transition={{ delay: 0.2 }} className="lg:w-1/2 w-full">
              <div className="bg-[#0A0D12] border border-[#1E2330] rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6 border-b border-[#1E2330] pb-4">
                  <h3 className="text-lg font-bold text-white">Top Colleges 2026</h3>
                  <span className="text-sm font-medium text-[#F97316]">View All</span>
                </div>
                <div className="space-y-4">
                  {[
                    { rank: 1, name: 'BITS Pilani', score: '9,450 pts' },
                    { rank: 2, name: 'IIT Roorkee', score: '8,210 pts' },
                    { rank: 3, name: 'NIT Trichy', score: '7,980 pts' },
                    { rank: 4, name: 'VIT Vellore', score: '6,450 pts' }
                  ].map((college) => (
                    <div key={college.rank} className="flex items-center justify-between p-3 rounded-lg bg-[#1A1F2E] border border-[#2A2F3E]">
                      <div className="flex items-center gap-4">
                        <span className={`font-bold w-6 text-center ${college.rank === 1 ? 'text-yellow-500' : college.rank === 2 ? 'text-slate-300' : college.rank === 3 ? 'text-orange-400' : 'text-slate-500'}`}>#{college.rank}</span>
                        <span className="text-white font-medium">{college.name}</span>
                      </div>
                      <span className="text-slate-400 text-sm font-mono">{college.score}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-[#050508]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeIn} className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">Simple Pricing. <span className="text-[#F97316]">No BS.</span></h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">We believe in making powerful tools accessible to every student.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Tier */}
            <motion.div {...fadeIn} className="bg-[#0D1117] border border-[#1E2330] rounded-3xl p-8 flex flex-col">
              <h3 className="text-2xl font-bold text-white mb-2">Basic</h3>
              <p className="text-slate-400 mb-6">Perfect for getting started</p>
              <div className="mb-8">
                <span className="text-5xl font-black text-white">₹0</span>
                <span className="text-slate-400">/forever</span>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                {['Track up to 50 applications', 'Basic DSA heatmap', '1 Resume storage', 'Community access'].map((feat, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-300">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" /> {feat}
                  </li>
                ))}
              </ul>
              <Link to="/signup" className="w-full">
                <button className="w-full py-4 rounded-xl border border-[#2A2F3E] text-white font-bold hover:bg-[#1A1F2E] transition-colors">Start Free</button>
              </Link>
            </motion.div>

            {/* Pro Tier */}
            <motion.div {...fadeIn} transition={{ delay: 0.1 }} className="bg-[#0A0D12] border-2 border-[#F97316] rounded-3xl p-8 flex flex-col relative transform md:-translate-y-4 shadow-[0_0_40px_rgba(249,115,22,0.15)]">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#F97316] text-white px-4 py-1 rounded-full text-sm font-bold">MOST POPULAR</div>
              <h3 className="text-2xl font-bold text-white mb-2">Pro</h3>
              <p className="text-slate-400 mb-6">For the serious job hunter</p>
              <div className="mb-8">
                <span className="text-5xl font-black text-white">₹199</span>
                <span className="text-slate-400">/year</span>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                {['Unlimited applications', 'Advanced DSA analytics', 'Unlimited Resumes', 'Offer negotiation insights', 'Priority support'].map((feat, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-300">
                    <CheckCircle2 className="w-5 h-5 text-[#F97316]" /> {feat}
                  </li>
                ))}
              </ul>
              <Link to="/signup" className="w-full">
                <button className="w-full py-4 rounded-xl bg-[#F97316] text-white font-bold hover:bg-[#EA6C0A] transition-colors shadow-[0_0_20px_rgba(249,115,22,0.3)]">Upgrade to Pro</button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-[#0D1117] border-t border-[#1E2330]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeIn} className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-6">Frequently Asked Questions</h2>
          </motion.div>
          
          <div className="space-y-2">
            {[
              { q: 'Is my data secure?', a: 'Yes! We use industry-standard encryption and will never sell your data to third parties. Your offers and application statuses are private to you.' },
              { q: 'Can I import my data from an Excel sheet?', a: 'We are currently building a CSV import feature in Phase 6 which will allow you to bulk-upload your existing application tracker.' },
              { q: 'Does it work for off-campus placements?', a: 'Absolutely. StudentTracker is designed for both on-campus drives and off-campus hunting, complete with specific tags.' },
              { q: 'What payment methods do you accept?', a: 'For Pro users, we accept UPI, Credit/Debit cards, and Net Banking via Razorpay.' }
            ].map((faq, i) => (
              <FAQItem key={i} question={faq.q} answer={faq.a} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 border-t border-[#1E2330] bg-[#050508] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#F97316]/5"></div>
        <div className="max-w-[800px] mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Ready to Take Control of Your Career?</h2>
          <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
            Join thousands of students who are already using StudentTracker to organize their placements, prepare for interviews, and land their dream jobs.
          </p>
          <Link to="/signup" className="inline-flex items-center justify-center gap-2 bg-[#F97316] hover:bg-[#EA580C] text-white px-8 py-4 rounded-xl font-bold text-lg transition-colors shadow-lg shadow-[#F97316]/20">
            Get Started for Free <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="mt-4 text-sm text-slate-500">No credit card required. Setup takes 2 minutes.</p>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default LandingPage;
