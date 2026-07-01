import React from 'react';
import { motion } from 'framer-motion';
import { 
  Cpu, Zap, Monitor, Database, Settings, FlaskConical, Building2, Calculator, Atom, BookOpen, ExternalLink, ChevronRight
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const disciplines = [
  { name: 'Electronics & Communication Engineering', icon: Cpu, color: 'text-blue-400', link: '#' },
  { name: 'Electrical & Electronics Engineering', icon: Zap, color: 'text-amber-400', link: '#' },
  { name: 'Computer Science & Engineering', icon: Monitor, color: 'text-emerald-400', link: '#' },
  { name: 'Information Technology', icon: Database, color: 'text-[#00f0ff]', link: '#' },
  { name: 'Mechanical Engineering', icon: Settings, color: 'text-slate-400', link: '#' },
  { name: 'Chemical Engineering', icon: FlaskConical, color: 'text-purple-400', link: '#' },
  { name: 'Civil Engineering', icon: Building2, color: 'text-orange-400', link: '#' },
  { name: 'Mathematics', icon: Calculator, color: 'text-pink-400', link: '#' },
  { name: 'Physics', icon: Atom, color: 'text-indigo-400', link: '#' },
  { name: 'Chemistry', icon: FlaskConical, color: 'text-teal-400', link: '#' },
  { name: 'English', icon: BookOpen, color: 'text-red-400', link: '#' }
];

const sidebarLinks = [
  'Profile',
  'Research and Development Policy',
  'Research Committee',
  'Facilities',
  'Research Advisory Board',
  'Faculty Pursuing Ph.D',
  'Faculty Recognized as Ph.D Guides',
  'Faculty Research Groups',
  'Publications',
  'Seed Money',
  'Institutional Ethics Policy',
  'Patents',
  'MoUs',
  'Events',
  'Gallery'
];

const ResearchPage = () => {
  return (
    <div className="min-h-screen bg-[#010409] flex flex-col font-sans text-slate-300">
      <Navbar />
      
      {/* Hero Header */}
      <div className="relative pt-24 pb-12 overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 bg-gradient-to-b from-[#00f0ff]/10 to-transparent"></div>
        <div className="max-w-[1400px] mx-auto px-6 relative z-10 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-[#13141f] border border-white/10 rounded-2xl flex items-center justify-center mb-6 shadow-2xl shadow-[#00f0ff]/20">
            <Cpu className="w-8 h-8 text-[#00f0ff]" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
            Research and Development Cell
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl">
            ANITS
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 max-w-[1400px] mx-auto w-full px-6 py-12 flex flex-col lg:flex-row gap-12">
        
        {/* Sidebar */}
        <aside className="lg:w-64 shrink-0">
          <div className="sticky top-24 bg-[#13141f] border border-white/5 rounded-xl overflow-hidden shadow-2xl">
            <div className="flex flex-col divide-y divide-white/5">
              {sidebarLinks.map((link, idx) => (
                <button 
                  key={idx}
                  className={`text-left px-5 py-3.5 text-sm transition-colors flex items-center justify-between group ${
                    idx === 0 
                      ? 'bg-white/5 text-white font-bold border-l-2 border-[#00f0ff]' 
                      : 'text-slate-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {link}
                  <ChevronRight className={`w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity ${idx === 0 ? 'opacity-100 text-[#00f0ff]' : ''}`} />
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 min-w-0 space-y-12">
          
          <section className="bg-[#13141f] border border-white/5 p-8 rounded-2xl shadow-xl">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <BookOpen className="w-6 h-6 text-[#00f0ff]" />
              Overview
            </h2>
            <div className="space-y-6 text-sm leading-relaxed text-slate-300">
              <p>
                Research is the backbone of academics. It simplifies concept building and transforms new ideas into innovations in pursuance of a new era of passion for researches. Each finding gives immense pleasure and multiplies enthusiasm towards achieving target.
              </p>
              <p>
                The Research and Development Cell aims to nurture research culture in the College by promoting research in newly emerging and challenging areas of Engineering, Technology, Science and Humanities. It encourages the students and faculty to undertake the research in newly emerging frontier areas of Engineering, Technology, Science and Humanities fields including multidisciplinary fields. This enhances the general research capability of budding technocrats by way of participating in conferences, seminars, workshops, project competition, etc.
              </p>
              
              <h3 className="text-lg font-bold text-white mt-8 mb-4">The Research and Development Cell is functioning with the following objectives:</h3>
              <ul className="space-y-3 list-disc pl-5 text-slate-400">
                <li>To create awareness and opportunities in Research and Development among the students & faculty and to create Research and Development atmosphere in every department;</li>
                <li>To create interest and atmosphere among the staff members to take up Research projects and improve their knowledge, skills and qualifications by registering Ph.D's;</li>
                <li>To motivate the faculty members of the group for R&D activities in the area of their specialization;</li>
                <li>To encourage staff members and students to publish technical papers for publishing in National and reputed International Conferences/Journals;</li>
                <li>To encourage faculty members of all the disciplines in Engineering/Science/Humanities in R&D activities for their professional growth;</li>
                <li>To undertake research activities and development projects offered by agencies such as ISRO, DRDO, CSIR, DST, AICTE, UGC, DBT, INFOSYS etc.</li>
                <li>To assist the students to apply funding for conducting research under student project scheme to various funding agencies like TNSCST, IE(I), DRDO, TCS, Infosys etc.;</li>
                <li>To assist for applying and getting funds for conducting Seminar/Workshop/FDP from various available funding agencies;</li>
                <li>To facilitate the growth of research activity among the academic community, including developing mechanisms and targets to achieve this;</li>
                <li>To develop and coordinate strategies for maximizing the faculty's success in gaining external research funding;</li>
                <li>To maintain and disseminate current information about relevant research policy areas and initiatives in government, in the professions and in relevant industries, including external funding opportunities;</li>
                <li>To develop strategies to foster research collaborations within the faculty, across faculty and institutes, and with agencies outside the college;</li>
                <li>To work with various departments to establish and develop faculty research priorities on interdisciplinary areas;</li>
                <li>To interact with industry, government, professions and the wider community on all research matters promote faculty research activities to external stakeholders;</li>
                <li>To coordinate faculty level workshops and staff development activities on research-related issues;</li>
                <li>To encourage development of activities to attract the best research oriented higher degree students;</li>
                <li>To maintain effective links with government departments, authorities, business, and commerce and industry organizations relevant to the college research activities.</li>
              </ul>

              <p className="mt-8">
                In order to promote research and development activities, the college extends its full support to students/faculty/staff. Full/Partial financial support is given to all innovative research & development works taken up by the students, faculty and staff members. The college encourages students, faculty and staff to participate in National/International Conferences, Training programmes, Tech-Festivals organized by reputed institutes (IITs/NITs/State Engg. Colleges etc.) by giving full/partial financial support viz. course/registration fee, TA/DA etc.
              </p>
            </div>
          </section>

          <section className="text-center pt-8">
            <h2 className="text-2xl font-bold text-white mb-2">Research Disciplines</h2>
            <p className="text-sm text-slate-400 mb-10">The Research and Development cell of the College is working on the following research disciplines.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {disciplines.map((discipline, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-[#13141f] border border-white/5 hover:border-white/10 p-8 rounded-2xl flex flex-col items-center justify-center text-center group cursor-pointer transition-all hover:-translate-y-1 shadow-lg hover:shadow-2xl"
                >
                  <div className={`w-14 h-14 rounded-xl bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform ${discipline.color}`}>
                    <discipline.icon className="w-7 h-7" />
                  </div>
                  <h3 className="font-bold text-slate-200 mb-4 group-hover:text-white transition-colors">{discipline.name}</h3>
                  <a href={discipline.link} className="text-xs font-bold text-[#00f0ff] uppercase tracking-wider flex items-center gap-1 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all">
                    View Publications <ExternalLink className="w-3 h-3" />
                  </a>
                </motion.div>
              ))}
            </div>
          </section>

        </main>
      </div>

      <Footer />
    </div>
  );
};

export default ResearchPage;
