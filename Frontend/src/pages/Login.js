import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AnimatedPage, AnimatedButton } from '../components/AnimatedPage';
import { motion } from 'framer-motion';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [staySignedIn, setStaySignedIn] = useState(false);
  const [error, setError] = useState('');
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const result = await login(email, password, staySignedIn);
    if (result.success) {
      const from = location.state?.from?.pathname;
      if (from) { navigate(from, { replace: true }); return; }
      const role = result.role || JSON.parse(sessionStorage.getItem('user') || localStorage.getItem('user') || '{}')?.role;
      if (role === 'admin')  { navigate('/admin/dashboard');  return; }
      navigate('/tenant/dashboard'); 
    } else {
      setError(result.error || 'Login failed. Please try again.');
    }
  };

  return (
    <AnimatedPage>
      <div className="min-h-screen flex items-center justify-center py-12 px-4 relative overflow-hidden bg-slate-50/50">
        {/* Animated Background */}
        <div className="absolute inset-0 z-0">
          <motion.div animate={{ scale: [1, 1.2, 1], x: [0, 30, 0] }} transition={{ duration: 15, repeat: Infinity }} className="absolute -top-20 -right-20 w-96 h-96 bg-zen-100 rounded-full blur-[100px] opacity-60" />
          <motion.div animate={{ scale: [1, 1.1, 1], x: [0, -30, 0] }} transition={{ duration: 12, repeat: Infinity }} className="absolute -bottom-20 -left-20 w-96 h-96 bg-accent-warm rounded-full blur-[100px] opacity-60" />
        </div>

        <motion.div 
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          className="relative z-10 bg-white rounded-[3rem] p-10 lg:p-14 max-w-lg w-full shadow-2xl border border-slate-100"
        >
          <div className="text-center mb-12">
            <Link to="/" className="inline-block mb-8">
               <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto shadow-sm p-2 border border-slate-100">
                  <img src="/rentSphereLogo.png" alt="Logo" className="w-full h-full object-contain" />
               </div>
            </Link>
            <h2 className="text-4xl font-black text-slate-900 mb-3 tracking-tight">Welcome Back.</h2>
            <p className="text-slate-500 font-medium">Please enter your details to sign in</p>
          </div>

          {error && (
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="bg-red-50 border border-red-100 text-red-500 p-4 rounded-2xl mb-8 font-medium text-sm flex items-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span>{error}</span>
            </motion.div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 ml-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field h-14"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2 ml-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Password</label>
                <Link to="#" className="text-[10px] font-bold text-zen-600 uppercase tracking-widest hover:underline">Forgot?</Link>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field h-14"
                placeholder="••••••••"
                required
              />
            </div>

            <div className="flex items-center space-x-3 ml-1">
              <input
                id="stay-signed-in"
                type="checkbox"
                checked={staySignedIn}
                onChange={(e) => setStaySignedIn(e.target.checked)}
                className="w-5 h-5 text-zen-500 border-slate-200 rounded-lg focus:ring-zen-500/20 transition-all cursor-pointer"
              />
              <label htmlFor="stay-signed-in" className="text-sm font-bold text-slate-600 cursor-pointer">Stay signed in</label>
            </div>

            <AnimatedButton type="submit" loading={loading} className="!h-14 !rounded-2xl !text-lg !font-black !shadow-zen-500/30">
              Sign In
            </AnimatedButton>
          </form>

          <div className="mt-12 text-center pt-8 border-t border-slate-50">
            <p className="text-slate-500 font-medium">
              Don't have an account?{' '}
              <Link to="/signup" className="text-zen-600 font-bold hover:underline">
                Create Account
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatedPage>
  );
}

export default Login;