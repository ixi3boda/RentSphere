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

        {/* What the platform actually does */}
        <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="badge-primary mb-3">Built On Real Workflow</span>
            <h2 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight mb-4">
              From Browsing To A Paid <span className="gradient-text">Instalment</span>
            </h2>
            <p className="text-slate-600 font-medium text-lg">
              Search, request, sign and pay, all in one place.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              icon="🔐"
              title="JWT Roles & Ownership Checks"
              description="Visitors, tenants and admins get different tokens, and every request to read, edit or accept is checked against who owns the listing or the lease."
            />
            <FeatureCard
              icon="📜"
              title="Contract Created On Approval"
              description="Accepting a rental request writes the lease and its monthly instalment schedule in one transaction — start date, end date and one payment row per month."
            />
            <FeatureCard
              icon="💳"
              title="PayPal & Card Payments"
              description="Each outstanding instalment can be paid through PayPal or by card. The payment is verified against the amount on the schedule before it is marked paid."
            />
            <FeatureCard
              icon="🔔"
              title="Status Notifications"
              description="Owners are notified when a request arrives, tenants when it is accepted or rejected, and both when a payment lands."
            />
            <FeatureCard
              icon="🔎"
              title="Search, Filter & Save"
              description="Filter listings by city, property type and budget against the database, then save the ones you like to a personal favourites list."
            />
            <FeatureCard
              icon="🗂️"
              title="Admin Console"
              description="Admins publish and edit listings, review incoming requests, accept or reject them, and watch contract and payment state from one console."
            />
          </div>
        </section>

        {/* How It Works Step Breakdown */}
        <section className="py-20 bg-slate-900 text-white border-y border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="badge-gold mb-3">Simple 4-Step Process</span>
              <h2 className="text-4xl font-black mb-4">How RentSphere Works</h2>
              <p className="text-slate-400 font-medium">From property browsing to a paid instalment — tracked in the database end to end.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <StepCard
                step="01"
                title="Browse & Filter"
                desc="Filter real listings by city, property type and maximum monthly rent, or search by title and location."
              />
              <StepCard
                step="02"
                title="Submit Application"
                desc="Send a rental request with your start date, length of stay and a message. The property owner is notified."
              />
              <StepCard
                step="03"
                title="Approval Creates The Lease"
                desc="When the request is accepted, RentSphere opens a contract and generates one dated instalment per month."
              />
              <StepCard
                step="04"
                title="Pay Each Instalment"
                desc="Pay outstanding instalments with PayPal or card. Each payment is recorded against its instalment and reported back to you."
              />
            </div>
          </div>
        </section>

        {/* Getting Started CTA Banner */}
        <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="relative overflow-hidden rounded-2xl p-10 sm:p-16 bg-gradient-to-br from-sky-700 to-indigo-900 text-white shadow-luxury">
            <div className="absolute top-[-30%] right-[-10%] w-[500px] h-[500px] bg-sky-400/20 rounded-full blur-[140px]" />
            
            <div className="relative z-10 grid md:grid-cols-12 gap-8 items-center">
              <div className="md:col-span-8">
                <span className="inline-block px-4 py-1.5 rounded-full bg-white/10 text-white text-xs font-bold uppercase tracking-widest mb-6 border border-white/25">
                  Accounts & Listings
                </span>
                <h2 className="text-4xl sm:text-5xl font-black mb-6 leading-tight">
                  Start With A Favourite List, Finish With A Signed Schedule
                </h2>
                <p className="text-sky-100 text-lg mb-8 max-w-xl font-medium">
                  Create an account to save listings and send rental requests. Listings are published by admin accounts, so talk to the RentSphere team to get inventory onto the platform.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Link to="/signup" className="btn-secondary text-slate-900 !py-3.5 !px-8 font-bold">
                    Create An Account
                  </Link>
                  <Link to="/properties" className="bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold px-8 py-3.5 rounded-2xl transition-all">
                    Browse Listings
                  </Link>
                </div>
              </div>
              <div className="md:col-span-4 hidden md:flex justify-center">
                <div className="w-56 h-56 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-8xl shadow-2xl animate-float">
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
      className="card-hover p-8 rounded-2xl border border-slate-100"
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
    <div className="bg-slate-800/80 p-8 rounded-2xl border border-slate-700/80 relative">
      <span className="text-4xl font-black text-sky-400/70 absolute top-6 right-6 font-mono" aria-hidden="true">{step}</span>
      {/* The step number is absolutely positioned top-right, so long titles need the room. */}
      <h3 className="text-xl font-bold mb-2 text-white pr-12">{title}</h3>
      <p className="text-slate-400 text-sm font-medium leading-relaxed">{desc}</p>
    </div>
  );
}

export default Home;