import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { AnimatedPage, AnimatedButton } from "../components/AnimatedPage";
import { motion } from "framer-motion";

function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [error, setError] = useState("");
  const { signup, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== repeatPassword) { setError("Passwords do not match."); return; }
    const result = await signup(name, email, password, phone, avatarUrl);
    if (result.success) navigate("/");
    else setError(result.error || "Signup failed. Please try again.");
  };

  return (
    <AnimatedPage>
      <div className="min-h-screen flex items-center justify-center py-20 px-4 relative overflow-hidden bg-slate-50/50">
        {/* Animated Background */}
        <div className="absolute inset-0 z-0">
          <motion.div animate={{ scale: [1, 1.3, 1], y: [0, 50, 0] }} transition={{ duration: 20, repeat: Infinity }} className="absolute -top-40 -left-20 w-[500px] h-[500px] bg-zen-100 rounded-full blur-[120px] opacity-60" />
          <motion.div animate={{ scale: [1, 1.2, 1], y: [0, -50, 0] }} transition={{ duration: 18, repeat: Infinity }} className="absolute -bottom-40 -right-20 w-[500px] h-[500px] bg-accent-warm rounded-full blur-[120px] opacity-60" />
        </div>

        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          className="relative z-10 bg-white rounded-[3rem] p-10 lg:p-14 max-w-2xl w-full shadow-2xl border border-slate-100"
        >
          <div className="text-center mb-12">
            <Link to="/" className="inline-block mb-8">
               <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto shadow-sm p-2 border border-slate-100">
                  <img src="/rentSphereLogo.png" alt="Logo" className="w-full h-full object-contain" />
               </div>
            </Link>
            <h2 className="text-4xl font-black text-slate-900 mb-3 tracking-tight">Create Account.</h2>
            <p className="text-slate-500 font-medium">Join the RentSphere community today</p>
          </div>

          {error && (
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="bg-red-50 border border-red-100 text-red-500 p-4 rounded-2xl mb-8 font-medium text-sm flex items-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span>{error}</span>
            </motion.div>
          )}

          <form className="space-y-8" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 ml-1">Full Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input-field h-14" placeholder="John Doe" required />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 ml-1">Email Address</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field h-14" placeholder="you@example.com" required />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 ml-1">Password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-field h-14" placeholder="••••••••" required />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 ml-1">Confirm Password</label>
                <input type="password" value={repeatPassword} onChange={(e) => setRepeatPassword(e.target.value)} className="input-field h-14" placeholder="••••••••" required />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 ml-1">Phone Number</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="input-field h-14" placeholder="Optional" />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 ml-1">Avatar URL</label>
                <input type="url" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} className="input-field h-14" placeholder="Optional" />
              </div>
            </div>

            <div className="pt-4">
              <AnimatedButton type="submit" loading={loading} className="!h-14 !rounded-2xl !text-lg !font-black !shadow-zen-500/30">
                Create My Account
              </AnimatedButton>
            </div>
          </form>

          <div className="mt-12 text-center pt-8 border-t border-slate-50">
            <p className="text-slate-500 font-medium">
              Already have an account?{' '}
              <Link to="/login" className="text-zen-600 font-bold hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatedPage>
  );
}

export default Signup;
