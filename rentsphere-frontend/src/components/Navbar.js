// src/components/Navbar.js
import React, { useState, useEffect } from 'react';

import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';


function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
// Add ESC key handler
useEffect(() => {
  const handleEsc = (e) => {
    if (e.key === 'Escape' && showLogoutConfirm) {
      handleCancelLogout();
    }
  };
  window.addEventListener('keydown', handleEsc);
  return () => window.removeEventListener('keydown', handleEsc);
}, [showLogoutConfirm]);
  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const handleConfirmLogout = () => {
    logout();
    setShowLogoutConfirm(false);
    navigate('/login');
  };

  const handleCancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  return (
    <>
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass-effect sticky top-0 z-50 shadow-lg"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo with Rotation Animation */}
            <Link to="/" className="flex items-center space-x-3 group">
              <motion.img 
                src="/rentSphereLogo.png" 
                alt="RentSphere Logo" 
                className="h-10 w-auto object-contain cursor-pointer"
                whileHover={{ 
                  rotate: 360,
                  scale: 1.1,
                  transition: { 
                    duration: 0.6,
                    ease: "easeInOut",
                    type: "spring",
                    stiffness: 260,
                    damping: 20
                  }
                }}
                whileTap={{ scale: 0.95 }}
              />
              <span className="text-xl font-bold gradient-text hidden sm:inline group-hover:opacity-80 transition-opacity">
                RentSphere
              </span>
            </Link>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-6">
              {isAuthenticated ? (
                <>
                  {/* Profile Picture Thumbnail */}
                  <Link to="/profile">
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-8 h-8 rounded-full bg-gradient-to-r from-rentsphere-teal to-rentsphere-orange overflow-hidden cursor-pointer"
                    >
                      {user?.profilePicture ? (
                        <img 
                          src={user.profilePicture} 
                          alt="Profile" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white text-sm font-bold">
                          {user?.name ? user.name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </motion.div>
                  </Link>
                  
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="text-gray-700 font-medium"
                  >
                    👋 Welcome, {user?.name || user?.email?.split('@')[0]}
                  </motion.div>
                  
                  {user?.role === 'owner' && (
                    <Link to="/owner/dashboard">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="text-gray-700 hover:text-rentsphere-teal transition-colors"
                      >
                        📊 Dashboard
                      </motion.button>
                    </Link>
                  )}
                  
                  {user?.role === 'tenant' && (
                    <Link to="/tenant/dashboard">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="text-gray-700 hover:text-rentsphere-teal transition-colors"
                      >
                        📊 Dashboard
                      </motion.button>
                    </Link>
                  )}
                  
                  {/* Profile Link */}
                  <Link to="/profile">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="text-gray-700 hover:text-rentsphere-teal transition-colors"
                    >
                      👤 Profile
                    </motion.button>
                  </Link>
                  
                  {/* Logout Button with Confirmation */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleLogoutClick}
                    className="btn-primary !py-1 !px-4"
                  >
                    Logout
                  </motion.button>
                </>
              ) : (
                <>
                  <Link to="/login">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="text-gray-700 hover:text-rentsphere-teal transition-colors"
                    >
                      Login
                    </motion.button>
                  </Link>
                  <Link to="/signup">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="btn-primary !py-1 !px-4"
                    >
                      Sign Up
                    </motion.button>
                  </Link>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-gray-700 focus:outline-none"
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
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="md:hidden py-4 border-t border-gray-200"
            >
              {isAuthenticated ? (
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 mb-4">
                    {/* Profile Picture in Mobile Menu */}
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-rentsphere-teal to-rentsphere-orange overflow-hidden">
                      {user?.profilePicture ? (
                        <img 
                          src={user.profilePicture} 
                          alt="Profile" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white text-base font-bold">
                          {user?.name ? user.name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="text-gray-700 font-medium">
                      Welcome, {user?.name || user?.email}
                    </div>
                  </div>
                  <Link to="/dashboard">
                    <button className="w-full text-left text-gray-700 hover:text-rentsphere-teal">Dashboard</button>
                  </Link>
                  <Link to="/profile">
                    <button className="w-full text-left text-gray-700 hover:text-rentsphere-teal">Profile</button>
                  </Link>
                  <button 
                    onClick={handleLogoutClick} 
                    className="w-full text-left text-gray-700 hover:text-rentsphere-teal"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <Link to="/login">
                    <button className="w-full text-left text-gray-700 hover:text-rentsphere-teal">Login</button>
                  </Link>
                  <Link to="/signup">
                    <button className="w-full text-left text-rentsphere-teal font-semibold">Sign Up</button>
                  </Link>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </motion.nav>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCancelLogout}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            
            {/* Modal */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative glass-effect rounded-2xl p-6 max-w-md w-full shadow-2xl"
            >
              <div className="text-center">
                {/* Icon */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                  className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-rentsphere-teal to-rentsphere-orange flex items-center justify-center"
                >
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </motion.div>
                
                {/* Title */}
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Ready to Leave?</h3>
                
                {/* Message */}
                <p className="text-gray-600 mb-6">
                  Are you sure you want to logout? You'll need to sign in again to access your account.
                </p>
                
                {/* Buttons */}
                <div className="flex gap-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleCancelLogout}
                    className="flex-1 btn-secondary py-2 px-4"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleConfirmLogout}
                    className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300 hover:shadow-lg"
                  >
                    Yes, Logout
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default Navbar;