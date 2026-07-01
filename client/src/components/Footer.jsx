import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, MapPin, Phone, GraduationCap, LayoutDashboard, Briefcase, FileText, Target, BookOpen, Shield, ShieldAlert, Cpu, Flag } from 'lucide-react';
import ReportModal from './ReportModal';

const Footer = () => {
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  return (
    <footer className="w-full bg-[#0a0a0f] border-t border-white/5 pt-16 pb-8 px-6 mt-auto">
      <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
        {/* Brand Section */}
        <div className="space-y-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-[#00f0ff] to-[#0080ff] rounded-lg flex items-center justify-center">
              <GraduationCap className="text-white w-5 h-5" />
            </div>
            <span className="text-xl font-bold text-white tracking-wide">
              Student<span className="text-[#00f0ff]">Tracker</span>
            </span>
          </Link>
          <p className="text-sm text-slate-400 leading-relaxed mt-4">
            Empowering students to track placements, prepare for interviews, and manage their career journey efficiently.
          </p>
        </div>

        {/* Vital Links */}
        <div>
          <h3 className="text-white font-bold mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#00f0ff]" /> Vital Links
          </h3>
          <ul className="space-y-3">
            <li>
              <Link to="/dashboard" className="text-slate-400 hover:text-[#00f0ff] text-sm transition-colors flex items-center gap-2">
                <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
              </Link>
            </li>
            <li>
              <Link to="/applications" className="text-slate-400 hover:text-[#00f0ff] text-sm transition-colors flex items-center gap-2">
                <Briefcase className="w-3.5 h-3.5" /> Applications
              </Link>
            </li>
            <li>
              <Link to="/offers" className="text-slate-400 hover:text-[#00f0ff] text-sm transition-colors flex items-center gap-2">
                <FileText className="w-3.5 h-3.5" /> Offer Tracker
              </Link>
            </li>
            <li>
              <Link to="/research" className="text-slate-400 hover:text-[#00f0ff] text-sm transition-colors flex items-center gap-2">
                <Cpu className="w-3.5 h-3.5" /> Research & Development
              </Link>
            </li>
          </ul>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="text-white font-bold mb-4 flex items-center gap-2">
            <Target className="w-4 h-4 text-purple-400" /> Quick Links
          </h3>
          <ul className="space-y-3">
            <li>
              <Link to="/goals" className="text-slate-400 hover:text-purple-400 text-sm transition-colors flex items-center gap-2">
                <Target className="w-3.5 h-3.5" /> Goals
              </Link>
            </li>
            <li>
              <Link to="/resumes" className="text-slate-400 hover:text-purple-400 text-sm transition-colors flex items-center gap-2">
                <FileText className="w-3.5 h-3.5" /> Resumes
              </Link>
            </li>
            <li>
              <Link to="/resources" className="text-slate-400 hover:text-purple-400 text-sm transition-colors flex items-center gap-2">
                <BookOpen className="w-3.5 h-3.5" /> Resources
              </Link>
            </li>
          </ul>
        </div>

        {/* Get in Touch */}
        <div>
          <h3 className="text-white font-bold mb-4 flex items-center gap-2">
            <Mail className="w-4 h-4 text-emerald-400" /> Get in Touch
          </h3>
          <ul className="space-y-4">
            <li className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
              <span className="text-slate-400 text-sm">
                Anil Neerukonda Institute of Technology & Sciences,<br/>
                Sangivalasa, Bheemunipatnam Mandal,<br/>
                Visakhapatnam Dist., AP, India
              </span>
            </li>
            <li className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-slate-500 shrink-0" />
              <span className="text-slate-400 text-sm">08933-225083, 225084</span>
            </li>
            <li className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-slate-500 shrink-0" />
              <a href="mailto:principal@anits.edu.in" className="text-slate-400 hover:text-emerald-400 text-sm transition-colors">
                principal@anits.edu.in
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="max-w-[1200px] mx-auto pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-slate-500 text-xs text-center md:text-left">
          &copy; {new Date().getFullYear()} Anil Neerukonda Institute of Technology & Sciences. All rights reserved.
        </p>
        <div className="flex items-center gap-4 text-sm text-slate-500">
          <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
          <Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
          <button onClick={() => setIsReportModalOpen(true)} className="flex items-center gap-1 hover:text-rose-400 transition-colors">
            <Flag className="w-3.5 h-3.5" /> Report Issue
          </button>
        </div>
      </div>

      <ReportModal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} />
    </footer>
  );
};

export default Footer;
