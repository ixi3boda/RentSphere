// src/pages/Signup.js
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AnimatedPage, AnimatedButton } from '../components/AnimatedPage';
import { motion } from 'framer-motion';

function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('tenant');
  const [error, setError] = useState('');
  const { signup, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    const result = await signup(name, email, password, role);
    
    if (result.success) {
      navigate('/');
    } else {
      setError('Signup failed. Please try again.');
    }
  };

  return (
    <AnimatedPage>
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-20 left-1/4 w-72 h-72 bg-rentsphere-teal rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
          <div className="absolute bottom-20 right-1/4 w-72 h-72 bg-rentsphere-orange rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-1000"></div>
        </div>

        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="glass-effect rounded-2xl p-8 max-w-md w-full space-y-8 shadow-2xl"
        >
          <div className="text-center">
            <motion.h2 
              initial={{ y: -20 }}
              animate={{ y: 0 }}
              className="text-4xl font-bold gradient-text mb-2"
            >
              Create Account
            </motion.h2>
            <p className="text-gray-600">Join RentSphere today</p>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded"
            >
              {error}
            </motion.div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <motion.input
                whileFocus={{ scale: 1.02 }}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field"
                placeholder="John Doe"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <motion.input
                whileFocus={{ scale: 1.02 }}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <motion.input
                whileFocus={{ scale: 1.02 }}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="Create a strong password"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                I am a
              </label>
              <motion.select 
                whileFocus={{ scale: 1.02 }}
                value={role} 
                onChange={(e) => setRole(e.target.value)}
                className="input-field cursor-pointer"
              >
                <option value="tenant">🏠 Tenant - Looking to rent</option>
                <option value="owner">🔑 Owner - Have properties to list</option>
              </motion.select>
            </div>

            <AnimatedButton type="submit" loading={loading}>
              Create Account
            </AnimatedButton>
          </form>

          <div className="text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-rentsphere-teal hover:text-rentsphere-orange font-semibold transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatedPage>
  );
}

export default Signup;