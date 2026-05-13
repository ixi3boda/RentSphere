import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Hero() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="relative min-h-[90vh] flex items-center overflow-hidden pt-20">
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 z-0">
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            x: [0, 50, 0],
            y: [0, -30, 0]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-zen-100 rounded-full blur-[120px] opacity-60"
        />
        <motion.div
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, -45, 0],
            x: [0, -40, 0],
            y: [0, 60, 0]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[5%] left-[-10%] w-[600px] h-[600px] bg-accent-warm rounded-full blur-[150px] opacity-50"
        />
        <motion.div
          animate={{ 
            scale: [1, 1.3, 1],
            y: [0, 100, 0]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute top-[20%] left-[20%] w-[300px] h-[300px] bg-zen-50 rounded-full blur-[100px] opacity-40"
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center space-x-2 bg-white/50 backdrop-blur-md border border-white/80 px-4 py-2 rounded-full mb-6 shadow-sm"
            >
              <span className="flex h-2 w-2 rounded-full bg-zen-500 animate-pulse"></span>
              <span className="text-sm font-semibold text-zen-700 tracking-wide uppercase">Safe & Trusted Rentals</span>
            </motion.div>

            <h1 className="text-6xl md:text-7xl font-extrabold leading-[1.1] mb-6 text-slate-900">
              Rent with <br />
              <span className="gradient-text">Absolute Trust.</span>
            </h1>
            
            <p className="text-xl text-slate-500 mb-10 max-w-lg leading-relaxed">
              Experience the next generation of property rentals with secure, transparent 
              contracts designed for your peace of mind.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              {!isAuthenticated && (
                <Link to="/signup" className="w-full sm:w-auto">
                  <motion.button
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className="btn-primary text-lg px-10 py-4 w-full"
                  >
                    Start Your Journey
                  </motion.button>
                </Link>
              )}

              <Link to="/properties" className="w-full sm:w-auto">
                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="btn-secondary text-lg px-10 py-4 w-full bg-white/80 backdrop-blur-md"
                >
                  Explore Homes
                </motion.button>
              </Link>
            </div>

            <div className="mt-12 flex items-center space-x-8">
              <StatItem label="Active Listings" value="2k+" />
              <div className="h-8 w-[1px] bg-slate-200"></div>
              <StatItem label="Trusted Users" value="15k+" />
              <div className="h-8 w-[1px] bg-slate-200"></div>
              <StatItem label="Success Rate" value="99%" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="hidden lg:block relative"
          >
            <div className="relative z-10 rounded-[2.5rem] overflow-hidden shadow-2xl border-[12px] border-white/50 bg-white">
              <img 
                src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1000" 
                alt="Modern House" 
                className="w-full h-[600px] object-cover hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent"></div>
              
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute bottom-8 left-8 right-8 glass-effect p-6 rounded-2xl border-white/40"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/80 text-sm font-medium mb-1">Featured Property</p>
                    <h3 className="text-white text-xl font-bold">The Azure Villa</h3>
                  </div>
                  <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20">
                    <span className="text-white font-bold">$3,500/mo</span>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Floating UI elements */}
            <motion.div
              animate={{ y: [0, 20, 0] }}
              transition={{ duration: 5, repeat: Infinity, delay: 0.5 }}
              className="absolute -top-6 -right-6 glass-effect p-4 rounded-2xl shadow-xl z-20 border-white/50"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="text-slate-900 font-bold text-sm">Contract Verified</p>
                  <p className="text-slate-500 text-xs">Legally Binding & Secure</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function StatItem({ label, value }) {
  return (
    <div>
      <p className="text-2xl font-bold text-slate-900 leading-none mb-1">{value}</p>
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">{label}</p>
    </div>
  );
}

export default Hero;