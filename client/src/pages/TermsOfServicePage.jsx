import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

const TermsOfServicePage = () => {
  return (
    <div className="min-h-screen bg-[#050508] text-slate-300 font-['Plus_Jakarta_Sans']">
      <Helmet>
        <title>Terms of Service - StudentTracker</title>
        <meta name="description" content="Terms of Service for StudentTracker." />
      </Helmet>
      
      <div className="max-w-4xl mx-auto px-6 py-20">
        <Link to="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-[#F97316] transition-colors mb-12">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
        
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-8">Terms of Service</h1>
        <p className="text-slate-400 mb-12">Last updated: June 15, 2026</p>
        
        <div className="space-y-8 text-[15px] leading-relaxed">
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">1. Acceptance of Terms</h2>
            <p className="mb-4">By accessing or using StudentTracker, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any part of these terms, you may not use our services.</p>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">2. User Accounts</h2>
            <p className="mb-4">You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password. We encourage you to use "strong" passwords (passwords that use a combination of upper and lower case letters, numbers and symbols) with your account.</p>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">3. Acceptable Use</h2>
            <p className="mb-4">You agree not to use the Service to:</p>
            <ul className="list-disc pl-5 space-y-2 text-slate-400">
              <li>Upload or share false, misleading, or abusive information.</li>
              <li>Attempt to gain unauthorized access to the Service or its related systems.</li>
              <li>Scrape or extract data from the Leaderboard or other users' profiles without permission.</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">4. Changes to Terms</h2>
            <p className="mb-4">We reserve the right to modify or replace these Terms at any time. We will try to provide at least 30 days notice prior to any new terms taking effect.</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsOfServicePage;
