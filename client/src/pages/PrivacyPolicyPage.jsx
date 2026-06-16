import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

const PrivacyPolicyPage = () => {
  return (
    <div className="min-h-screen bg-[#050508] text-slate-300 font-['Plus_Jakarta_Sans']">
      <Helmet>
        <title>Privacy Policy - StudentTracker</title>
        <meta name="description" content="Learn how StudentTracker handles your data and privacy." />
      </Helmet>
      
      <div className="max-w-4xl mx-auto px-6 py-20">
        <Link to="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-[#F97316] transition-colors mb-12">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
        
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-8">Privacy Policy</h1>
        <p className="text-slate-400 mb-12">Last updated: June 15, 2026</p>
        
        <div className="space-y-8 text-[15px] leading-relaxed">
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">1. Information We Collect</h2>
            <p className="mb-4">We collect information you provide directly to us when you create an account, update your profile, or use our services. This includes your name, email, college, graduation year, target companies, and any academic data you choose to provide.</p>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">2. How We Use Your Information</h2>
            <p className="mb-4">We use the information we collect to:</p>
            <ul className="list-disc pl-5 space-y-2 text-slate-400">
              <li>Provide, maintain, and improve our platform.</li>
              <li>Personalize your experience and deliver custom content, like the College Leaderboard.</li>
              <li>Send you technical notices, updates, and support messages.</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">3. Data Security</h2>
            <p className="mb-4">We implement appropriate technical and organizational measures to protect your personal data against unauthorized or unlawful processing, accidental loss, destruction, or damage. Your passwords are cryptographically hashed and we use secure HTTPS connections.</p>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">4. Contact Us</h2>
            <p className="mb-4">If you have any questions about this Privacy Policy, please contact us at privacy@studenttracker.com.</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
