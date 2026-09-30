import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { notificationApi } from '../utils/api';

function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Notifications State
  const [notifications, setNotifications] = useState([]);
  const [showNotiDropdown, setShowNotiDropdown] = useState(false);
  const [notiFailed, setNotiFailed] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) {
      setNotifications([]);
      return;
    }
    try {
      const res = await notificationApi.getMyNotifications();
      const list = Array.isArray(res.data) ? res.data : [];
      setNotifications(list);
      setNotiFailed(false);
    } catch {
      setNotifications([]);
      setNotiFailed(true);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchNotifications();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const handleMarkAsRead = async (id) => {
    try {
      await notificationApi.markAsRead(id);
      setNotifications(prev => prev.map(n => String(n.notiId) === String(id) ? { ...n, isRead: true } : n));
      setNotiFailed(false);
    } catch {
      // The row stays unread so the badge never claims a write that failed
      setNotiFailed(true);
    }
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        setShowLogoutConfirm(false);
        setShowNotiDropdown(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const handleConfirmLogout = () => {
    logout();
    setShowLogoutConfirm(false);
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;
  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <>
      <nav aria-label="Main" className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'py-4' : 'py-6'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            layout
            className={`card rounded-2xl px-4 sm:px-6 flex items-center justify-between h-16 transition-all duration-500 ${scrolled ? 'shadow-xl' : 'shadow-sm'}`}
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
                Rent<span className="text-sky-700">Sphere</span>
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
                  ) : user?.role === 'tenant' ? (
                    <NavLink to="/tenant/dashboard" active={isActive('/tenant/dashboard')}>Dashboard</NavLink>
                  ) : null}
                  
                  {(user?.role === 'admin' || user?.role === 'tenant') && (
                    <NavLink to="/contracts" active={isActive('/contracts')}>Contracts</NavLink>
                  )}
                </>
              ) : null}
            </div>

            {/* Auth & Notification Actions */}
            <div className="hidden md:flex items-center space-x-4">
              {isAuthenticated ? (
                <div className="flex items-center space-x-4 relative">
                  
                  {/* Notification Bell Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setShowNotiDropdown(!showNotiDropdown)}
                      aria-label="Notifications"
                      aria-expanded={showNotiDropdown}
                      className="p-2.5 rounded-xl bg-slate-100/80 hover:bg-slate-200 text-slate-700 relative transition-all"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 01-6 0v-1m6 0H9" />
                      </svg>
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                          {unreadCount}
                        </span>
                      )}
                    </button>

                    {/* Popover Menu */}
                    <AnimatePresence>
                      {showNotiDropdown && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-[100]"
                        >
                          <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
                            <span className="font-bold text-sm">Notifications</span>
                            <span className="text-xs bg-sky-500/20 text-sky-400 px-2.5 py-0.5 rounded-full font-semibold">{unreadCount} Unread</span>
                          </div>

                          {notiFailed && notifications.length > 0 && (
                            <div className="px-4 py-2 bg-amber-50 text-amber-800 text-xs font-semibold border-b border-amber-100">
                              ⚠️ Couldn't reach the server. Read states may not be saved.
                            </div>
                          )}

                          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                            {notifications.length === 0 ? (
                              <div className="p-8 text-center text-slate-600 text-sm">
                                {notiFailed ? (
                                  <>
                                    <p className="mb-3">⚠️ Couldn't load your notifications.</p>
                                    <button
                                      type="button"
                                      onClick={fetchNotifications}
                                      className="text-xs font-bold text-sky-700 underline underline-offset-2"
                                    >
                                      Try again
                                    </button>
                                  </>
                                ) : (
                                  '🔔 No notifications right now'
                                )}
                              </div>
                            ) : (
                              notifications.map((n) => (
                                <div
                                  key={n.notiId}
                                  role="button"
                                  tabIndex={0}
                                  onClick={() => handleMarkAsRead(n.notiId)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleMarkAsRead(n.notiId); }
                                  }}
                                  className={`p-4 transition-colors cursor-pointer hover:bg-slate-50 focus:bg-slate-50 outline-none ${!n.isRead ? 'bg-sky-50/40' : ''}`}
                                >
                                  <div className="flex items-start justify-between mb-1">
                                    <p className={`text-xs font-bold ${!n.isRead ? 'text-sky-700' : 'text-slate-800'}`}>{n.title}</p>
                                    {!n.isRead && <span className="w-2 h-2 rounded-full bg-sky-500"></span>}
                                  </div>
                                  <p className="text-xs text-slate-500 font-medium leading-relaxed mb-2">{n.body}</p>
                                  <span className="text-[10px] text-slate-600 font-semibold">{n.createdAt ? new Date(n.createdAt).toLocaleDateString() : 'Just now'}</span>
                                </div>
                              ))
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Profile Avatar */}
                  <Link to="/profile" className="flex items-center space-x-3 group bg-slate-50 rounded-full pr-4 pl-1 py-1 transition-all hover:bg-slate-100">
                    <div className="w-8 h-8 rounded-full bg-sky-700 flex items-center justify-center text-white font-bold text-sm overflow-hidden shadow-sm">
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
                    <button className="btn-primary text-sm shadow-sky-500/20">Get Started</button>
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Toggle */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Menu"
                aria-expanded={isMobileMenuOpen}
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
                className="md:hidden mt-2 card rounded-2xl p-4 shadow-xl border border-white/50"
              >
                <div className="flex flex-col space-y-2">
                  <MobileNavLink to="/properties" onClick={() => setIsMobileMenuOpen(false)}>Browse Properties</MobileNavLink>
                  {isAuthenticated ? (
                    <>
                      <MobileNavLink to="/profile" onClick={() => setIsMobileMenuOpen(false)}>My Profile</MobileNavLink>
                      {(user?.role === 'admin' || user?.role === 'tenant') && (
                        <MobileNavLink to={user?.role === 'admin' ? "/admin/dashboard" : "/tenant/dashboard"} onClick={() => setIsMobileMenuOpen(false)}>Dashboard</MobileNavLink>
                      )}
                      <button onClick={() => { setIsMobileMenuOpen(false); setShowLogoutConfirm(true); }} className="w-full text-left px-4 py-3 text-red-700 font-medium hover:bg-red-50 rounded-xl transition-colors">Logout</button>
                    </>
                  ) : (
                    <>
                      <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="block px-4 py-3 font-medium text-slate-600 hover:bg-slate-50 rounded-xl">Login</Link>
                      <Link to="/signup" onClick={() => setIsMobileMenuOpen(false)} className="block px-4 py-3 font-semibold text-sky-700 bg-sky-50 rounded-xl">Sign Up</Link>
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
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Sign Out</h3>
                <p className="text-slate-500 mb-8">Are you sure you want to log out of your account?</p>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setShowLogoutConfirm(false)} className="btn-secondary py-3">Cancel</button>
                  <button onClick={handleConfirmLogout} className="bg-red-600 text-white font-bold rounded-xl py-3 hover:bg-red-700 transition-colors shadow-lg shadow-red-200">Logout</button>
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
    <Link to={to} className={`nav-link ${active ? 'text-sky-700 after:content-[""] after:absolute after:bottom-0 after:left-4 after:right-4 after:h-0.5 after:bg-sky-500 after:rounded-full' : ''}`}>
      {children}
    </Link>
  );
}

function MobileNavLink({ to, children, onClick }) {
  return (
    <Link to={to} onClick={onClick} className="block px-4 py-3 font-medium text-slate-600 hover:bg-slate-50 hover:text-sky-700 rounded-xl transition-all">
      {children}
    </Link>
  );
}

export default Navbar;