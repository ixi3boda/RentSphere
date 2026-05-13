import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && showLogoutConfirm) setShowLogoutConfirm(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [showLogoutConfirm]);

  const handleConfirmLogout = () => {
    logout();
    setShowLogoutConfirm(false);
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'py-4' : 'py-6'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            layout
            className={`glass-effect rounded-2xl px-4 sm:px-6 flex items-center justify-between h-16 transition-all duration-500 ${scrolled ? 'shadow-xl' : 'shadow-sm'}`}
          >
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-3 group">
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.8, ease: "anticipate" }}
                className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center p-1"
              >
                <img src="/rentSphereLogo.png" alt="Logo" className="w-full h-full object-contain" />
              </motion.div>
              <span className="text-xl font-bold tracking-tight text-slate-800 hidden sm:inline">
                Rent<span className="text-zen-500">Sphere</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              <NavLink to="/properties" active={isActive('/properties')}>Browse</NavLink>
              
              {isAuthenticated ? (
                <>
                  {user?.role === 'admin' ? (
                    <>
                      <NavLink to="/admin/dashboard" active={isActive('/admin/dashboard')}>Dashboard</NavLink>
                      <NavLink to="/admin/requests" active={isActive('/admin/requests')}>Requests</NavLink>
                    </>
                  ) : (
                    <NavLink to="/tenant/dashboard" active={isActive('/tenant/dashboard')}>Dashboard</NavLink>
                  )}
                  
                  {(user?.role === 'admin' || user?.role === 'tenant') && (
                    <NavLink to="/contracts" active={isActive('/contracts')}>Contracts</NavLink>
                  )}
                </>
              ) : null}
            </div>

            {/* Auth Actions */}
            <div className="hidden md:flex items-center space-x-4">
              {isAuthenticated ? (
                <div className="flex items-center space-x-4">
                  <Link to="/profile" className="flex items-center space-x-3 group bg-slate-50 rounded-full pr-4 pl-1 py-1 transition-all hover:bg-slate-100">
                    <div className="w-8 h-8 rounded-full bg-zen-500 flex items-center justify-center text-white font-bold text-sm overflow-hidden shadow-sm">
                      {user?.avatar ? <img src={user.avatar} alt="P" className="w-full h-full object-cover" /> : user?.name?.[0] || user?.email?.[0]}
                    </div>
                    <span className="text-sm font-medium text-slate-600 truncate max-w-[100px]">
                      {user?.name || user?.email?.split('@')[0]}
                    </span>
                  </Link>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowLogoutConfirm(true)}
                    className="btn-secondary !py-2 !px-4 text-sm"
                  >
                    Logout
                  </motion.button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Link to="/login">
                    <button className="btn-ghost text-sm">Login</button>
                  </Link>
                  <Link to="/signup">
                    <button className="btn-primary text-sm shadow-zen-500/20">Get Started</button>
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Toggle */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isMobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </motion.div>

          {/* Mobile Menu */}
          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="md:hidden mt-2 glass-effect rounded-2xl p-4 shadow-xl border border-white/50"
              >
                <div className="flex flex-col space-y-2">
                  <MobileNavLink to="/properties" onClick={() => setIsMobileMenuOpen(false)}>Browse Properties</MobileNavLink>
                  {isAuthenticated ? (
                    <>
                      <MobileNavLink to="/profile" onClick={() => setIsMobileMenuOpen(false)}>My Profile</MobileNavLink>
                      <MobileNavLink to={user?.role === 'admin' ? "/admin/dashboard" : "/tenant/dashboard"} onClick={() => setIsMobileMenuOpen(false)}>Dashboard</MobileNavLink>
                      <button onClick={() => { setIsMobileMenuOpen(false); setShowLogoutConfirm(true); }} className="w-full text-left px-4 py-3 text-red-500 font-medium hover:bg-red-50 rounded-xl transition-colors">Logout</button>
                    </>
                  ) : (
                    <>
                      <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="block px-4 py-3 font-medium text-slate-600 hover:bg-slate-50 rounded-xl">Login</Link>
                      <Link to="/signup" onClick={() => setIsMobileMenuOpen(false)} className="block px-4 py-3 font-semibold text-zen-600 bg-zen-50 rounded-xl">Sign Up</Link>
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </nav>

      {/* Logout Modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLogoutConfirm(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-400 to-red-500" />
              <div className="text-center">
                <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Sign Out</h3>
                <p className="text-slate-500 mb-8">Are you sure you want to log out of your account?</p>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setShowLogoutConfirm(false)} className="btn-secondary py-3">Cancel</button>
                  <button onClick={handleConfirmLogout} className="bg-red-500 text-white font-bold rounded-xl py-3 hover:bg-red-600 transition-colors shadow-lg shadow-red-200">Logout</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

function NavLink({ to, children, active }) {
  return (
    <Link to={to} className={`nav-link ${active ? 'text-zen-600 after:content-[""] after:absolute after:bottom-0 after:left-4 after:right-4 after:h-0.5 after:bg-zen-500 after:rounded-full' : ''}`}>
      {children}
    </Link>
  );
}

function MobileNavLink({ to, children, onClick }) {
  return (
    <Link to={to} onClick={onClick} className="block px-4 py-3 font-medium text-slate-600 hover:bg-slate-50 hover:text-zen-600 rounded-xl transition-all">
      {children}
    </Link>
  );
}

export default Navbar;