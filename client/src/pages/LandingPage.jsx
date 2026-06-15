import { motion } from 'framer-motion';
import { Link, Navigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2, TrendingUp, Users, Target, Rocket, Shield, Code2, Play, Pause, Volume2, VolumeX, Star, ChevronRight } from 'lucide-react';
import Navbar from '../components/Navbar';
import { useContext, useState, useRef, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';

const CustomVideoPlayer = ({ src }) => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  const togglePlay = (e) => {
    e.preventDefault();
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = (e) => {
    e.preventDefault();
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <div 
      className="relative rounded-2xl overflow-hidden border border-white/10 shadow-[0_0_100px_rgba(255,0,123,0.15)] transform rotate-x-12 hover:rotate-x-0 transition-transform duration-700 ease-out bg-[#050508] aspect-[16/9] group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Top Bar */}
      <div className="absolute top-0 inset-x-0 h-8 bg-white/5 border-b border-white/10 flex items-center px-4 gap-2 z-20 backdrop-blur-md transition-opacity duration-300">
        <div className="w-3 h-3 rounded-full bg-red-500/80" />
        <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
        <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
        <div className="ml-4 text-xs text-slate-400 font-mono">smart-tracker-demo.mp4</div>
      </div>

      {/* Video Element */}
      <video 
        ref={videoRef}
        autoPlay 
        loop 
        muted={isMuted} 
        playsInline 
        className="w-full h-full object-cover pt-8"
      >
        <source src="/demo.mp4" type="video/mp4" />
        <source src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4" type="video/mp4" />
      </video>

      {/* Play/Pause Overlay */}
      <div className={`absolute inset-0 pt-8 flex items-center justify-center z-10 transition-all duration-300 ${!isPlaying ? 'bg-black/40 backdrop-blur-sm' : isHovered ? 'bg-black/10' : 'bg-transparent pointer-events-none'}`}>
        <button 
          onClick={togglePlay}
          className={`w-20 h-20 rounded-full bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-center text-white transition-all duration-300 hover:scale-110 hover:bg-[#ff007b]/40 hover:border-[#ff007b] ${!isPlaying || isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'}`}
        >
          {isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />}
        </button>
      </div>

      {/* Bottom Controls */}
      <div className={`absolute bottom-0 inset-x-0 p-6 flex items-end justify-end z-20 transition-opacity duration-300 ${isHovered || !isPlaying ? 'opacity-100' : 'opacity-0'}`}>
        <button 
          onClick={toggleMute}
          className="w-12 h-12 rounded-xl bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center text-white transition-all duration-300 hover:bg-white/20 hover:scale-105"
        >
          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
      </div>
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
    <div className="min-h-screen bg-mesh font-['Plus_Jakarta_Sans'] text-slate-200 selection:bg-[#ff007b]/30">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Animated Background Blobs */}
        <div className="absolute top-0 right-0 -z-10 translate-x-1/3 -translate-y-1/4">
          <div className="w-[500px] h-[500px] bg-[#ff6b00]/20 blur-[120px] rounded-full mix-blend-screen animate-pulse" />
        </div>
        <div className="absolute bottom-0 left-0 -z-10 -translate-x-1/3 translate-y-1/4">
          <div className="w-[600px] h-[600px] bg-[#00f0ff]/20 blur-[150px] rounded-full mix-blend-screen animate-pulse" style={{ animationDelay: '2s' }} />
        </div>
        <div className="absolute top-1/2 left-1/2 -z-10 -translate-x-1/2 -translate-y-1/2">
          <div className="w-[800px] h-[800px] bg-[#ff007b]/10 blur-[150px] rounded-full mix-blend-screen" />
        </div>

        <div className="text-center max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-8 text-sm font-medium hover:bg-white/10 transition-colors cursor-pointer">
              <span className="flex h-2 w-2 rounded-full bg-[#00f0ff] animate-pulse"></span>
              Placement Tracker v2.0 is live
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>
            
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight mb-8 leading-[1.1]">
              {displayText} <span className="animate-pulse font-light opacity-50">|</span> <br className="hidden md:block"/>
              <span className="text-gradient">
                {textIndex === 0 ? "Placement Season" : textIndex === 1 ? "Tech Career" : "Job Hunt"}
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-400 max-w-3xl mx-auto mb-12 leading-relaxed font-light">
              The ultimate mission-control for your career. Track applications, crush DSA goals, and analyze offers in one beautifully crafted platform.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
              <Link to="/signup">
                <button className="w-full sm:w-auto relative inline-flex h-14 overflow-hidden rounded-xl p-[2px] focus:outline-none group">
                  <span className="absolute inset-[-1000%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#ff6b00_0%,#ff007b_50%,#00f0ff_100%)]" />
                  <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-xl bg-slate-950/90 hover:bg-slate-950 px-8 py-4 text-lg font-bold text-white backdrop-blur-3xl transition-colors gap-2">
                    Start Tracking Free <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </button>
              </Link>
              <button 
                onClick={() => document.getElementById('video-showcase').scrollIntoView({ behavior: 'smooth' })}
                className="w-full sm:w-auto btn-secondary px-8 py-4 text-lg flex items-center justify-center gap-2 hover:border-white/30 transition-colors"
              >
                <Play className="w-5 h-5" fill="currentColor" /> Watch Demo
              </button>
            </div>
          </motion.div>

          {/* Platform Video Showcase */}
          <motion.div 
            id="video-showcase"
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
            className="mt-24 relative mx-auto max-w-5xl perspective-1000 scroll-mt-24"
          >
            <CustomVideoPlayer src="https://drive.google.com/uc?export=download&id=18dGMWdVbYhvC-mwR2Sr1fAESe5M4djW-" />
            {/* Ambient shadow for mockup */}
            <div className="absolute -inset-4 bg-gradient-to-r from-[#ff6b00]/20 via-[#ff007b]/20 to-[#00f0ff]/20 blur-3xl -z-10 opacity-50 pointer-events-none" />
          </motion.div>
        </div>
      </section>

      {/* Trusted By Marquee */}
      <section className="py-12 border-y border-white/5 bg-white/[0.02] overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 text-center mb-8">
          <p className="text-sm font-semibold tracking-widest text-slate-500 uppercase">Trusted by students placed at</p>
        </div>
        <div className="flex gap-16 items-center justify-center opacity-50 grayscale animate-[marquee_20s_linear_infinite] whitespace-nowrap">
          {/* Mock Logos - purely textual for aesthetics */}
          {['GOOGLE', 'AMAZON', 'MICROSOFT', 'META', 'APPLE', 'NETFLIX', 'UBER'].map((company, i) => (
            <span key={i} className="text-2xl font-black tracking-tighter text-slate-400 inline-block px-8">{company}</span>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-32 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeIn} className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Everything you need to <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00f0ff] to-[#ff007b]">succeed</span></h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">Stop using messy spreadsheets. Bring your entire placement workflow into one unified, intelligent workspace.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <motion.div {...fadeIn} className="glass-card border border-white/5 p-8 rounded-3xl group hover:-translate-y-2 hover:bg-white/[0.05] hover:shadow-[0_8px_30px_rgba(255,107,0,0.15)] transition-all duration-300">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#ff6b00] to-[#ff007b] p-[1px] mb-8">
                <div className="w-full h-full bg-[#0a0a0f] rounded-xl flex items-center justify-center group-hover:bg-transparent transition-colors">
                  <Target className="w-7 h-7 text-[#ff6b00] group-hover:text-white transition-colors" />
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-white">Application Tracker</h3>
              <p className="text-slate-400 leading-relaxed text-lg">Visualize your job hunt with a Kanban board. Move applications from 'Applied' to 'Offer' seamlessly.</p>
            </motion.div>

            <motion.div {...fadeIn} transition={{ delay: 0.1 }} className="glass-card border border-white/5 p-8 rounded-3xl group hover:-translate-y-2 hover:bg-white/[0.05] hover:shadow-[0_8px_30px_rgba(255,0,123,0.15)] transition-all duration-300">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#ff007b] to-[#00f0ff] p-[1px] mb-8">
                <div className="w-full h-full bg-[#0a0a0f] rounded-xl flex items-center justify-center group-hover:bg-transparent transition-colors">
                  <Code2 className="w-7 h-7 text-[#ff007b] group-hover:text-white transition-colors" />
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-white">DSA & Contests</h3>
              <p className="text-slate-400 leading-relaxed text-lg">Keep track of problems solved and upcoming coding contests on CodeChef, Codeforces, and LeetCode.</p>
            </motion.div>

            <motion.div {...fadeIn} transition={{ delay: 0.2 }} className="glass-card border border-white/5 p-8 rounded-3xl group hover:-translate-y-2 hover:bg-white/[0.05] hover:shadow-[0_8px_30px_rgba(0,240,255,0.15)] transition-all duration-300 lg:col-span-1 md:col-span-2">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#00f0ff] to-[#ff6b00] p-[1px] mb-8">
                <div className="w-full h-full bg-[#0a0a0f] rounded-xl flex items-center justify-center group-hover:bg-transparent transition-colors">
                  <TrendingUp className="w-7 h-7 text-[#00f0ff] group-hover:text-white transition-colors" />
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-white">Offer Analytics</h3>
              <p className="text-slate-400 leading-relaxed text-lg">Compare CTCs, base pay, and stock options side-by-side to make the most informed career choices.</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 relative z-10 bg-[#050508]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeIn} className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Your Placement Journey, <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff007b] to-[#ff6b00]">Streamlined</span></h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">From building your resume to signing your offer letter, we guide you through every single step.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            {/* Connecting Line */}
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-y-1/2 z-0" />
            
            {/* Step 1 */}
            <motion.div {...fadeIn} transition={{ delay: 0.1 }} className="relative z-10 text-center group">
              <div className="w-16 h-16 mx-auto rounded-full bg-[#0a0a0f] border-2 border-[#ff6b00] flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(255,107,0,0.3)] group-hover:scale-110 transition-transform">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h3 className="text-xl font-bold mb-3">Build Profile</h3>
              <p className="text-slate-400 text-sm">Upload multiple resumes and set your target roles and dream companies.</p>
            </motion.div>

            {/* Step 2 */}
            <motion.div {...fadeIn} transition={{ delay: 0.2 }} className="relative z-10 text-center group">
              <div className="w-16 h-16 mx-auto rounded-full bg-[#0a0a0f] border-2 border-[#ff007b] flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(255,0,123,0.3)] group-hover:scale-110 transition-transform">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h3 className="text-xl font-bold mb-3">Track & Prep</h3>
              <p className="text-slate-400 text-sm">Log applications on the Kanban board and track your daily DSA progress.</p>
            </motion.div>

            {/* Step 3 */}
            <motion.div {...fadeIn} transition={{ delay: 0.3 }} className="relative z-10 text-center group">
              <div className="w-16 h-16 mx-auto rounded-full bg-[#0a0a0f] border-2 border-[#00f0ff] flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(0,240,255,0.3)] group-hover:scale-110 transition-transform">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h3 className="text-xl font-bold mb-3">Ace Interviews</h3>
              <p className="text-slate-400 text-sm">Record mock interview notes, feedback, and calendar schedules.</p>
            </motion.div>

            {/* Step 4 */}
            <motion.div {...fadeIn} transition={{ delay: 0.4 }} className="relative z-10 text-center group">
              <div className="w-16 h-16 mx-auto rounded-full bg-[#0a0a0f] border-2 border-emerald-500 flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(16,185,129,0.3)] group-hover:scale-110 transition-transform">
                <span className="text-2xl font-bold text-white">4</span>
              </div>
              <h3 className="text-xl font-bold mb-3">Compare Offers</h3>
              <p className="text-slate-400 text-sm">Analyze CTC breakdowns side-by-side to make the best career decision.</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-32 relative z-10 bg-gradient-to-b from-[#050508] to-[#0a0a0f]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeIn} className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Loved by Top <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00f0ff] to-[#00ff88]">Engineers</span></h2>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <motion.div {...fadeIn} transition={{ delay: 0.1 }} className="glass-card p-8 border-white/10 hover:border-[#ff6b00]/50 transition-colors">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_,i) => <Star key={i} className="w-5 h-5 text-yellow-500 fill-yellow-500" />)}
              </div>
              <p className="text-lg text-slate-300 italic mb-6">"Before StudentTracker, I was losing track of which companies I applied to. The Kanban board and DSA tracker helped me stay organized and eventually land an offer at Amazon."</p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#ff6b00] to-[#ff007b] flex items-center justify-center text-white font-bold text-xl">S</div>
                <div>
                  <h4 className="font-bold text-white">Sandeep Kumar</h4>
                  <p className="text-sm text-slate-500">SDE-1 at Amazon</p>
                </div>
              </div>
            </motion.div>

            <motion.div {...fadeIn} transition={{ delay: 0.2 }} className="glass-card p-8 border-white/10 hover:border-[#00f0ff]/50 transition-colors">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_,i) => <Star key={i} className="w-5 h-5 text-yellow-500 fill-yellow-500" />)}
              </div>
              <p className="text-lg text-slate-300 italic mb-6">"The UI is absolutely gorgeous. It makes the stressful process of placement tracking actually feel rewarding. Highly recommend it to all CS students."</p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#00f0ff] to-[#ff007b] flex items-center justify-center text-white font-bold text-xl">P</div>
                <div>
                  <h4 className="font-bold text-white">Priya Patel</h4>
                  <p className="text-sm text-slate-500">Frontend Engineer</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#ff007b]/10" />
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <motion.div {...fadeIn}>
            <h2 className="text-5xl md:text-7xl font-black mb-8 tracking-tight">Ready to land your <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff6b00] to-[#ff007b]">dream job?</span></h2>
            <p className="text-2xl text-slate-400 mb-12 font-light">Join thousands of students optimizing their career trajectory today.</p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link to="/signup">
                <button className="w-full sm:w-auto relative inline-flex h-16 overflow-hidden rounded-xl p-[2px] focus:outline-none group">
                  <span className="absolute inset-[-1000%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#ff6b00_0%,#ff007b_50%,#00f0ff_100%)]" />
                  <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-xl bg-slate-950/90 hover:bg-slate-950 px-12 py-5 text-xl font-bold text-white backdrop-blur-3xl transition-colors shadow-[0_0_40px_rgba(255,107,0,0.5)]">
                    <Rocket className="w-6 h-6 mr-3 inline-block group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    Launch Your Career
                  </span>
                </button>
              </Link>
              <Link to="/login">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full sm:w-auto btn-secondary px-12 py-5 text-xl font-bold bg-white/5 hover:bg-white/10 border-white/10 hover:border-white/20"
                >
                  Sign In to Dashboard
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-[#050508] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ff6b00] to-[#ff007b] flex items-center justify-center shadow-lg shadow-[#ff6b00]/20">
              <span className="font-bold text-white text-xl">S</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-white">StudentTracker</span>
          </div>
          <p className="text-slate-500 font-medium">© {new Date().getFullYear()} StudentTracker. Built for students.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
