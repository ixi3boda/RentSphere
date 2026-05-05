// src/components/Hero.js
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

function Hero() {
  return (
    <div className="relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <motion.h1 
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5 }}
            className="text-5xl md:text-7xl font-bold mb-6"
          >
            <span className="gradient-text">Rent</span>
            <span className="text-gray-800"> with </span>
            <span className="gradient-text">Trust</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto"
          >
            Islamic rental contracts made simple. Find your perfect home or list your property with Ijara-based agreements.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="flex gap-4 justify-center flex-wrap"
          >
            <Link to="/signup">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn-primary text-lg px-8 py-3"
              >
                Get Started
              </motion.button>
            </Link>
            <Link to="/properties">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn-secondary text-lg px-8 py-3"
              >
                Browse Properties
              </motion.button>
            </Link>
          </motion.div>
        </motion.div>

        {/* Animated floating elements */}
        <motion.div
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="absolute top-20 left-10 opacity-20"
        >
          <div className="w-20 h-20 bg-rentsphere-teal rounded-full blur-2xl"></div>
        </motion.div>
        
        <motion.div
          animate={{ y: [0, 20, 0] }}
          transition={{ duration: 5, repeat: Infinity }}
          className="absolute bottom-20 right-10 opacity-20"
        >
          <div className="w-32 h-32 bg-rentsphere-orange rounded-full blur-2xl"></div>
        </motion.div>
      </div>
    </div>
  );
}

export default Hero;