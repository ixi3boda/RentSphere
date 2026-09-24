import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Hero from '../components/Hero';
import { AnimatedPage } from '../components/AnimatedPage';

function Home() {
  return (
    <AnimatedPage>
      <div className="bg-slate-50 min-h-screen">
        <Hero />

        {/* Agency Value Propositions */}
        <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="badge-primary mb-3">Enterprise Standards</span>
            <h2 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight mb-4">
              Why Real Estate Agencies & Tenants Choose <span className="gradient-text">RentSphere</span>
            </h2>
            <p className="text-slate-500 font-medium text-lg">
              We combine enterprise-grade security with a seamless digital platform designed to automate renting workflows.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              icon="🔒"
              title="Verified Landlords & Tenants"
              description="Comprehensive background verification, proof of ownership checks, and identity validation to eliminate rental fraud."
            />
            <FeatureCard
              icon="📜"
              title="Automated Digital Contracts"
              description="Legally binding lease agreements generated automatically in PDF format with digital signature tracking."
            />
            <FeatureCard
              icon="💳"
              title="Escrow & Online Payments"
              description="Integrated PayPal and card checkout for secure monthly installment payment processing and receipt tracking."
            />
            <FeatureCard
              icon="📊"
              title="Real-Time Analytics Dashboard"
              description="Landlords and admins gain actionable insight into occupancy rates, rental revenue, and maintenance workflows."
            />
            <FeatureCard
              icon="⚡"
              title="Instant Application Decisions"
              description="Submit rental applications online and track reviewer feedback with real-time status notifications."
            />
            <FeatureCard
              icon="🎧"
              title="24/7 Agency Concierge Support"
              description="Dedicated property managers and support hotline ready to resolve tenant inquiries and maintenance requests."
            />
          </div>
        </section>

        {/* How It Works Step Breakdown */}
        <section className="py-20 bg-slate-900 text-white border-y border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="badge-gold mb-3">Simple 4-Step Process</span>
              <h2 className="text-4xl font-black mb-4">How RentSphere Works</h2>
              <p className="text-slate-400 font-medium">From property browsing to moving in — completely digitized.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <StepCard
                step="01"
                title="Browse & Filter"
                desc="Explore high-resolution listings filtered by location, property type, rooms, and budget."
              />
              <StepCard
                step="02"
                title="Submit Application"
                desc="Send a digital rental request directly to the property owner with optional message details."
              />
              <StepCard
                step="03"
                title="Review & Sign Lease"
                desc="Once approved, review your automated digital contract PDF and agree to leasing terms."
              />
              <StepCard
                step="04"
                title="Pay & Move In"
                desc="Make initial installment payments securely via PayPal or card and receive your key handover."
              />
            </div>
          </div>
        </section>

        {/* Landlord CTA Banner */}
        <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="relative overflow-hidden rounded-[3rem] p-10 sm:p-16 bg-gradient-to-br from-sky-600 to-indigo-900 text-white shadow-luxury">
            <div className="absolute top-[-30%] right-[-10%] w-[500px] h-[500px] bg-sky-400/20 rounded-full blur-[140px]" />
            
            <div className="relative z-10 grid md:grid-cols-12 gap-8 items-center">
              <div className="md:col-span-8">
                <span className="inline-block px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-sky-200 text-xs font-bold uppercase tracking-widest mb-6 border border-white/20">
                  For Property Owners & Agencies
                </span>
                <h2 className="text-4xl sm:text-5xl font-black mb-6 leading-tight">
                  Ready to List Your Property & Maximize Rental Yield?
                </h2>
                <p className="text-slate-200 text-lg mb-8 max-w-xl font-medium">
                  Partner with RentSphere to access verified tenants, automated contract lifecycle management, and guaranteed timely rent collection.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Link to="/signup" className="btn-secondary text-slate-900 !py-3.5 !px-8 font-bold">
                    Become a Partner Landlord
                  </Link>
                  <Link to="/properties" className="bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold px-8 py-3.5 rounded-2xl transition-all">
                    Explore Platform Features
                  </Link>
                </div>
              </div>
              <div className="md:col-span-4 hidden md:flex justify-center">
                <div className="w-56 h-56 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-8xl shadow-2xl animate-float">
                  🏢
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </AnimatedPage>
  );
}

function FeatureCard({ icon, title, description }) {
  return (
    <motion.div
      whileHover={{ y: -6 }}
      className="glass-card p-8 rounded-[2rem] border border-slate-100"
    >
      <div className="w-14 h-14 bg-sky-50 rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-sm border border-sky-100">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
      <p className="text-slate-500 font-medium text-sm leading-relaxed">{description}</p>
    </motion.div>
  );
}

function StepCard({ step, title, desc }) {
  return (
    <div className="bg-slate-800/80 p-8 rounded-[2rem] border border-slate-700/80 relative">
      <span className="text-4xl font-black text-sky-400/30 absolute top-6 right-6 font-mono">{step}</span>
      <h3 className="text-xl font-bold mb-2 text-white">{title}</h3>
      <p className="text-slate-400 text-sm font-medium leading-relaxed">{desc}</p>
    </div>
  );
}

export default Home;