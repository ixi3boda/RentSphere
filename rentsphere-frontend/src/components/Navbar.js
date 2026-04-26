// src/components/Navbar.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
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
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleLogout}
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
                <div className="text-gray-700 font-medium">Welcome, {user?.name || user?.email}</div>
                <Link to="/dashboard">
                  <button className="w-full text-left text-gray-700 hover:text-rentsphere-teal">Dashboard</button>
                </Link>
                <button onClick={handleLogout} className="w-full text-left text-gray-700 hover:text-rentsphere-teal">Logout</button>
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
  );
}

export default Navbar;