import React, { useState } from 'react';
import { Page, Text, View, Document, StyleSheet, PDFViewer, Link, Font } from '@react-pdf/renderer';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, Download, DownloadCloud, FileText, Briefcase, GraduationCap, Code, ArrowLeft, Shield, Plus, Trash2, X, CheckCircle, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';

// Register a standard clean ATS-friendly font
// Font.register({ family: 'Inter', src: 'http://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfMZhrib2Bg-4.ttf' });

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 30,
    fontFamily: 'Helvetica', // Standard safe ATS font
  },
  headerName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 5,
  },
  headerContact: {
    fontSize: 10,
    color: '#333333',
    textAlign: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000000',
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
    marginBottom: 10,
    marginTop: 10,
    textTransform: 'uppercase',
  },
  experienceBlock: {
    marginBottom: 10,
  },
  companyName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000000',
  },
  roleTitle: {
    fontSize: 11,
    fontStyle: 'italic',
    color: '#333333',
  },
  dateLocationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  dateLocationText: {
    fontSize: 10,
    color: '#555555',
  },
  bulletPoint: {
    fontSize: 10,
    color: '#000000',
    marginBottom: 3,
    paddingLeft: 10,
  },
  educationBlock: {
    marginBottom: 10,
  },
  schoolName: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  degreeText: {
    fontSize: 11,
  },
  skillsText: {
    fontSize: 10,
    lineHeight: 1.5,
  }
});

const ATSResumeDocument = ({ data }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View>
        <Text style={styles.headerName}>{data.personalInfo.name}</Text>
        <Text style={styles.headerContact}>
          {data.personalInfo.email} • {data.personalInfo.phone} • {data.personalInfo.linkedin} • {data.personalInfo.github}
        </Text>
      </View>

      {/* Experience */}
      <View>
        <Text style={styles.sectionTitle}>Experience</Text>
        {data.experience.map((exp, index) => (
          <View key={index} style={styles.experienceBlock}>
            <View style={styles.dateLocationRow}>
              <Text style={styles.companyName}>{exp.company}</Text>
              <Text style={styles.dateLocationText}>{exp.date}</Text>
            </View>
            <View style={styles.dateLocationRow}>
              <Text style={styles.roleTitle}>{exp.role}</Text>
              <Text style={styles.dateLocationText}>{exp.location}</Text>
            </View>
            {exp.bullets.map((bullet, bIdx) => (
              <Text key={bIdx} style={styles.bulletPoint}>• {bullet}</Text>
            ))}
          </View>
        ))}
      </View>

      {/* Projects */}
      <View>
        <Text style={styles.sectionTitle}>Projects</Text>
        {data.projects.map((proj, index) => (
          <View key={index} style={styles.experienceBlock}>
            <View style={styles.dateLocationRow}>
              <Text style={styles.companyName}>{proj.name}</Text>
              <Text style={styles.dateLocationText}>{proj.tech}</Text>
            </View>
            {proj.bullets.map((bullet, bIdx) => (
              <Text key={bIdx} style={styles.bulletPoint}>• {bullet}</Text>
            ))}
          </View>
        ))}
      </View>

      {/* Education */}
      <View>
        <Text style={styles.sectionTitle}>Education</Text>
        {data.education.map((edu, index) => (
          <View key={index} style={styles.educationBlock}>
            <View style={styles.dateLocationRow}>
              <Text style={styles.schoolName}>{edu.school}</Text>
              <Text style={styles.dateLocationText}>{edu.date}</Text>
            </View>
            <View style={styles.dateLocationRow}>
              <Text style={styles.degreeText}>{edu.degree}</Text>
              <Text style={styles.dateLocationText}>GPA: {edu.gpa}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Skills */}
      <View>
        <Text style={styles.sectionTitle}>Technical Skills</Text>
        <Text style={styles.skillsText}><Text style={{fontWeight: 'bold'}}>Languages:</Text> {data.skills.languages}</Text>
        <Text style={styles.skillsText}><Text style={{fontWeight: 'bold'}}>Frameworks:</Text> {data.skills.frameworks}</Text>
        <Text style={styles.skillsText}><Text style={{fontWeight: 'bold'}}>Tools:</Text> {data.skills.tools}</Text>
      </View>

      {/* Custom Sections */}
      {data.customSections && data.customSections.map((section, index) => (
        <View key={index}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          {section.items.map((item, itemIdx) => (
            <View key={itemIdx} style={styles.experienceBlock}>
              <View style={styles.dateLocationRow}>
                <Text style={styles.companyName}>{item.title}</Text>
                {item.date && <Text style={styles.dateLocationText}>{item.date}</Text>}
              </View>
              {item.subtitle && (
                <View style={styles.dateLocationRow}>
                  <Text style={styles.roleTitle}>{item.subtitle}</Text>
                </View>
              )}
              {item.bullets && item.bullets.map((bullet, bIdx) => (
                <Text key={bIdx} style={styles.bulletPoint}>• {bullet}</Text>
              ))}
            </View>
          ))}
        </View>
      ))}
    </Page>
  </Document>
);

export default function ResumeBuilderPage() {
  const navigate = useNavigate();
  const [isPreflightModalOpen, setIsPreflightModalOpen] = useState(false);
  const [preflightData, setPreflightData] = useState(null);
  const [isTesting, setIsTesting] = useState(false);
  const [data, setData] = useState({
    personalInfo: {
      name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '(123) 456-7890',
      linkedin: 'linkedin.com/in/johndoe',
      github: 'github.com/johndoe',
    },
    experience: [
      {
        company: 'Google',
        role: 'Software Engineering Intern',
        date: 'May 2025 - Aug 2025',
        location: 'Mountain View, CA',
        bullets: [
          'Developed a microservice using Go and gRPC that processed 1M+ requests per minute.',
          'Reduced latency by 45% by implementing a distributed Redis caching layer.',
          'Collaborated with cross-functional teams to design RESTful APIs for the frontend team.'
        ]
      }
    ],
    projects: [
      {
        name: 'Smart Resume Parser',
        tech: 'Python, React, Node.js, AWS',
        bullets: [
          'Built an AI-powered resume parser that extracts ATS keywords with 98% accuracy.',
          'Deployed scalable infrastructure using Docker and AWS ECS.',
          'Achieved 5,000 monthly active users within the first month of launch.'
        ]
      }
    ],
    education: [
      {
        school: 'University of California, Berkeley',
        degree: 'B.S. Electrical Engineering & Computer Science',
        date: 'Expected May 2026',
        gpa: '3.9/4.0',
      }
    ],
    skills: {
      languages: 'Python, Java, C++, JavaScript, TypeScript, Go',
      frameworks: 'React, Node.js, Express, Spring Boot, Django',
      tools: 'Git, Docker, Kubernetes, AWS, SQL, MongoDB',
    },
    customSections: [
      {
        title: 'Certifications',
        items: [
          { title: 'AWS Certified Solutions Architect', subtitle: 'Amazon Web Services', date: '2024', bullets: [] }
        ]
      }
    ]
  });

  const handleSave = () => {
    toast.success('Resume saved successfully! (Mock)');
  };

  const handlePreFlightCheck = async () => {
    setIsTesting(true);
    setIsPreflightModalOpen(true);
    setPreflightData(null);
    try {
      const res = await api.post('/ai/preflight-resume', { resumeData: data });
      setPreflightData(res.data);
    } catch (error) {
      toast.error('Pre-flight check failed.');
      setIsPreflightModalOpen(false);
    } finally {
      setIsTesting(false);
    }
  };

  const addCustomSection = () => {
    setData({
      ...data,
      customSections: [
        ...(data.customSections || []),
        { title: 'New Section', items: [{ title: 'Item Title', subtitle: '', date: '', bullets: [] }] }
      ]
    });
  };

  const addCustomItem = (sectionIndex) => {
    const newSections = [...(data.customSections || [])];
    newSections[sectionIndex].items.push({ title: 'New Item', subtitle: '', date: '', bullets: [] });
    setData({ ...data, customSections: newSections });
  };

  const removeCustomSection = (sectionIndex) => {
    const newSections = [...(data.customSections || [])];
    newSections.splice(sectionIndex, 1);
    setData({ ...data, customSections: newSections });
  };

  return (
    <div className="min-h-screen bg-[#050508] flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <header className="h-16 border-b border-white/5 bg-[#13141f] flex items-center justify-between px-6 shrink-0 z-10">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/resumes')} className="p-2 hover:bg-white/5 rounded-lg text-slate-400 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-white font-bold text-lg">Smart ATS Resume Builder</h1>
            <p className="text-xs text-emerald-400 font-medium tracking-wider">GOOGLE-GRADE FORMAT</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handlePreFlightCheck}
            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white text-sm font-bold rounded-lg shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2"
          >
            <Shield className="w-4 h-4" /> AI Pre-flight Test
          </button>
          <button 
            onClick={handleSave}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-sm font-bold rounded-lg transition-colors flex items-center gap-2 border border-white/10"
          >
            <Save className="w-4 h-4" /> Save
          </button>
          <button className="px-4 py-2 bg-white text-black hover:bg-slate-200 text-sm font-bold rounded-lg transition-all flex items-center gap-2">
            <DownloadCloud className="w-4 h-4" /> Export PDF
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Editor Sidebar */}
        <div className="w-1/2 overflow-y-auto custom-scrollbar bg-[#0a0a0f] border-r border-white/5 p-6 space-y-8">
          
          {/* Personal Info */}
          <section className="bg-white/5 p-5 rounded-2xl border border-white/5 shadow-lg">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400">
                <FileText className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-bold text-white">Personal Info</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 mb-1 block">Full Name</label>
                <input 
                  type="text" 
                  value={data.personalInfo.name} 
                  onChange={e => setData({...data, personalInfo: {...data.personalInfo, name: e.target.value}})}
                  className="w-full bg-[#13141f] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500" 
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 mb-1 block">Email</label>
                <input 
                  type="text" 
                  value={data.personalInfo.email} 
                  onChange={e => setData({...data, personalInfo: {...data.personalInfo, email: e.target.value}})}
                  className="w-full bg-[#13141f] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500" 
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 mb-1 block">Phone</label>
                <input 
                  type="text" 
                  value={data.personalInfo.phone} 
                  onChange={e => setData({...data, personalInfo: {...data.personalInfo, phone: e.target.value}})}
                  className="w-full bg-[#13141f] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500" 
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 mb-1 block">LinkedIn</label>
                <input 
                  type="text" 
                  value={data.personalInfo.linkedin} 
                  onChange={e => setData({...data, personalInfo: {...data.personalInfo, linkedin: e.target.value}})}
                  className="w-full bg-[#13141f] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500" 
                />
              </div>
            </div>
          </section>

          {/* Education */}
          <section className="bg-white/5 p-5 rounded-2xl border border-white/5 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <h2 className="text-lg font-bold text-white">Education</h2>
              </div>
            </div>
            {data.education.map((edu, idx) => (
              <div key={idx} className="bg-[#13141f] p-4 rounded-xl border border-white/10">
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-400 mb-1 block">University / School</label>
                    <input 
                      type="text" 
                      value={edu.school} 
                      onChange={e => {
                        const newEdu = [...data.education];
                        newEdu[idx].school = e.target.value;
                        setData({...data, education: newEdu});
                      }}
                      className="w-full bg-transparent border-b border-white/10 px-1 py-1 text-white focus:outline-none focus:border-indigo-500 text-sm" 
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-400 mb-1 block">Degree</label>
                    <input 
                      type="text" 
                      value={edu.degree} 
                      onChange={e => {
                        const newEdu = [...data.education];
                        newEdu[idx].degree = e.target.value;
                        setData({...data, education: newEdu});
                      }}
                      className="w-full bg-transparent border-b border-white/10 px-1 py-1 text-white focus:outline-none focus:border-indigo-500 text-sm" 
                    />
                  </div>
                </div>
              </div>
            ))}
          </section>

          {/* Experience */}
          <section className="bg-white/5 p-5 rounded-2xl border border-white/5 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Briefcase className="w-4 h-4" />
                </div>
                <h2 className="text-lg font-bold text-white">Experience</h2>
              </div>
            </div>
            {data.experience.map((exp, idx) => (
              <div key={idx} className="bg-[#13141f] p-4 rounded-xl border border-white/10 mb-4 last:mb-0">
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-400 mb-1 block">Company</label>
                    <input 
                      type="text" 
                      value={exp.company} 
                      onChange={e => {
                        const newExp = [...data.experience];
                        newExp[idx].company = e.target.value;
                        setData({...data, experience: newExp});
                      }}
                      className="w-full bg-transparent border-b border-white/10 px-1 py-1 text-white focus:outline-none focus:border-indigo-500 text-sm font-bold" 
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-400 mb-1 block">Role</label>
                    <input 
                      type="text" 
                      value={exp.role} 
                      onChange={e => {
                        const newExp = [...data.experience];
                        newExp[idx].role = e.target.value;
                        setData({...data, experience: newExp});
                      }}
                      className="w-full bg-transparent border-b border-white/10 px-1 py-1 text-white focus:outline-none focus:border-indigo-500 text-sm" 
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 mb-2 block">Bullet Points (Action - Metric - Impact)</label>
                  {exp.bullets.map((bullet, bIdx) => (
                    <div key={bIdx} className="flex gap-2 mb-2">
                      <div className="mt-2 w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                      <textarea
                        value={bullet}
                        onChange={e => {
                          const newExp = [...data.experience];
                          newExp[idx].bullets[bIdx] = e.target.value;
                          setData({...data, experience: newExp});
                        }}
                        className="w-full bg-slate-900 border border-white/5 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-indigo-500 focus:text-white resize-none h-16"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </section>

          {/* Skills */}
          <section className="bg-white/5 p-5 rounded-2xl border border-white/5 shadow-lg">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center text-cyan-400">
                <Code className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-bold text-white">Skills</h2>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-400 mb-1 block">Languages</label>
                <input 
                  type="text" 
                  value={data.skills.languages} 
                  onChange={e => setData({...data, skills: {...data.skills, languages: e.target.value}})}
                  className="w-full bg-[#13141f] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 text-sm" 
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 mb-1 block">Frameworks</label>
                <input 
                  type="text" 
                  value={data.skills.frameworks} 
                  onChange={e => setData({...data, skills: {...data.skills, frameworks: e.target.value}})}
                  className="w-full bg-[#13141f] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 text-sm" 
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 mb-1 block">Tools</label>
                <input 
                  type="text" 
                  value={data.skills.tools} 
                  onChange={e => setData({...data, skills: {...data.skills, tools: e.target.value}})}
                  className="w-full bg-[#13141f] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 text-sm" 
                />
              </div>
            </div>
          </section>

          {/* Custom Sections */}
          <div className="flex items-center justify-between mt-8 mb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-[#ff6b00]" /> Custom Sections
            </h2>
            <button 
              onClick={addCustomSection}
              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 font-bold rounded-lg text-xs transition-colors border border-white/10 flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Add Section
            </button>
          </div>

          {data.customSections && data.customSections.map((section, sIdx) => (
            <section key={sIdx} className="bg-white/5 p-5 rounded-2xl border border-white/5 shadow-lg mb-6">
              <div className="flex items-center justify-between mb-4">
                <input 
                  type="text" 
                  value={section.title}
                  onChange={e => {
                    const newSections = [...data.customSections];
                    newSections[sIdx].title = e.target.value;
                    setData({...data, customSections: newSections});
                  }}
                  className="bg-transparent text-lg font-bold text-white focus:outline-none focus:border-b focus:border-indigo-500" 
                  placeholder="Section Title (e.g. Certifications)"
                />
                <button 
                  onClick={() => removeCustomSection(sIdx)}
                  className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {section.items.map((item, iIdx) => (
                <div key={iIdx} className="bg-[#13141f] p-4 rounded-xl border border-white/10 mb-4 last:mb-0">
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-400 mb-1 block">Title</label>
                      <input 
                        type="text" 
                        value={item.title} 
                        onChange={e => {
                          const newSections = [...data.customSections];
                          newSections[sIdx].items[iIdx].title = e.target.value;
                          setData({...data, customSections: newSections});
                        }}
                        className="w-full bg-transparent border-b border-white/10 px-1 py-1 text-white focus:outline-none focus:border-indigo-500 text-sm font-bold" 
                        placeholder="e.g. AWS Certified"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-400 mb-1 block">Date / Duration</label>
                      <input 
                        type="text" 
                        value={item.date} 
                        onChange={e => {
                          const newSections = [...data.customSections];
                          newSections[sIdx].items[iIdx].date = e.target.value;
                          setData({...data, customSections: newSections});
                        }}
                        className="w-full bg-transparent border-b border-white/10 px-1 py-1 text-white focus:outline-none focus:border-indigo-500 text-sm" 
                        placeholder="e.g. 2024"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs font-semibold text-slate-400 mb-1 block">Subtitle / Organization (Optional)</label>
                      <input 
                        type="text" 
                        value={item.subtitle} 
                        onChange={e => {
                          const newSections = [...data.customSections];
                          newSections[sIdx].items[iIdx].subtitle = e.target.value;
                          setData({...data, customSections: newSections});
                        }}
                        className="w-full bg-transparent border-b border-white/10 px-1 py-1 text-white focus:outline-none focus:border-indigo-500 text-sm italic" 
                        placeholder="e.g. Amazon Web Services"
                      />
                    </div>
                  </div>
                </div>
              ))}
              <button 
                onClick={() => addCustomItem(sIdx)}
                className="w-full py-2 bg-[#13141f] hover:bg-white/5 border border-dashed border-white/20 text-slate-400 hover:text-white rounded-lg text-xs font-bold transition-colors mt-2"
              >
                + Add Item
              </button>
            </section>
          ))}

        </div>

        {/* PDF Preview Sidebar */}
        <div className="w-1/2 bg-slate-400 relative">
          <PDFViewer style={{ width: '100%', height: '100%', border: 'none' }}>
            <ATSResumeDocument data={data} />
          </PDFViewer>
        </div>

      </div>

      {/* AI Pre-flight Modal */}
      <AnimatePresence>
        {isPreflightModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#13141f] border border-white/10 rounded-2xl p-6 md:p-8 max-w-2xl w-full max-h-[85vh] overflow-y-auto custom-scrollbar shadow-2xl relative"
            >
              <button 
                onClick={() => setIsPreflightModalOpen(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">ATS Pre-flight Check</h2>
                  <p className="text-slate-400 text-sm">Validating structure, keywords, and impact.</p>
                </div>
              </div>

              {isTesting ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-4">
                  <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                  <p className="text-slate-300 font-bold animate-pulse">Running rigorous ATS tests...</p>
                </div>
              ) : preflightData ? (
                <div className="space-y-6">
                  {/* Score */}
                  <div className="flex items-center justify-between p-5 bg-white/5 rounded-xl border border-white/10">
                    <div>
                      <h3 className="text-lg font-bold text-white">Readiness Score</h3>
                      <p className="text-sm text-slate-400">Based on standard ATS parsing rules.</p>
                    </div>
                    <div className={`text-4xl font-black ${preflightData.score >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {preflightData.score}/100
                    </div>
                  </div>

                  {/* Feedback */}
                  <div className="space-y-4">
                    <h3 className="font-bold text-white">Analysis & Action Items</h3>
                    {preflightData.feedback.map((item, idx) => (
                      <div key={idx} className="flex gap-3 p-4 bg-white/5 rounded-xl border border-white/10">
                        {item.type === 'success' ? (
                          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                        ) : item.type === 'warning' ? (
                          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-blue-500 shrink-0" />
                        )}
                        <p className="text-sm text-slate-300 leading-relaxed">{item.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center text-red-400">Failed to load data.</div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
