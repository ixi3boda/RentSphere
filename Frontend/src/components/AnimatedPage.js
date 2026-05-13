import { motion } from 'framer-motion';

export const AnimatedPage = ({ children }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
};

export const LoadingSpinner = () => {
  return (
    <div className="flex justify-center items-center py-20">
      <div className="relative">
        <div className="animate-spin-slow rounded-full h-16 w-16 border-4 border-zen-100 border-t-zen-500 shadow-sm"></div>
        <div className="absolute inset-0 flex items-center justify-center">
           <div className="w-2 h-2 bg-zen-500 rounded-full animate-pulse"></div>
        </div>
      </div>
    </div>
  );
};

export const AnimatedButton = ({ children, onClick, loading = false, type = "button", className = "" }) => {
  return (
    <motion.button
      whileHover={{ scale: 1.01, y: -1 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      type={type}
      className={`btn-primary w-full relative overflow-hidden group transition-all duration-300 ${className}`}
      disabled={loading}
    >
      {loading ? (
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white"></div>
        </div>
      ) : (
        <span className="relative z-10 flex items-center justify-center space-x-2">
          {children}
        </span>
      )}
      <motion.div
        className="absolute inset-0 bg-white/10"
        initial={{ x: '-100%' }}
        whileHover={{ x: '100%' }}
        transition={{ duration: 0.6 }}
      />
    </motion.button>
  );
};

export const FloatingCard = ({ children, className = "" }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      whileHover={{ y: -4, shadow: "0 25px 50px -12px rgba(0, 0, 0, 0.05)" }}
      className={`bg-white rounded-[2rem] p-8 border border-slate-100 soft-shadow transition-all ${className}`}
    >
      {children}
    </motion.div>
  );
};