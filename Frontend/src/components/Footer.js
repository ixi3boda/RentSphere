import React from 'react';
import { Link } from 'react-router-dom';

function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-800 pt-12 pb-8 font-outfit">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-10 border-b border-slate-800">

          {/* Brand */}
          <div className="md:col-span-5">
            <Link to="/" className="flex items-center space-x-3 mb-5">
              <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center p-1.5">
                <img src="/rentSphereLogo.png" alt="RentSphere" className="w-full h-full object-contain" />
              </div>
              <span className="text-xl font-black tracking-tight text-white">
                Rent<span className="text-sky-400">Sphere</span>
              </span>
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
              A modern rental management platform connecting tenants with verified landlords through digital lease automation and transparent payment tracking.
            </p>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-3">
            <h4 className="text-white text-xs font-bold uppercase tracking-widest mb-5">Navigate</h4>
            <ul className="space-y-3 text-sm font-medium">
              <li><Link to="/properties" className="hover:text-sky-400 transition-colors">Browse Properties</Link></li>
              <li><Link to="/login" className="hover:text-sky-400 transition-colors">Tenant Login</Link></li>
              <li><Link to="/signup" className="hover:text-sky-400 transition-colors">Register Account</Link></li>
              <li><Link to="/contracts" className="hover:text-sky-400 transition-colors">My Contracts</Link></li>
            </ul>
          </div>

          {/* Platform */}
          <div className="md:col-span-4">
            <h4 className="text-white text-xs font-bold uppercase tracking-widest mb-5">Platform</h4>
            <ul className="space-y-3 text-sm font-medium">
              <li><span className="hover:text-sky-400 transition-colors cursor-pointer">Privacy Policy</span></li>
              <li><span className="hover:text-sky-400 transition-colors cursor-pointer">Terms of Service</span></li>
              <li><span className="hover:text-sky-400 transition-colors cursor-pointer">Security & Compliance</span></li>
            </ul>
          </div>
        </div>

        <div className="pt-7 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-600 gap-3">
          <p>© {new Date().getFullYear()} RentSphere. All rights reserved.</p>
          <div className="flex items-center space-x-2 text-slate-700 text-[11px]">
            <span className="px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-500">Secure Payments</span>
            <span className="px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-500">PayPal & Card</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
